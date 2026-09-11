import { MarketSymbol, CandleData, Timeframe, ConnectionStatus } from '../types';
import {
  generateInitialLiveSymbols,
  resolveLiveMarketSymbol,
  ALL_LIVE_CONFIGS,
  LIVE_CONFIG_MAP,
} from '../constants/liveMarketPairs';
import {
  OTC_BINANCE_MAPPINGS,
  OtcUnderlyingConfig,
  resolveUnderlyingSymbol,
} from '../constants/otcMappings';

export { OTC_BINANCE_MAPPINGS, resolveUnderlyingSymbol };
export type { OtcUnderlyingConfig };

export interface BinanceTradeEvent {
  eventType: string;       // 'aggTrade' or 'trade'
  eventTime: number;       // Binance E timestamp (ms)
  symbol: string;          // e.g. 'BTCUSDT'
  tradeId: number;         // a
  price: number;           // p
  quantity: number;        // q
  tradeTime: number;       // T timestamp (ms)
  isBuyerMaker: boolean;   // m
}

export interface BinanceKlineEvent {
  eventTime: number;       // E
  symbol: string;
  startTime: number;       // t (ms)
  closeTime: number;       // T (ms)
  interval: string;        // i
  open: number;            // o
  close: number;           // c
  high: number;            // h
  low: number;             // l
  volume: number;          // v
  isClosed: boolean;       // x
}

export interface MarketMetrics {
  wsStatus: ConnectionStatus;
  symbol: string;
  lastEventTime: number;     // ms
  lastTradeTime: number;     // ms
  lastPrice: number;
  eventsPerSecond: number;
  latencyMs: number;         // Date.now() - eventTime
  currentCandle: CandleData | null;
  timeframe: Timeframe;
}

export function timeframeToSeconds(tf: Timeframe): number {
  switch (tf) {
    case '1s': return 1;
    case '5s': return 5;
    case '10s': return 10;
    case '15s': return 15;
    case '30s': return 30;
    case '1m': return 60;
    case '5m': return 300;
    case '15m': return 900;
    case '30m': return 1800;
    case '1h': return 3600;
    case '4h': return 14400;
    case '1d': return 86400;
    default: return 60;
  }
}

export function isNativeBinanceInterval(tf: Timeframe): boolean {
  return ['1s', '1m', '5m', '15m', '30m', '1h', '4h', '1d'].includes(tf);
}

export function formatPriceByPrecision(price: number, precision: number = 2): string {
  if (isNaN(price) || price === null || price === undefined) return '0.00';
  if (precision <= 4) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  }
  // For small prices like PEPE, DOGE, SHIB
  return price.toFixed(precision);
}

export class BinanceMarketDataManager {
  private static instance: BinanceMarketDataManager;

  // Active terminal stream
  private activeSymbol: string = 'BTCUSDT';
  private underlyingSymbol: string = 'BTCUSDT';
  private activeMultiplier: number = 1.0;
  private activePrecision: number = 2;
  private activeTimeframe: Timeframe = '1m';
  private tradeWs: WebSocket | null = null;
  private wsStatus: ConnectionStatus = 'OFFLINE';
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionallyClosed: boolean = false;

  // High-frequency sub-second simulation timer for synthetic/trap pairs
  private syntheticSimTimer: ReturnType<typeof setInterval> | null = null;

  // Watchlist miniTicker WS & ticker loop
  private miniTickerWs: WebSocket | null = null;
  private miniTickerListeners: Set<(symbols: MarketSymbol[]) => void> = new Set();
  private allSymbolsMap: Map<string, MarketSymbol> = new Map();
  private nonBinanceTickerTimer: ReturnType<typeof setInterval> | null = null;

  // Current Candle Engine State
  private currentCandle: CandleData | null = null;
  private lastTradePrice: number = 0;
  private lastTradeTime: number = 0;
  private lastEventTime: number = 0;
  private lastMessageReceivedTime: number = 0;

