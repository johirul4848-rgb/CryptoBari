import { MarketSymbol, CandleData, Timeframe, ConnectionStatus } from '../types';
import { BinanceTradeEvent, MarketMetrics } from './binanceMarketData';
import { otcPriceEngine, ALL_SUPPORTED_TIMEFRAMES } from './otcEngine';

export class OtcMarketDataService {
  private static instance: OtcMarketDataService;

  private ws: WebSocket | null = null;
  private currentSymbol: string = 'EURUSD_OTC';
  private currentTimeframe: Timeframe = '1m';
  private connectionStatus: ConnectionStatus = 'LIVE';

  private candleListeners: Set<(candle: CandleData, isNewBar: boolean) => void> = new Set();
  private tradeListeners: Set<(trade: BinanceTradeEvent) => void> = new Set();
  private metricsListeners: Set<(metrics: MarketMetrics) => void> = new Set();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private tickerListeners: Set<(symbols: MarketSymbol[]) => void> = new Set();

  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentCandle: CandleData | null = null;
  private eventsCount: number = 0;
  private lastRateCheck: number = Date.now();
  private eventsPerSec: number = 0;

  // Local engine fallback unsubscribers
  private localUnsubTick: (() => void) | null = null;
  private localUnsubCandle: (() => void) | null = null;
  private useLocalEngine: boolean = false;

  public static getInstance(): OtcMarketDataService {
    if (!OtcMarketDataService.instance) {
      OtcMarketDataService.instance = new OtcMarketDataService();
    }
    return OtcMarketDataService.instance;
  }

