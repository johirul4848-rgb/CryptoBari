import { MarketSymbol, CandleData, Trade, UserWallet, UserProfile, NotificationItem, SupportTicket, AdminStats, Timeframe } from '../types';
import { binanceMarketData } from './binanceMarketData';

// Default initial high-liquidity symbols until dynamic Binance exchangeInfo completes
export const DEFAULT_SYMBOLS: MarketSymbol[] = [
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    displayPair: 'BTC/USDT',
    price: 88540.20,
    priceChangePercent: 2.34,
    high24h: 89400.00,
    low24h: 86320.50,
    volume24h: 34521.8,
    quoteVolume24h: 3045230000,
    pricePrecision: 2,
    payoutRate: 88,
    enabled: true,
    minInvestment: 1,
    maxInvestment: 2000,
    isFavorite: true,
  },
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    displayPair: 'ETH/USDT',
    price: 2465.45,
    priceChangePercent: 1.82,
    high24h: 2510.00,
    low24h: 2410.20,
    volume24h: 184520.4,
    quoteVolume24h: 454320000,
    pricePrecision: 2,
    payoutRate: 86,
    enabled: true,
    minInvestment: 1,
    maxInvestment: 2000,
    isFavorite: true,
  },
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    displayPair: 'SOL/USDT',
    price: 154.30,
    priceChangePercent: 4.15,
    high24h: 158.40,
    low24h: 147.80,
    volume24h: 843210.0,
    quoteVolume24h: 129432000,
    pricePrecision: 2,
    payoutRate: 85,
    enabled: true,
    minInvestment: 1,
    maxInvestment: 2000,
    isFavorite: true,
  },
  {
    symbol: 'BNBUSDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    displayPair: 'BNB/USDT',
    price: 585.10,
    priceChangePercent: -0.42,
    high24h: 592.00,
    low24h: 579.50,
    volume24h: 92340.5,
    quoteVolume24h: 54100000,
    pricePrecision: 2,
    payoutRate: 84,
    enabled: true,
    minInvestment: 1,
    maxInvestment: 1500,
  },
  {
    symbol: 'XRPUSDT',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    displayPair: 'XRP/USDT',
    price: 0.6145,
    priceChangePercent: 3.12,
    high24h: 0.6350,
    low24h: 0.5890,
    volume24h: 45210000.0,
    quoteVolume24h: 27500000,
    pricePrecision: 4,
    payoutRate: 83,
    enabled: true,
    minInvestment: 1,
    maxInvestment: 1500,
  },
  {
    symbol: 'DOGEUSDT',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    displayPair: 'DOGE/USDT',
    price: 0.12450,
    priceChangePercent: 5.60,
    high24h: 0.13100,
    low24h: 0.11600,
    volume24h: 120540000.0,
    quoteVolume24h: 14800000,
    pricePrecision: 5,
    payoutRate: 82,
    enabled: true,
    minInvestment: 1,
    maxInvestment: 1000,
  },
  {
    symbol: 'ADAUSDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    displayPair: 'ADA/USDT',
    price: 0.3840,
    priceChangePercent: -1.15,
    high24h: 0.3950,
    low24h: 0.3780,
    volume24h: 25410000.0,
    quoteVolume24h: 9800000,
    pricePrecision: 4,
    payoutRate: 82,
    enabled: true,
    minInvestment: 1,
    maxInvestment: 1000,
  },
  {
    symbol: 'TRXUSDT',
    baseAsset: 'TRX',
    quoteAsset: 'USDT',
    displayPair: 'TRX/USDT',
    price: 0.1582,
    priceChangePercent: 0.65,
    high24h: 0.1610,
    low24h: 0.1560,
    volume24h: 38900000.0,
    quoteVolume24h: 6150000,
    pricePrecision: 4,
    payoutRate: 80,
    enabled: true,
    minInvestment: 1,
    maxInvestment: 1000,
  },
  {
    symbol: 'LINKUSDT',
    baseAsset: 'LINK',
    quoteAsset: 'USDT',
    displayPair: 'LINK/USDT',
    price: 11.85,
    priceChangePercent: 1.45,
    high24h: 12.20,
    low24h: 11.45,
    volume24h: 1845000.0,
    quoteVolume24h: 21850000,
    pricePrecision: 2,
    payoutRate: 84,
    enabled: true,
    minInvestment: 1,
    maxInvestment: 1500,
  },
  {
    symbol: 'AVAXUSDT',
    baseAsset: 'AVAX',
    quoteAsset: 'USDT',
    displayPair: 'AVAX/USDT',
    price: 24.75,
    priceChangePercent: -2.10,
    high24h: 25.80,
    low24h: 24.10,
    volume24h: 2840000.0,
    quoteVolume24h: 70450000,
    pricePrecision: 2,
    payoutRate: 85,
    enabled: true,
    minInvestment: 1,
    maxInvestment: 1500,
  }
];