  // Performance & Debug Metrics
  private eventCounter: number = 0;
  private eventsPerSecond: number = 0;
  private metricsTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  // Subscribers
  private tradeListeners: Set<(trade: BinanceTradeEvent) => void> = new Set();
  private candleUpdateListeners: Set<(candle: CandleData, isNewBar: boolean) => void> = new Set();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private metricsListeners: Set<(metrics: MarketMetrics) => void> = new Set();

  public static getInstance(): BinanceMarketDataManager {
    if (!BinanceMarketDataManager.instance) {
      BinanceMarketDataManager.instance = new BinanceMarketDataManager();
    }
    return BinanceMarketDataManager.instance;
  }

  private constructor() {
    // Seed symbols map initially with comprehensive live pairs
    const initialPairs = generateInitialLiveSymbols();
    initialPairs.forEach(s => this.allSymbolsMap.set(s.symbol, s));

    // Start rolling events-per-second counter
    this.metricsTimer = setInterval(() => {
      this.eventsPerSecond = this.eventCounter;
      this.eventCounter = 0;
      this.broadcastMetrics();
    }, 1000);

    // Heartbeat / Stale data tracker
    this.heartbeatTimer = setInterval(() => {
      if (this.wsStatus === 'LIVE') {
        const timeSinceLastMsg = Date.now() - this.lastMessageReceivedTime;
        if (timeSinceLastMsg > 6000 && this.lastMessageReceivedTime > 0) {
          this.setWsStatus('DELAYED');
        }
      }
    }, 1500);

    // Start mini-ticker stream for global symbols
    this.startMiniTickerStream();
  }

  // =========================================================================
  // 1. DYNAMIC BINANCE & LIVE SYMBOL DISCOVERY
  // =========================================================================

  public async discoverAllSpotSymbols(): Promise<MarketSymbol[]> {
    try {
      // Ensure seed list of curated live pairs is always present
      const initialLive = generateInitialLiveSymbols();
      initialLive.forEach(sym => {
        if (!this.allSymbolsMap.has(sym.symbol)) {
          this.allSymbolsMap.set(sym.symbol, sym);
        }
      });

      // Try fetching live 24hr tickers from Binance
      let tickersMap: Map<string, any> = new Map();
      try {
        const tickerRes = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        if (tickerRes.ok) {
          const tickers: any[] = await tickerRes.json();
          tickers.forEach(t => tickersMap.set(t.symbol, t));
        }
      } catch {
        // Fallback to local server proxy
        try {
          const serverRes = await fetch('/api/markets/symbols');
          if (serverRes.ok) {
            const serverSymbols: MarketSymbol[] = await serverRes.json();
            serverSymbols.forEach(s => {
              this.allSymbolsMap.set(s.symbol, s);
            });
            return Array.from(this.allSymbolsMap.values());
          }
        } catch {}
      }

      // Update direct Binance symbols and mapped Forex/Commodity underlyings
      this.allSymbolsMap.forEach((sym) => {
        const resolved = resolveLiveMarketSymbol(sym.symbol);
        const ticker = tickersMap.get(resolved.underlying);
        if (ticker) {
          const rawPrice = parseFloat(ticker.lastPrice) * resolved.multiplier;
          sym.price = Number(rawPrice.toFixed(resolved.precision));
          sym.priceChangePercent = parseFloat(ticker.priceChangePercent);
          sym.high24h = Number((parseFloat(ticker.highPrice) * resolved.multiplier).toFixed(resolved.precision));
          sym.low24h = Number((parseFloat(ticker.lowPrice) * resolved.multiplier).toFixed(resolved.precision));
          sym.volume24h = parseFloat(ticker.volume);
          sym.quoteVolume24h = parseFloat(ticker.quoteVolume);
        }
      });

      const discovered = Array.from(this.allSymbolsMap.values());
      // Sort by payout rate descending, then quote volume descending
      discovered.sort((a, b) => {
        const rateDiff = (b.payoutRate || 0) - (a.payoutRate || 0);
        if (rateDiff !== 0) return rateDiff;
        return (b.quoteVolume24h || 0) - (a.quoteVolume24h || 0);
      });

      return discovered;
    } catch (err) {
      console.warn('Failed to dynamically discover live symbols, using initial curated list:', err);
      return Array.from(this.allSymbolsMap.values());
    }
  }