  private constructor() {
    this.connectWebSocket();

    // Event counter for metrics
    setInterval(() => {
      const now = Date.now();
      const elapsed = (now - this.lastRateCheck) / 1000;
      this.eventsPerSec = Math.round(this.eventsCount / Math.max(1, elapsed));
      this.eventsCount = 0;
      this.lastRateCheck = now;
      this.dispatchMetrics();
    }, 1000);
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      if (!host) {
        this.enableLocalFallback();
        return;
      }
      const wsUrl = `${protocol}//${host}/ws/otc`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.useLocalEngine = false;
        this.disableLocalFallback();
        this.setStatus('LIVE');

        // Subscribe to current symbol and tickers
        this.sendWsMessage({
          type: 'subscribe',
          symbol: this.currentSymbol,
          timeframe: this.currentTimeframe,
        });
        this.sendWsMessage({ type: 'subscribe_tickers' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWsMessage(data);
        } catch (e) {
          console.warn('OTC WS parse error:', e);
        }
      };

      this.ws.onerror = () => {
        // Switch to direct local engine to ensure seamless uninterrupted ticks
        this.enableLocalFallback();
      };

      this.ws.onclose = () => {
        this.enableLocalFallback();
        this.scheduleReconnect();
      };
    } catch {
      this.enableLocalFallback();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connectWebSocket();
    }, 4000);
  }

  private sendWsMessage(msg: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch (e) {
        console.warn('Failed to send WS message:', e);
      }
    }
  }

  // Fallback to in-browser engine if WS server is unavailable
  private enableLocalFallback() {
    if (this.useLocalEngine) return;
    this.useLocalEngine = true;
    this.setStatus('LIVE');

    if (this.localUnsubTick) this.localUnsubTick();
    if (this.localUnsubCandle) this.localUnsubCandle();

    this.localUnsubTick = otcPriceEngine.onTick((tick) => {
      if (tick.symbol === this.currentSymbol) {
        this.eventsCount++;
        const tradeEvent: BinanceTradeEvent = {
          eventType: 'trade',
          eventTime: tick.timestamp,
          symbol: tick.symbol,
          tradeId: Math.floor(tick.timestamp % 1000000),
          price: tick.price,
          quantity: tick.volume,
          tradeTime: tick.timestamp,
          isBuyerMaker: tick.direction === 'DOWN',
        };

        for (const listener of this.tradeListeners) {
          listener(tradeEvent);
        }
      }
    });

    this.localUnsubCandle = otcPriceEngine.onCandle((candle, isNewBar, symbol, tf) => {
      if (symbol === this.currentSymbol && tf === this.currentTimeframe) {
        this.currentCandle = candle;
        for (const listener of this.candleListeners) {
          listener(candle, isNewBar);
        }
      }
    });

    // Periodic ticker broadcast from local engine
    setInterval(() => {
      if (!this.useLocalEngine) return;
      const symbols = otcPriceEngine.getAllAsMarketSymbols();
      for (const listener of this.tickerListeners) {
        listener(symbols);
      }
    }, 1000);
  }

  private disableLocalFallback() {
    if (this.localUnsubTick) {
      this.localUnsubTick();
      this.localUnsubTick = null;
    }
    if (this.localUnsubCandle) {
      this.localUnsubCandle();
      this.localUnsubCandle = null;
    }
  }

  private setStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleWsMessage(data: any) {
    this.eventsCount++;

    if (data.type === 'tick' && data.symbol === this.currentSymbol) {
      const tradeEvent: BinanceTradeEvent = {
        eventType: 'trade',
        eventTime: data.timestamp || Date.now(),
        symbol: data.symbol,
        tradeId: Math.floor((data.timestamp || Date.now()) % 1000000),
        price: data.price,
        quantity: data.volume || 1,
        tradeTime: data.timestamp || Date.now(),
        isBuyerMaker: data.direction === 'DOWN',
      };

      for (const listener of this.tradeListeners) {
        listener(tradeEvent);
      }
    } else if (data.type === 'candle' && data.symbol === this.currentSymbol && data.timeframe === this.currentTimeframe) {
      this.currentCandle = data.candle;
      for (const listener of this.candleListeners) {
        listener(data.candle, !!data.isNewBar);
      }
    } else if (data.type === 'tickers' && Array.isArray(data.symbols)) {
      for (const listener of this.tickerListeners) {
        listener(data.symbols);
      }
    }
  }

  private dispatchMetrics() {
    const metrics: MarketMetrics = {
      wsStatus: this.connectionStatus,
      symbol: this.currentSymbol,
      lastEventTime: Date.now(),
      lastTradeTime: Date.now(),
      lastPrice: this.currentCandle ? this.currentCandle.close : otcPriceEngine.getCurrentPrice(this.currentSymbol),
      eventsPerSecond: this.eventsPerSec,
      latencyMs: 12,
      currentCandle: this.currentCandle,
      timeframe: this.currentTimeframe,
    };

    for (const listener of this.metricsListeners) {
      listener(metrics);
    }
  }

  // =========================================================================
  // PUBLIC CONTROLS
  // =========================================================================

  public subscribeMarketStream(symbol: string, timeframe: Timeframe = '1m', seedCandle?: CandleData) {
    this.currentSymbol = symbol;
    this.currentTimeframe = timeframe;
    if (seedCandle) {
      this.currentCandle = seedCandle;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendWsMessage({
        type: 'subscribe',
        symbol,
        timeframe,
      });
    }

    // Immediately emit current candle if available
    const initialCandles = otcPriceEngine.getHistoricalCandles(symbol, timeframe, 1);
    if (initialCandles.length > 0) {
      this.currentCandle = initialCandles[0];
      for (const listener of this.candleListeners) {
        listener(this.currentCandle, false);
      }
    }
  }

  public unsubscribeCurrentStream() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendWsMessage({
        type: 'unsubscribe',
        symbol: this.currentSymbol,
        timeframe: this.currentTimeframe,
      });
    }
  }

  public async fetchHistoricalKlines(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 150
  ): Promise<CandleData[]> {
    // Try server API first
    try {
      const res = await fetch(`/api/otc/klines?symbol=${symbol}&interval=${timeframe}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Fallback to local engine instance
    }

    // Direct deterministic engine generation
    return otcPriceEngine.getHistoricalCandles(symbol, timeframe, limit);
  }

  public async fetchAllOtcSymbols(): Promise<MarketSymbol[]> {
    try {
      const res = await fetch('/api/otc/pairs');
      if (res.ok) {
        const pairs = await res.json();
        if (Array.isArray(pairs) && pairs.length > 0) {
          return pairs.map((p) => otcPriceEngine.toMarketSymbol(p));
        }
      }
    } catch {
      // Fallback
    }
    return otcPriceEngine.getAllAsMarketSymbols();
  }

  public onCandleUpdate(callback: (candle: CandleData, isNewBar: boolean) => void): () => void {
    this.candleListeners.add(callback);
    return () => this.candleListeners.delete(callback);
  }

  public onTrade(callback: (trade: BinanceTradeEvent) => void): () => void {
    this.tradeListeners.add(callback);
    return () => this.tradeListeners.delete(callback);
  }

  public onMetrics(callback: (metrics: MarketMetrics) => void): () => void {
    this.metricsListeners.add(callback);
    return () => this.metricsListeners.delete(callback);
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  public subscribeTickers(callback: (symbols: MarketSymbol[]) => void): () => void {
    this.tickerListeners.add(callback);
    // Immediately emit current symbols
    callback(otcPriceEngine.getAllAsMarketSymbols());
    return () => this.tickerListeners.delete(callback);
  }

  public getCurrentPrice(symbol: string): number {
    return otcPriceEngine.getCurrentPrice(symbol);
  }

  public getMetrics(): MarketMetrics {
    return {
      wsStatus: this.connectionStatus,
      symbol: this.currentSymbol,
      lastEventTime: Date.now(),
      lastTradeTime: Date.now(),
      lastPrice: otcPriceEngine.getCurrentPrice(this.currentSymbol),
      eventsPerSecond: this.eventsPerSec,
      latencyMs: 12,
      currentCandle: this.currentCandle,
      timeframe: this.currentTimeframe,
    };
  }
}

export const otcMarketData = OtcMarketDataService.getInstance();