export class ApiService {
  private static instance: ApiService;
  private sseSource: EventSource | null = null;
  private binanceWs: WebSocket | null = null;
  private activeWsSymbol: string = '';
  private activeWsInterval: string = '1m';

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Get dynamic symbol list from server or Binance
  public async getSymbols(): Promise<MarketSymbol[]> {
    return await binanceMarketData.discoverAllSpotSymbols();
  }

  // Fetch initial klines
  public async getKlines(symbol: string, interval: string = '1m', limit: number = 100): Promise<CandleData[]> {
    return await binanceMarketData.fetchHistoricalCandles(symbol, interval as Timeframe, limit);
  }

  // Connect to Binance WebSocket directly for ultra low-latency candlestick updates
  public subscribeBinanceStream(
    symbol: string,
    interval: string,
    onPriceUpdate: (price: number, timestamp: number) => void,
    onCandleUpdate: (candle: CandleData) => void,
    onStatusChange: (status: 'LIVE' | 'RECONNECTING' | 'OFFLINE') => void
  ) {
    this.unsubscribeBinanceStream();
    this.activeWsSymbol = symbol.toLowerCase();
    this.activeWsInterval = interval;

    const streamName = `${this.activeWsSymbol}@kline_${interval}`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;

    onStatusChange('RECONNECTING');

    try {
      this.binanceWs = new WebSocket(wsUrl);

      this.binanceWs.onopen = () => {
        onStatusChange('LIVE');
      };

      this.binanceWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.e === 'kline' && data.k) {
            const k = data.k;
            const price = parseFloat(k.c);
            const timestamp = data.E || Date.now();
            onPriceUpdate(price, timestamp);

            const candle: CandleData = {
              time: Math.floor(k.t / 1000), // seconds
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
              volume: parseFloat(k.v),
            };
            onCandleUpdate(candle);
          }
        } catch {
          // ignore parse error
        }
      };

      this.binanceWs.onerror = () => {
        onStatusChange('RECONNECTING');
      };

      this.binanceWs.onclose = () => {
        onStatusChange('OFFLINE');
      };
    } catch {
      onStatusChange('OFFLINE');
    }
  }

  public unsubscribeBinanceStream() {
    if (this.binanceWs) {
      try {
        this.binanceWs.close();
      } catch {
        // ignore
      }
      this.binanceWs = null;
    }
  }

  // Place trade on backend (Authoritative)
  public async placeTrade(params: {
    symbol: string;
    displayPair: string;
    direction: 'UP' | 'DOWN';
    investment: number;
    durationSeconds: number;
    accountMode: 'DEMO' | 'LIVE';
    currentPrice: number;
  }): Promise<{ success: boolean; trade?: Trade; message?: string }> {
    try {
      const res = await fetch('/api/trades/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (res.ok) {
        return await res.json();
      } else {
        const error = await res.json();
        return { success: false, message: error.message || 'Failed to place trade' };
      }
    } catch {
      // If server route is in dev transition, execute client-authoritative demo trade fallback
      const entryTimestamp = Date.now();
      const expiryTimestamp = entryTimestamp + params.durationSeconds * 1000;
      const payoutRate = 85;
      const potentialPayout = params.investment * (1 + payoutRate / 100);

      const demoTrade: Trade = {
        id: 'CB-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        userId: 'demo_user',
        accountMode: params.accountMode,
        symbol: params.symbol,
        displayPair: params.displayPair,
        direction: params.direction,
        investment: params.investment,
        payoutRate,
        potentialPayout,
        entryPrice: params.currentPrice,
        entryTimestamp,
        expiryTimestamp,
        durationSeconds: params.durationSeconds,
        result: 'PENDING',
        profit: 0,
        status: 'ACTIVE',
        priceSource: {
          provider: 'BINANCE',
          market: 'SPOT',
          symbol: params.symbol,
        },
        createdAt: entryTimestamp,
      };

      return { success: true, trade: demoTrade };
    }
  }

  // Get active trades
  public async getActiveTrades(): Promise<Trade[]> {
    try {
      const res = await fetch('/api/trades/active');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      //
    }
    return [];
  }

  // Get trade history
  public async getTradeHistory(): Promise<Trade[]> {
    try {
      const res = await fetch('/api/trades/history');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      //
    }
    return [];
  }

  // Get wallet details
  public async getWallet(): Promise<UserWallet> {
    try {
      const res = await fetch('/api/wallet');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      //
    }
    return {
      demoBalance: 10000.0,
      liveBalance: 0.0,
      lockedBalance: 0.0,
      currency: 'USD',
    };
  }

  // Reset Demo Balance
  public async resetDemoBalance(): Promise<{ success: boolean; newBalance: number }> {
    try {
      const res = await fetch('/api/wallet/reset-demo', { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      //
    }
    return { success: true, newBalance: 10000.0 };
  }

  public async fetchMarketSymbols(): Promise<MarketSymbol[]> {
    return this.getSymbols();
  }

  public async fetchWallet(): Promise<UserWallet> {
    return this.getWallet();
  }

  public async fetchTrades(): Promise<Trade[]> {
    try {
      const active = await this.getActiveTrades();
      const history = await this.getTradeHistory();
      const map = new Map<string, Trade>();
      if (Array.isArray(history)) {
        for (const t of history) map.set(t.id, t);
      }
      if (Array.isArray(active)) {
        for (const t of active) map.set(t.id, t);
      }
      return Array.from(map.values());
    } catch {
      return [];
    }
  }

  public async createTrade(params: {
    symbol: string;
    displayPair: string;
    direction: 'UP' | 'DOWN';
    investment: number;
    durationSeconds: number;
    accountMode: 'DEMO' | 'LIVE';
    payoutRate?: number;
  }): Promise<Trade> {
    const res = await this.placeTrade({
      ...params,
      currentPrice: 0,
    });
    if (res.success && res.trade) {
      return res.trade;
    }
    throw new Error(res.message || 'Failed to create trade');
  }

  public subscribeAllTickers(onTickersUpdate: (symbols: MarketSymbol[]) => void): () => void {
    let ws: WebSocket | null = null;
    let isClosed = false;

    try {
      ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');
      ws.onmessage = (event) => {
        if (isClosed) return;
        try {
          const list = JSON.parse(event.data);
          if (Array.isArray(list)) {
            const updated: MarketSymbol[] = [];
            for (const item of list) {
              if (typeof item.s === 'string' && item.s.endsWith('USDT')) {
                const price = parseFloat(item.c);
                const close = parseFloat(item.c);
                const open = parseFloat(item.o);
                const change = open > 0 ? ((close - open) / open) * 100 : 0;
                updated.push({
                  symbol: item.s,
                  baseAsset: item.s.replace('USDT', ''),
                  quoteAsset: 'USDT',
                  displayPair: `${item.s.replace('USDT', '')}/USDT`,
                  price,
                  priceChangePercent: change,
                  high24h: parseFloat(item.h),
                  low24h: parseFloat(item.l),
                  volume24h: parseFloat(item.v),
                  quoteVolume24h: parseFloat(item.q),
                  pricePrecision: 2,
                  payoutRate: 85,
                  enabled: true,
                  minInvestment: 1,
                  maxInvestment: 2000,
                });
              }
            }
            if (updated.length > 0) {
              onTickersUpdate(updated);
            }
          }
        } catch {}
      };
    } catch {}

    return () => {
      isClosed = true;
      if (ws) {
        try {
          ws.close();
        } catch {}
      }
    };
  }
}

export const api = ApiService.getInstance();
export const apiService = api;
