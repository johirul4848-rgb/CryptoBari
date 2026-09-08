import { MarketSymbol, CandleData, Timeframe, ConnectionStatus } from '../types';

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
  private activeTimeframe: Timeframe = '1m';
  private tradeWs: WebSocket | null = null;
  private wsStatus: ConnectionStatus = 'OFFLINE';
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionallyClosed: boolean = false;

  // Watchlist miniTicker WS
  private miniTickerWs: WebSocket | null = null;
  private miniTickerListeners: Set<(symbols: MarketSymbol[]) => void> = new Set();
  private allSymbolsMap: Map<string, MarketSymbol> = new Map();

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
  // 1. DYNAMIC BINANCE SYMBOL DISCOVERY
  // =========================================================================

  public async discoverAllSpotSymbols(): Promise<MarketSymbol[]> {
    try {
      // First try fetching exchangeInfo from Binance directly
      let exchangeInfoData: any = null;
      try {
        const res = await fetch('https://api.binance.com/api/v3/exchangeInfo?permissions=SPOT');
        if (res.ok) {
          exchangeInfoData = await res.json();
        }
      } catch {
        // Fallback to local server proxy if direct fetch is blocked by CORS/network
        const serverRes = await fetch('/api/markets/symbols');
        if (serverRes.ok) {
          const s = await serverRes.json();
          if (Array.isArray(s) && s.length > 0) {
            s.forEach(sym => this.allSymbolsMap.set(sym.symbol, sym));
            return s;
          }
        }
      }

      if (!exchangeInfoData || !Array.isArray(exchangeInfoData.symbols)) {
        return this.getFallbackSymbols();
      }

      // Fetch 24h ticker for initial price, volume, and % change
      let tickersMap: Map<string, any> = new Map();
      try {
        const tickerRes = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        if (tickerRes.ok) {
          const tickers: any[] = await tickerRes.json();
          tickers.forEach(t => tickersMap.set(t.symbol, t));
        }
      } catch {
        // Tickers fallback
      }

      const discovered: MarketSymbol[] = [];

      for (const item of exchangeInfoData.symbols) {
        // Only active Spot trading symbols
        if (item.status !== 'TRADING' || item.isSpotTradingAllowed === false) {
          continue;
        }

        // We focus primarily on USDT, FDUSD, BTC, USDC pairs
        const symbol = item.symbol;
        const baseAsset = item.baseAsset;
        const quoteAsset = item.quoteAsset;

        // Calculate precision and tick size from filters
        let tickSize = 0.01;
        let pricePrecision = 2;
        let minQty = 0.00001;
        let quantityPrecision = 4;

        if (Array.isArray(item.filters)) {
          const priceFilter = item.filters.find((f: any) => f.filterType === 'PRICE_FILTER');
          if (priceFilter && priceFilter.tickSize) {
            tickSize = parseFloat(priceFilter.tickSize);
            // Count decimals of tickSize
            const tickStr = priceFilter.tickSize.replace(/0+$/, '');
            const decIndex = tickStr.indexOf('.');
            if (decIndex !== -1) {
              pricePrecision = tickStr.length - decIndex - 1;
            } else {
              pricePrecision = 0;
            }
          }

          const lotSize = item.filters.find((f: any) => f.filterType === 'LOT_SIZE');
          if (lotSize && lotSize.minQty) {
            minQty = parseFloat(lotSize.minQty);
            const stepStr = (lotSize.stepSize || '0.0001').replace(/0+$/, '');
            const stepDec = stepStr.indexOf('.');
            if (stepDec !== -1) {
              quantityPrecision = stepStr.length - stepDec - 1;
            }
          }
        }

        const ticker = tickersMap.get(symbol);
        const lastPrice = ticker ? parseFloat(ticker.lastPrice) : 0;
        const priceChange = ticker ? parseFloat(ticker.priceChangePercent) : 0;
        const high24h = ticker ? parseFloat(ticker.highPrice) : lastPrice;
        const low24h = ticker ? parseFloat(ticker.lowPrice) : lastPrice;
        const volume24h = ticker ? parseFloat(ticker.volume) : 0;
        const quoteVolume24h = ticker ? parseFloat(ticker.quoteVolume) : 0;

        // Payout rate (high liquidity majors get 88%, others 80-85%)
        let payoutRate = 85;
        if (['BTCUSDT', 'ETHUSDT'].includes(symbol)) payoutRate = 88;
        else if (['SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT'].includes(symbol)) payoutRate = 86;
        else if (quoteVolume24h > 10000000) payoutRate = 84;
        else payoutRate = 82;

        const isFavorite = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'XRPUSDT'].includes(symbol);

        const marketSymbol: MarketSymbol = {
          symbol,
          baseAsset,
          quoteAsset,
          displayPair: `${baseAsset}/${quoteAsset}`,
          price: lastPrice,
          priceChangePercent: priceChange,
          high24h,
          low24h,
          volume24h,
          quoteVolume24h,
          pricePrecision,
          quantityPrecision,
          tickSize,
          minQty,
          status: item.status,
          payoutRate,
          enabled: true,
          minInvestment: 1,
          maxInvestment: symbol.startsWith('BTC') || symbol.startsWith('ETH') ? 5000 : 2000,
          isFavorite,
        };

        discovered.push(marketSymbol);
        this.allSymbolsMap.set(symbol, marketSymbol);
      }

      // Sort by quote volume descending
      discovered.sort((a, b) => b.quoteVolume24h - a.quoteVolume24h);

      return discovered;
    } catch (err) {
      console.warn('Failed to dynamically discover Binance symbols, using fallback list:', err);
      return this.getFallbackSymbols();
    }
  }

  private getFallbackSymbols(): MarketSymbol[] {
    const majors: Array<Partial<MarketSymbol> & { symbol: string; baseAsset: string; price: number; pricePrecision: number }> = [
      { symbol: 'BTCUSDT', baseAsset: 'BTC', price: 88540.20, pricePrecision: 2, payoutRate: 88 },
      { symbol: 'ETHUSDT', baseAsset: 'ETH', price: 2465.45, pricePrecision: 2, payoutRate: 88 },
      { symbol: 'SOLUSDT', baseAsset: 'SOL', price: 154.30, pricePrecision: 2, payoutRate: 86 },
      { symbol: 'BNBUSDT', baseAsset: 'BNB', price: 585.10, pricePrecision: 2, payoutRate: 85 },
      { symbol: 'XRPUSDT', baseAsset: 'XRP', price: 0.6145, pricePrecision: 4, payoutRate: 84 },
      { symbol: 'DOGEUSDT', baseAsset: 'DOGE', price: 0.12450, pricePrecision: 5, payoutRate: 84 },
      { symbol: 'ADAUSDT', baseAsset: 'ADA', price: 0.3840, pricePrecision: 4, payoutRate: 82 },
      { symbol: 'AVAXUSDT', baseAsset: 'AVAX', price: 24.75, pricePrecision: 2, payoutRate: 85 },
      { symbol: 'LINKUSDT', baseAsset: 'LINK', price: 11.85, pricePrecision: 2, payoutRate: 84 },
      { symbol: 'NEARUSDT', baseAsset: 'NEAR', price: 4.85, pricePrecision: 3, payoutRate: 83 },
      { symbol: 'SUIUSDT', baseAsset: 'SUI', price: 1.95, pricePrecision: 4, payoutRate: 85 },
      { symbol: 'PEPEUSDT', baseAsset: 'PEPE', price: 0.0000095, pricePrecision: 8, payoutRate: 82 },
    ];

    const list: MarketSymbol[] = majors.map(m => ({
      symbol: m.symbol,
      baseAsset: m.baseAsset,
      quoteAsset: 'USDT',
      displayPair: `${m.baseAsset}/USDT`,
      price: m.price,
      priceChangePercent: 2.5,
      high24h: m.price * 1.02,
      low24h: m.price * 0.98,
      volume24h: 10000,
      quoteVolume24h: 50000000,
      pricePrecision: m.pricePrecision,
      payoutRate: m.payoutRate || 85,
      enabled: true,
      minInvestment: 1,
      maxInvestment: 2000,
      status: 'TRADING',
      tickSize: 1 / Math.pow(10, m.pricePrecision),
      minQty: 0.001,
      isFavorite: true,
    }));

    list.forEach(s => this.allSymbolsMap.set(s.symbol, s));
    return list;
  }

  // =========================================================================
  // 2. WATCHLIST ALL-TICKER STREAM (!miniTicker@arr)
  // =========================================================================

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
              if (typeof item.s === 'string' && this.allSymbolsMap.has(item.s)) {
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
  }

  public subscribeMiniTickers(callback: (updated: MarketSymbol[]) => void): () => void {
    this.miniTickerListeners.add(callback);
    return () => {
      this.miniTickerListeners.delete(callback);
    };
  }

  // =========================================================================
  // 3. HISTORICAL CANDLE LOADING
  // =========================================================================

  public async fetchHistoricalCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 150
  ): Promise<CandleData[]> {
    const bucketSec = timeframeToSeconds(timeframe);

    // 1. If native interval, fetch directly from Binance
    if (isNativeBinanceInterval(timeframe)) {
      try {
        const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${timeframe}&limit=${limit}`;
        const res = await fetch(binanceUrl);
        if (res.ok) {
          const raw: (string | number)[][] = await res.json();
          if (Array.isArray(raw) && raw.length > 0) {
            return raw.map(item => ({
              time: Math.floor(Number(item[0]) / 1000),
              open: parseFloat(String(item[1])),
              high: parseFloat(String(item[2])),
              low: parseFloat(String(item[3])),
              close: parseFloat(String(item[4])),
              volume: parseFloat(String(item[5])),
            }));
          }
        }
      } catch (err) {
        console.warn('Direct Binance historical kline fetch failed, trying proxy:', err);
      }

      // Try server fallback
      try {
        const serverRes = await fetch(`/api/markets/klines?symbol=${symbol}&interval=${timeframe}&limit=${limit}`);
        if (serverRes.ok) {
          const candles = await serverRes.json();
          if (Array.isArray(candles) && candles.length > 0) {
            return candles;
          }
        }
      } catch {}
    }

    // 2. Sub-minute non-native intervals (e.g. 1s, 5s, 10s, 15s, 30s)
    // Fetch 1s klines from Binance and aggregate into buckets
    try {
      const oneSecUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=1s&limit=1000`;
      const oneSecRes = await fetch(oneSecUrl);
      if (oneSecRes.ok) {
        const raw1s: (string | number)[][] = await oneSecRes.json();
        if (Array.isArray(raw1s) && raw1s.length > 0) {
          return this.aggregateCandles(raw1s, bucketSec, limit);
        }
      }
    } catch {
      // ignore
    }

    // 3. Fallback: If 1s klines unavailable, fetch 1m klines and derive recent baseline
    try {
      const oneMinUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=1m&limit=30`;
      const oneMinRes = await fetch(oneMinUrl);
      if (oneMinRes.ok) {
        const raw1m: (string | number)[][] = await oneMinRes.json();
        if (Array.isArray(raw1m) && raw1m.length > 0) {
          const last1m = raw1m[raw1m.length - 1];
          const lastClose = parseFloat(String(last1m[4]));
          // Generate a smooth continuous series leading up to the exact current close
          const candles: CandleData[] = [];
          const nowSec = Math.floor(Date.now() / 1000);
          const alignedNow = Math.floor(nowSec / bucketSec) * bucketSec;

          let p = lastClose;
          for (let i = limit; i >= 0; i--) {
            const t = alignedNow - i * bucketSec;
            const delta = (Math.sin(i * 0.5) * 0.0005) * p;
            const open = p;
            const close = p + delta;
            const high = Math.max(open, close) + Math.abs(delta) * 0.2;
            const low = Math.min(open, close) - Math.abs(delta) * 0.2;
            candles.push({
              time: t,
              open,
              high,
              low,
              close,
              volume: 1.0,
            });
            p = close;
          }
          return candles;
        }
      }
    } catch {}

    return [];
  }

  private aggregateCandles(rawKlines: (string | number)[][], targetBucketSec: number, maxLimit: number): CandleData[] {
    const bucketMap: Map<number, CandleData> = new Map();

    for (const item of rawKlines) {
      const timeMs = Number(item[0]);
      const timeSec = Math.floor(timeMs / 1000);
      const bucketTime = Math.floor(timeSec / targetBucketSec) * targetBucketSec;

      const open = parseFloat(String(item[1]));
      const high = parseFloat(String(item[2]));
      const low = parseFloat(String(item[3]));
      const close = parseFloat(String(item[4]));
      const volume = parseFloat(String(item[5]));

      if (!bucketMap.has(bucketTime)) {
        bucketMap.set(bucketTime, {
          time: bucketTime,
          open,
          high,
          low,
          close,
          volume,
        });
      } else {
        const existing = bucketMap.get(bucketTime)!;
        existing.high = Math.max(existing.high, high);
        existing.low = Math.min(existing.low, low);
        existing.close = close;
        existing.volume += volume;
      }
    }

    const sorted = Array.from(bucketMap.values()).sort((a, b) => a.time - b.time);
    return sorted.slice(-maxLimit);
  }

  // =========================================================================
  // 4. LOWEST-LATENCY LIVE WEBSOCKET TRADE & CANDLE STREAM
  // =========================================================================

  public subscribeMarketStream(
    symbol: string,
    timeframe: Timeframe,
    initialLastCandle?: CandleData
  ) {
    // If already subscribing to identical symbol and timeframe with an open socket, return
    if (
      this.activeSymbol.toLowerCase() === symbol.toLowerCase() &&
      this.activeTimeframe === timeframe &&
      this.tradeWs &&
      (this.tradeWs.readyState === WebSocket.OPEN || this.tradeWs.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.activeSymbol = symbol.toUpperCase();
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

    this.connectTradeWebSocket();
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

    const s = this.activeSymbol.toLowerCase();
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

  /**
   * Deterministic client-side building candle engine.
   * Every Binance trade event immediately updates Open, High, Low, Close.
   * The visible candle moves UP and DOWN in real time without lag.
   */
  private handleIncomingTrade(trade: BinanceTradeEvent) {
    if (trade.symbol.toUpperCase() !== this.activeSymbol) return;

    this.eventCounter++;
    this.lastEventTime = trade.eventTime;
    this.lastTradeTime = trade.tradeTime;
    this.lastTradePrice = trade.price;

    const bucketSec = timeframeToSeconds(this.activeTimeframe);
    // Use Binance authoritative trade timestamp T
    const tradeSec = Math.floor(trade.tradeTime / 1000);
    const tradeBucketTime = Math.floor(tradeSec / bucketSec) * bucketSec;

    let isNewBar = false;

    if (!this.currentCandle) {
      // Start the very first candle
      this.currentCandle = {
        time: tradeBucketTime,
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
        volume: trade.quantity,
      };
      isNewBar = true;
    } else if (tradeBucketTime > this.currentCandle.time) {
      // Timeframe bucket ended! Finalize previous bar and immediately begin the next one
      this.currentCandle = {
        time: tradeBucketTime,
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
        volume: trade.quantity,
      };
      isNewBar = true;
    } else if (tradeBucketTime === this.currentCandle.time) {
      // Same candle moving UP and DOWN in real-time as Binance trades arrive!
      this.currentCandle.high = Math.max(this.currentCandle.high, trade.price);
      this.currentCandle.low = Math.min(this.currentCandle.low, trade.price);
      this.currentCandle.close = trade.price;
      this.currentCandle.volume += trade.quantity;
      isNewBar = false;
    } else {
      // Older out-of-order trade, ignore for candle building
      return;
    }

    // Broadcast trade event to listeners (e.g. top price flash, orderbook)
    for (const listener of this.tradeListeners) {
      listener(trade);
    }

    // Broadcast updated candle to chart series for immediate incremental update
    for (const listener of this.candleUpdateListeners) {
      listener({ ...this.currentCandle }, isNewBar);
    }

    this.broadcastMetrics();
  }

  /**
   * Kline stream confirmation for native intervals
   */
  private handleIncomingKline(data: any) {
    const k = data.k;
    if (!k || data.s.toUpperCase() !== this.activeSymbol) return;

    // We only use the kline to confirm high/low/volume boundaries for native intervals
    if (this.currentCandle && isNativeBinanceInterval(this.activeTimeframe)) {
      const klineTimeSec = Math.floor(k.t / 1000);
      if (this.currentCandle.time === klineTimeSec) {
        this.currentCandle.high = Math.max(this.currentCandle.high, parseFloat(k.h));
        this.currentCandle.low = Math.min(this.currentCandle.low, parseFloat(k.l));
        this.currentCandle.volume = Math.max(this.currentCandle.volume, parseFloat(k.v));
      }
    }
  }

  // =========================================================================
  // 6. SUBSCRIBER REGISTRATION
  // =========================================================================

  public onTrade(callback: (trade: BinanceTradeEvent) => void): () => void {
    this.tradeListeners.add(callback);
    return () => this.tradeListeners.delete(callback);
  }

  public onCandleUpdate(callback: (candle: CandleData, isNewBar: boolean) => void): () => void {
    this.candleUpdateListeners.add(callback);
    return () => this.candleUpdateListeners.delete(callback);
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    // Emit current status immediately
    callback(this.wsStatus);
    return () => this.statusListeners.delete(callback);
  }

  public onMetrics(callback: (metrics: MarketMetrics) => void): () => void {
    this.metricsListeners.add(callback);
    return () => this.metricsListeners.delete(callback);
  }

  private setWsStatus(status: ConnectionStatus) {
    if (this.wsStatus !== status) {
      this.wsStatus = status;
      for (const listener of this.statusListeners) {
        listener(status);
      }
      this.broadcastMetrics();
    }
  }

  private broadcastMetrics() {
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
      listener(metrics);
    }
  }

  public unsubscribeCurrentStream() {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
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