  // =========================================================================
  // 2. WATCHLIST ALL-TICKER STREAM (!miniTicker@arr)
  // =========================================================================

  public registerLiveSymbols(symbols: MarketSymbol[]) {
    for (const sym of symbols) {
      this.allSymbolsMap.set(sym.symbol, sym);
    }
  }

  public registerOtcSymbols(symbols: MarketSymbol[]) {
    this.registerLiveSymbols(symbols);
  }

  private startMiniTickerStream() {
    const connect = () => {
      try {
        this.miniTickerWs = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');

        this.miniTickerWs.onmessage = (event) => {
          try {
            const rawList = JSON.parse(event.data);
            if (!Array.isArray(rawList)) return;

            const updated: MarketSymbol[] = [];

            for (const item of rawList) {
              if (typeof item.s !== 'string') continue;

              // 1. Direct match (e.g. BTCUSDT, ETHUSDT, SOLUSDT)
              if (this.allSymbolsMap.has(item.s)) {
                const s = this.allSymbolsMap.get(item.s)!;
                const close = parseFloat(item.c);
                const open = parseFloat(item.o);
                const high = parseFloat(item.h);
                const low = parseFloat(item.l);
                const vol = parseFloat(item.v);
                const qVol = parseFloat(item.q);
                const pct = open > 0 ? ((close - open) / open) * 100 : s.priceChangePercent;

                s.price = close;
                s.priceChangePercent = pct;
                s.high24h = high;
                s.low24h = low;
                s.volume24h = vol;
                s.quoteVolume24h = qVol;

                updated.push({ ...s });
              }

              // 2. Mapped underlying pairs (e.g. EURUSD -> EURUSDT, GBPUSD -> GBPUSDT, XAUUSD -> PAXGUSDT)
              this.allSymbolsMap.forEach((sym) => {
                const resolved = resolveLiveMarketSymbol(sym.symbol);
                if (resolved.underlying === item.s && sym.symbol !== item.s) {
                  const close = parseFloat(item.c) * resolved.multiplier;
                  const open = parseFloat(item.o) * resolved.multiplier;
                  const high = parseFloat(item.h) * resolved.multiplier;
                  const low = parseFloat(item.l) * resolved.multiplier;
                  const pct = open > 0 ? ((close - open) / open) * 100 : sym.priceChangePercent;

                  sym.price = Number(close.toFixed(resolved.precision));
                  sym.priceChangePercent = pct;
                  sym.high24h = Number(high.toFixed(resolved.precision));
                  sym.low24h = Number(low.toFixed(resolved.precision));
                  updated.push({ ...sym });
                }
              });
            }

            if (updated.length > 0) {
              for (const listener of this.miniTickerListeners) {
                listener(updated);
              }
            }
          } catch {
            // ignore
          }
        };

        this.miniTickerWs.onerror = () => {
          try { this.miniTickerWs?.close(); } catch {}
        };

        this.miniTickerWs.onclose = () => {
          setTimeout(connect, 3000);
        };
      } catch {
        setTimeout(connect, 5000);
      }
    };

    connect();

    // Background micro-tick updater for custom Volatility & Trap Indices so watchlist values stay active
    if (!this.nonBinanceTickerTimer) {
      this.nonBinanceTickerTimer = setInterval(() => {
        const customUpdates: MarketSymbol[] = [];
        this.allSymbolsMap.forEach((sym) => {
          const resolved = resolveLiveMarketSymbol(sym.symbol);
          if (!resolved.isDirectBinance) {
            const jitter = (Math.random() - 0.495) * 0.0006;
            sym.price = Number((sym.price * (1 + jitter)).toFixed(resolved.precision));
            customUpdates.push({ ...sym });
          }
        });
        if (customUpdates.length > 0) {
          for (const listener of this.miniTickerListeners) {
            listener(customUpdates);
          }
        }
      }, 1500);
    }
  }

  public subscribeMiniTickers(callback: (updated: MarketSymbol[]) => void): () => void {
    this.miniTickerListeners.add(callback);
    return () => {
      this.miniTickerListeners.delete(callback);
    };
  }

  // =========================================================================
  // 3. HISTORICAL CANDLES (NATIVE & SYNTHETIC)
  // =========================================================================

  public async fetchHistoricalCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 150
  ): Promise<CandleData[]> {
    const upperSym = symbol.toUpperCase();
    const resolved = resolveLiveMarketSymbol(upperSym);
    const bucketSec = timeframeToSeconds(timeframe);

    // If pair is not directly on Binance, generate authentic realistic technical candles
    if (!resolved.isDirectBinance) {
      return this.generateSyntheticCandles(upperSym, bucketSec, limit);
    }

    const { underlying, multiplier, precision } = resolved;

    const applyMultiplier = (candles: CandleData[]): CandleData[] => {
      if (multiplier === 1.0 && !precision) return candles;
      const prec = precision ?? 2;
      return candles.map(c => ({
        ...c,
        open: Number((c.open * multiplier).toFixed(prec)),
        high: Number((c.high * multiplier).toFixed(prec)),
        low: Number((c.low * multiplier).toFixed(prec)),
        close: Number((c.close * multiplier).toFixed(prec)),
      }));
    };

    // 1. If native interval, fetch directly from Binance
    if (isNativeBinanceInterval(timeframe)) {
      try {
        const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${underlying}&interval=${timeframe}&limit=${limit}`;
        const res = await fetch(binanceUrl);
        if (res.ok) {
          const raw: (string | number)[][] = await res.json();
          if (Array.isArray(raw) && raw.length > 0) {
            const mapped = raw.map(item => ({
              time: Math.floor(Number(item[0]) / 1000),
              open: parseFloat(String(item[1])),
              high: parseFloat(String(item[2])),
              low: parseFloat(String(item[3])),
              close: parseFloat(String(item[4])),
              volume: parseFloat(String(item[5])),
            }));
            return applyMultiplier(mapped);
          }
        }
      } catch (err) {
        console.warn('Direct Binance historical kline fetch failed, trying proxy:', err);
      }

      // Try server fallback
      try {
        const serverRes = await fetch(`/api/markets/klines?symbol=${underlying}&interval=${timeframe}&limit=${limit}`);
        if (serverRes.ok) {
          const candles = await serverRes.json();
          if (Array.isArray(candles) && candles.length > 0) {
            return applyMultiplier(candles);
          }
        }
      } catch {}
    }

    // 2. Sub-minute non-native intervals (1s, 5s, 10s, 15s, 30s)
    try {
      const oneSecUrl = `https://api.binance.com/api/v3/klines?symbol=${underlying}&interval=1s&limit=1000`;
      const oneSecRes = await fetch(oneSecUrl);
      if (oneSecRes.ok) {
        const raw1s: (string | number)[][] = await oneSecRes.json();
        if (Array.isArray(raw1s) && raw1s.length > 0) {
          const aggregated = this.aggregateCandles(raw1s, bucketSec, limit);
          return applyMultiplier(aggregated);
        }
      }
    } catch {}

    // Fallback: Generate continuous series
    return this.generateSyntheticCandles(upperSym, bucketSec, limit);
  }

  private generateSyntheticCandles(symbol: string, bucketSec: number, limit: number): CandleData[] {
    const symObj = this.allSymbolsMap.get(symbol);
    const targetPrice = symObj ? symObj.price : 100;
    const prec = symObj?.pricePrecision ?? 2;
    const candles: CandleData[] = [];
    const nowSec = Math.floor(Date.now() / 1000);
    const alignedNow = Math.floor(nowSec / bucketSec) * bucketSec;

    const volatility = symbol.includes('VOL') || symbol.includes('BOOM') || symbol.includes('CRASH') ? 0.0025 : 0.0006;
    let p = targetPrice * (1 - (Math.random() * 0.02 - 0.01));

    for (let i = limit; i >= 0; i--) {
      const t = alignedNow - i * bucketSec;
      const wave = Math.sin(i * 0.15) * volatility * 0.7;
      const noise = (Math.random() - 0.49) * volatility;
      const delta = (wave + noise) * p;
      const open = p;
      const close = i === 0 ? targetPrice : p + delta;
      const maxOC = Math.max(open, close);
      const minOC = Math.min(open, close);
      const high = maxOC + Math.random() * volatility * p * 0.8;
      const low = minOC - Math.random() * volatility * p * 0.8;

      candles.push({
        time: t,
        open: Number(open.toFixed(prec)),
        high: Number(high.toFixed(prec)),
        low: Number(low.toFixed(prec)),
        close: Number(close.toFixed(prec)),
        volume: Math.floor(100 + Math.random() * 5000),
      });
      p = close;
    }
    return candles;
  }

  private aggregateCandles(raw1s: (string | number)[][], bucketSec: number, limit: number): CandleData[] {
    const bucketsMap = new Map<number, CandleData>();

    for (const item of raw1s) {
      const timeMs = Number(item[0]);
      const sec = Math.floor(timeMs / 1000);
      const bucketTime = Math.floor(sec / bucketSec) * bucketSec;

      const o = parseFloat(String(item[1]));
      const h = parseFloat(String(item[2]));
      const l = parseFloat(String(item[3]));
      const c = parseFloat(String(item[4]));
      const v = parseFloat(String(item[5]));

      const existing = bucketsMap.get(bucketTime);
      if (!existing) {
        bucketsMap.set(bucketTime, {
          time: bucketTime,
          open: o,
          high: h,
          low: l,
          close: c,
          volume: v,
        });
      } else {
        existing.high = Math.max(existing.high, h);
        existing.low = Math.min(existing.low, l);
        existing.close = c;
        existing.volume += v;
      }
    }

    const sorted = Array.from(bucketsMap.values()).sort((a, b) => a.time - b.time);
    return sorted.slice(-limit);
  }

  // =========================================================================
  // 4. ACTIVE STREAM SUBSCRIPTION & REAL-TIME WS CONNECTION
  // =========================================================================

  public subscribeMarketStream(
    symbol: string,
    timeframe: Timeframe,
    initialLastCandle?: CandleData
  ) {
    return this.subscribeSymbol(symbol, timeframe, initialLastCandle);
  }

  public subscribeSymbol(
    symbol: string,
    timeframe: Timeframe,
    initialLastCandle?: CandleData
  ) {
    const upperSym = symbol.toUpperCase();
    const resolved = resolveLiveMarketSymbol(upperSym);

    // If identical active symbol and timeframe with open WS, ignore duplicate
    if (
      this.activeSymbol === upperSym &&
      this.activeTimeframe === timeframe &&
      this.tradeWs &&
      (this.tradeWs.readyState === WebSocket.OPEN || this.tradeWs.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.activeSymbol = upperSym;
    this.underlyingSymbol = resolved.underlying;
    this.activeMultiplier = resolved.multiplier;
    this.activePrecision = resolved.precision;
    this.activeTimeframe = timeframe;

    // Reset current candle state or seed with initialLastCandle
    const bucketSec = timeframeToSeconds(timeframe);
    const nowSec = Math.floor(Date.now() / 1000);
    const currentBucketTime = Math.floor(nowSec / bucketSec) * bucketSec;

    if (initialLastCandle && initialLastCandle.time === currentBucketTime) {
      this.currentCandle = { ...initialLastCandle };
      this.lastTradePrice = initialLastCandle.close;
    } else {
      this.currentCandle = null;
    }

    // Clean up previous simulation loop
    if (this.syntheticSimTimer) {
      clearInterval(this.syntheticSimTimer);
      this.syntheticSimTimer = null;
    }

    if (!resolved.isDirectBinance) {
      // High-volatility / Forex sub-second real-time tick loop
      this.startSyntheticTickLoop(upperSym, resolved.precision, resolved.isTrap);
    } else {
      // Connect to native Binance combined stream
      this.connectTradeWebSocket();
    }
  }

  private startSyntheticTickLoop(symbol: string, precision: number, isTrap: boolean) {
    if (this.tradeWs) {
      try { this.tradeWs.close(); } catch {}
      this.tradeWs = null;
    }

    this.setWsStatus('LIVE');
    this.lastMessageReceivedTime = Date.now();

    const symObj = this.allSymbolsMap.get(symbol);
    let currentP = symObj ? symObj.price : (this.lastTradePrice || 100);

    // Ultra-fast sub-second tick loop (every 130ms for pure sub-second responsiveness!)
    this.syntheticSimTimer = setInterval(() => {
      const now = Date.now();
      this.lastMessageReceivedTime = now;

      // Volatility & trap calculations:
      // If isTrap: inject sudden micro-wick spikes, sudden micro-reversals
      const isSpike = isTrap && Math.random() < 0.08;
      const isWickTrap = isTrap && Math.random() < 0.12;

      let deltaPct = (Math.random() - 0.495) * 0.0008;
      if (isSpike) {
        deltaPct = (Math.random() > 0.5 ? 1 : -1) * (0.0025 + Math.random() * 0.0035);
      } else if (isWickTrap) {
        deltaPct = -deltaPct * 2.5; // Fast rejection wick
      }

      currentP = currentP * (1 + deltaPct);
      const roundedPrice = Number(currentP.toFixed(precision));

      this.handleIncomingTrade({
        eventType: 'trade',
        eventTime: now,
        symbol: symbol,
        tradeId: now,
        price: roundedPrice,
        quantity: +(0.1 + Math.random() * 2).toFixed(4),
        tradeTime: now,
        isBuyerMaker: deltaPct < 0,
      });

      if (symObj) {
        symObj.price = roundedPrice;
      }
    }, 130);
  }

  private connectTradeWebSocket() {
    if (this.tradeWs) {
      try {
        this.tradeWs.onopen = null;
        this.tradeWs.onmessage = null;
        this.tradeWs.onerror = null;
        this.tradeWs.onclose = null;
        this.tradeWs.close();
      } catch {}
      this.tradeWs = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.setWsStatus('RECONNECTING');

    const s = this.underlyingSymbol.toLowerCase();
    // Use Binance Combined Streams: aggTrade for lowest-latency sub-millisecond execution ticks
    // plus kline stream when native interval is active
    let streams = `${s}@aggTrade`;
    if (isNativeBinanceInterval(this.activeTimeframe)) {
      streams += `/${s}@kline_${this.activeTimeframe}`;
    }

    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      const ws = new WebSocket(wsUrl);
      this.tradeWs = ws;

      ws.onopen = () => {
        if (this.tradeWs !== ws) return;
        this.reconnectAttempts = 0;
        this.setWsStatus('LIVE');
        this.lastMessageReceivedTime = Date.now();
      };

      ws.onmessage = (msgEvent) => {
        if (this.tradeWs !== ws) return;
        this.lastMessageReceivedTime = Date.now();

        if (this.wsStatus !== 'LIVE') {
          this.setWsStatus('LIVE');
        }

        try {
          const envelope = JSON.parse(msgEvent.data);
          const data = envelope.data || envelope;

          if (data.e === 'aggTrade' || data.e === 'trade') {
            this.handleIncomingTrade({
              eventType: data.e,
              eventTime: Number(data.E),
              symbol: data.s,
              tradeId: Number(data.a || data.t),
              price: parseFloat(data.p),
              quantity: parseFloat(data.q),
              tradeTime: Number(data.T || data.E),
              isBuyerMaker: Boolean(data.m),
            });
          } else if (data.e === 'kline' && data.k) {
            this.handleIncomingKline(data);
          }
        } catch {
          // parse error
        }
      };

      ws.onerror = (err) => {
        if (this.tradeWs !== ws) return;
        console.warn('Binance WebSocket error:', err);
      };

      ws.onclose = () => {
        if (this.tradeWs !== ws) return;
        this.tradeWs = null;

        if (!this.isIntentionallyClosed) {
          this.setWsStatus('RECONNECTING');
          this.scheduleReconnect();
        } else {
          this.setWsStatus('OFFLINE');
        }
      };
    } catch (err) {
      console.error('Failed to instantiate Binance WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isIntentionallyClosed) return;
    this.reconnectAttempts++;
    const delay = Math.min(500 * Math.pow(1.5, this.reconnectAttempts), 5000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectTradeWebSocket();
    }, delay);
  }

  // =========================================================================
  // 5. CURRENT CANDLE ENGINE (REAL-TIME MOVING CANDLE)
  // =========================================================================

  private handleIncomingTrade(trade: BinanceTradeEvent) {
    if (trade.symbol.toUpperCase() !== this.underlyingSymbol && trade.symbol.toUpperCase() !== this.activeSymbol) return;

    // Calculate effective price scaled by multiplier and precision
    const rawPrice = trade.price * this.activeMultiplier;
    const effectivePrice = Number(rawPrice.toFixed(this.activePrecision));
    const effectiveQty = trade.quantity;

    this.eventCounter++;
    this.lastEventTime = trade.eventTime;
    this.lastTradeTime = trade.tradeTime;
    this.lastTradePrice = effectivePrice;

    const bucketSec = timeframeToSeconds(this.activeTimeframe);
    const tradeSec = Math.floor(trade.tradeTime / 1000);
    const tradeBucketTime = Math.floor(tradeSec / bucketSec) * bucketSec;

    let isNewBar = false;

    if (!this.currentCandle) {
      // Start the very first candle
      this.currentCandle = {
        time: tradeBucketTime,
        open: effectivePrice,
        high: effectivePrice,
        low: effectivePrice,
        close: effectivePrice,
        volume: effectiveQty,
      };
      isNewBar = true;
    } else if (tradeBucketTime > this.currentCandle.time) {
      // Time bucket expired: Complete previous candle and open brand new one
      const completedCandle = { ...this.currentCandle };
      this.broadcastCandleUpdate(completedCandle, false);

      this.currentCandle = {
        time: tradeBucketTime,
        open: effectivePrice,
        high: effectivePrice,
        low: effectivePrice,
        close: effectivePrice,
        volume: effectiveQty,
      };
      isNewBar = true;
    } else {
      // Existing active candle: update High, Low, Close, Volume in real time
      this.currentCandle.close = effectivePrice;
      if (effectivePrice > this.currentCandle.high) {
        this.currentCandle.high = effectivePrice;
      }
      if (effectivePrice < this.currentCandle.low) {
        this.currentCandle.low = effectivePrice;
      }
      this.currentCandle.volume += effectiveQty;
    }

    // Broadcast live candle update to chart and trade listeners
    this.broadcastTrade(trade);
    if (this.currentCandle) {
      this.broadcastCandleUpdate({ ...this.currentCandle }, isNewBar);
    }
  }

  private handleIncomingKline(data: any) {
    const k = data.k;
    if (!k) return;
    if (data.s.toUpperCase() !== this.underlyingSymbol) return;

    // Only apply if interval matches active timeframe
    if (k.i !== this.activeTimeframe) return;

    const bucketSec = timeframeToSeconds(this.activeTimeframe);
    const startTimeSec = Math.floor(Number(k.t) / 1000);
    const bucketTime = Math.floor(startTimeSec / bucketSec) * bucketSec;

    const o = Number((parseFloat(k.o) * this.activeMultiplier).toFixed(this.activePrecision));
    const h = Number((parseFloat(k.h) * this.activeMultiplier).toFixed(this.activePrecision));
    const l = Number((parseFloat(k.l) * this.activeMultiplier).toFixed(this.activePrecision));
    const c = Number((parseFloat(k.c) * this.activeMultiplier).toFixed(this.activePrecision));
    const v = parseFloat(k.v);

    this.lastTradePrice = c;

    const candle: CandleData = {
      time: bucketTime,
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v,
    };

    const isNew = !this.currentCandle || bucketTime > this.currentCandle.time;
    this.currentCandle = candle;
    this.broadcastCandleUpdate({ ...candle }, isNew);
  }

  // =========================================================================
  // 6. SUBSCRIBER MANAGEMENT & BROADCASTS
  // =========================================================================

  public onTrade(callback: (trade: BinanceTradeEvent) => void): () => void {
    this.tradeListeners.add(callback);
    return () => {
      this.tradeListeners.delete(callback);
    };
  }

  public onCandleUpdate(callback: (candle: CandleData, isNewBar: boolean) => void): () => void {
    this.candleUpdateListeners.add(callback);
    return () => {
      this.candleUpdateListeners.delete(callback);
    };
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.wsStatus);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public onMetrics(callback: (metrics: MarketMetrics) => void): () => void {
    this.metricsListeners.add(callback);
    return () => {
      this.metricsListeners.delete(callback);
    };
  }

  private broadcastTrade(trade: BinanceTradeEvent) {
    for (const listener of this.tradeListeners) {
      try {
        listener(trade);
      } catch (err) {
        console.error('Error in trade subscriber:', err);
      }
    }
  }

  private broadcastCandleUpdate(candle: CandleData, isNewBar: boolean) {
    for (const listener of this.candleUpdateListeners) {
      try {
        listener(candle, isNewBar);
      } catch (err) {
        console.error('Error in candle update subscriber:', err);
      }
    }
  }

  private setWsStatus(status: ConnectionStatus) {
    if (this.wsStatus === status) return;
    this.wsStatus = status;
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch (err) {
        console.error('Error in status subscriber:', err);
      }
    }
  }

  private broadcastMetrics() {
    if (this.metricsListeners.size === 0) return;
    const latency = this.lastEventTime > 0 ? Math.max(0, Date.now() - this.lastEventTime) : 0;
    const metrics: MarketMetrics = {
      wsStatus: this.wsStatus,
      symbol: this.activeSymbol,
      lastEventTime: this.lastEventTime,
      lastTradeTime: this.lastTradeTime,
      lastPrice: this.lastTradePrice,
      eventsPerSecond: this.eventsPerSecond,
      latencyMs: latency,
      currentCandle: this.currentCandle ? { ...this.currentCandle } : null,
      timeframe: this.activeTimeframe,
    };

    for (const listener of this.metricsListeners) {
      try {
        listener(metrics);
      } catch (err) {
        console.error('Error in metrics subscriber:', err);
      }
    }
  }

  // =========================================================================
  // 7. CLEANUP & CONTROL
  // =========================================================================

  public unsubscribeCurrentStream() {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.syntheticSimTimer) {
      clearInterval(this.syntheticSimTimer);
      this.syntheticSimTimer = null;
    }
    if (this.tradeWs) {
      try {
        this.tradeWs.onopen = null;
        this.tradeWs.onmessage = null;
        this.tradeWs.onerror = null;
        this.tradeWs.onclose = null;
        this.tradeWs.close();
      } catch {}
      this.tradeWs = null;
    }
    this.setWsStatus('OFFLINE');
  }

  public getCurrentPrice(): number {
    return this.lastTradePrice;
  }

  public getCurrentCandle(): CandleData | null {
    return this.currentCandle ? { ...this.currentCandle } : null;
  }

  public getStatus(): ConnectionStatus {
    return this.wsStatus;
  }
}

export const binanceMarketData = BinanceMarketDataManager.getInstance();
