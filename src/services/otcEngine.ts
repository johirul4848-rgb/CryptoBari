import { OtcAsset, OtcCategory, CandleData, Timeframe, MarketSymbol } from '../types';

export interface OtcTickEvent {
  symbol: string;
  price: number;
  timestamp: number;
  direction: 'UP' | 'DOWN';
  changePercent: number;
  volume: number;
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

export const ALL_SUPPORTED_TIMEFRAMES: Timeframe[] = [
  '5s',
  '10s',
  '15s',
  '30s',
  '1m',
  '5m',
  '15m',
  '30m',
  '1h',
  '4h',
  '1d',
];

interface InternalPairState {
  config: OtcAsset;
  currentPrice: number;
  basePrice: number;
  anchorPrice: number;
  drift: number;
  volatility: number;
  open24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  lastTickTimestamp: number;
  candles: Map<Timeframe, CandleData[]>;
  currentCandles: Map<Timeframe, CandleData>;
}

export const INITIAL_OTC_PAIRS: Omit<OtcAsset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ================= FOREX OTC =================
  {
    symbol: 'EURUSD_OTC',
    displayName: 'EUR/USD OTC',
    baseAsset: 'EUR',
    quoteAsset: 'USD',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 1,
    price: 1.08450,
    priceChangePercent: 0.32,
    pricePrecision: 5,
    volatility: 0.000045,
  },
  {
    symbol: 'GBPUSD_OTC',
    displayName: 'GBP/USD OTC',
    baseAsset: 'GBP',
    quoteAsset: 'USD',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 91,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 2,
    price: 1.29820,
    priceChangePercent: -0.18,
    pricePrecision: 5,
    volatility: 0.000055,
  },
  {
    symbol: 'USDJPY_OTC',
    displayName: 'USD/JPY OTC',
    baseAsset: 'USD',
    quoteAsset: 'JPY',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 92,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 3,
    price: 153.420,
    priceChangePercent: 0.45,
    pricePrecision: 3,
    volatility: 0.008,
  },
  {
    symbol: 'USDCHF_OTC',
    displayName: 'USD/CHF OTC',
    baseAsset: 'USD',
    quoteAsset: 'CHF',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 90,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 4,
    price: 0.89230,
    priceChangePercent: -0.12,
    pricePrecision: 5,
    volatility: 0.00004,
  },
  {
    symbol: 'AUDUSD_OTC',
    displayName: 'AUD/USD OTC',
    baseAsset: 'AUD',
    quoteAsset: 'USD',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 5,
    price: 0.65420,
    priceChangePercent: 0.68,
    pricePrecision: 5,
    volatility: 0.00005,
  },
  {
    symbol: 'NZDUSD_OTC',
    displayName: 'NZD/USD OTC',
    baseAsset: 'NZD',
    quoteAsset: 'USD',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 91,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 6,
    price: 0.59850,
    priceChangePercent: 0.22,
    pricePrecision: 5,
    volatility: 0.000045,
  },
  {
    symbol: 'USDCAD_OTC',
    displayName: 'USD/CAD OTC',
    baseAsset: 'USD',
    quoteAsset: 'CAD',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 92,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 7,
    price: 1.37250,
    priceChangePercent: -0.25,
    pricePrecision: 5,
    volatility: 0.000048,
  },
  {
    symbol: 'EURGBP_OTC',
    displayName: 'EUR/GBP OTC',
    baseAsset: 'EUR',
    quoteAsset: 'GBP',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 90,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 8,
    price: 0.83540,
    priceChangePercent: 0.15,
    pricePrecision: 5,
    volatility: 0.000035,
  },
  {
    symbol: 'EURJPY_OTC',
    displayName: 'EUR/JPY OTC',
    baseAsset: 'EUR',
    quoteAsset: 'JPY',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 9,
    price: 166.450,
    priceChangePercent: 0.58,
    pricePrecision: 3,
    volatility: 0.009,
  },
  {
    symbol: 'GBPJPY_OTC',
    displayName: 'GBP/JPY OTC',
    baseAsset: 'GBP',
    quoteAsset: 'JPY',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 10,
    price: 199.200,
    priceChangePercent: 0.72,
    pricePrecision: 3,
    volatility: 0.012,
  },
  {
    symbol: 'AUDJPY_OTC',
    displayName: 'AUD/JPY OTC',
    baseAsset: 'AUD',
    quoteAsset: 'JPY',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 91,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 11,
    price: 100.350,
    priceChangePercent: 0.38,
    pricePrecision: 3,
    volatility: 0.007,
  },
  {
    symbol: 'EURCHF_OTC',
    displayName: 'EUR/CHF OTC',
    baseAsset: 'EUR',
    quoteAsset: 'CHF',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 90,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 12,
    price: 0.96780,
    priceChangePercent: 0.08,
    pricePrecision: 5,
    volatility: 0.000038,
  },
  {
    symbol: 'GBPCHF_OTC',
    displayName: 'GBP/CHF OTC',
    baseAsset: 'GBP',
    quoteAsset: 'CHF',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 92,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 13,
    price: 1.15850,
    priceChangePercent: -0.14,
    pricePrecision: 5,
    volatility: 0.000045,
  },
  {
    symbol: 'AUDCAD_OTC',
    displayName: 'AUD/CAD OTC',
    baseAsset: 'AUD',
    quoteAsset: 'CAD',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 14,
    price: 0.89840,
    priceChangePercent: 0.28,
    pricePrecision: 5,
    volatility: 0.000042,
  },
  {
    symbol: 'NZDJPY_OTC',
    displayName: 'NZD/JPY OTC',
    baseAsset: 'NZD',
    quoteAsset: 'JPY',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 92,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 15,
    price: 91.850,
    priceChangePercent: 0.35,
    pricePrecision: 3,
    volatility: 0.006,
  },
  {
    symbol: 'CADJPY_OTC',
    displayName: 'CAD/JPY OTC',
    baseAsset: 'CAD',
    quoteAsset: 'JPY',
    category: 'FOREX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 92,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 16,
    price: 111.750,
    priceChangePercent: 0.18,
    pricePrecision: 3,
    volatility: 0.007,
  },

  // ================= CRYPTO OTC =================
  {
    symbol: 'BTCUSDT_OTC',
    displayName: 'BTC/USDT OTC',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    category: 'CRYPTO',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 90,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 14,
    price: 88450.00,
    priceChangePercent: 1.85,
    pricePrecision: 2,
    volatility: 3.5,
  },
  {
    symbol: 'ETHUSDT_OTC',
    displayName: 'ETH/USDT OTC',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    category: 'CRYPTO',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 92,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 15,
    price: 3120.50,
    priceChangePercent: 2.15,
    pricePrecision: 2,
    volatility: 0.28,
  },
  {
    symbol: 'BNBUSDT_OTC',
    displayName: 'BNB/USDT OTC',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    category: 'CRYPTO',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 91,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 16,
    price: 645.20,
    priceChangePercent: 0.95,
    pricePrecision: 2,
    volatility: 0.08,
  },
  {
    symbol: 'SOLUSDT_OTC',
    displayName: 'SOL/USDT OTC',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    category: 'CRYPTO',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 17,
    price: 178.40,
    priceChangePercent: 3.42,
    pricePrecision: 2,
    volatility: 0.065,
  },
  {
    symbol: 'XRPUSDT_OTC',
    displayName: 'XRP/USDT OTC',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    category: 'CRYPTO',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 92,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 18,
    price: 0.7240,
    priceChangePercent: 4.10,
    pricePrecision: 4,
    volatility: 0.00035,
  },
  {
    symbol: 'DOGEUSDT_OTC',
    displayName: 'DOGE/USDT OTC',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    category: 'CRYPTO',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 19,
    price: 0.14250,
    priceChangePercent: 5.20,
    pricePrecision: 5,
    volatility: 0.00012,
  },
  {
    symbol: 'ADAUSDT_OTC',
    displayName: 'ADA/USDT OTC',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    category: 'CRYPTO',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 90,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 20,
    price: 0.4680,
    priceChangePercent: 1.15,
    pricePrecision: 4,
    volatility: 0.00028,
  },
  {
    symbol: 'TRXUSDT_OTC',
    displayName: 'TRX/USDT OTC',
    baseAsset: 'TRX',
    quoteAsset: 'USDT',
    category: 'CRYPTO',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 91,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 21,
    price: 0.16850,
    priceChangePercent: 0.85,
    pricePrecision: 5,
    volatility: 0.0001,
  },
  {
    symbol: 'LINKUSDT_OTC',
    displayName: 'LINK/USDT OTC',
    baseAsset: 'LINK',
    quoteAsset: 'USDT',
    category: 'CRYPTO',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 92,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 22,
    price: 14.85,
    priceChangePercent: 2.80,
    pricePrecision: 2,
    volatility: 0.012,
  },
  {
    symbol: 'AVAXUSDT_OTC',
    displayName: 'AVAX/USDT OTC',
    baseAsset: 'AVAX',
    quoteAsset: 'USDT',
    category: 'CRYPTO',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 91,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 23,
    price: 32.40,
    priceChangePercent: 1.95,
    pricePrecision: 2,
    volatility: 0.025,
  },

  // ================= COMMODITY OTC =================
  {
    symbol: 'XAUUSD_OTC',
    displayName: 'GOLD/USD OTC',
    baseAsset: 'GOLD',
    quoteAsset: 'USD',
    category: 'COMMODITY',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 24,
    price: 2745.50,
    priceChangePercent: 0.82,
    pricePrecision: 2,
    volatility: 0.35,
  },
  {
    symbol: 'XAGUSD_OTC',
    displayName: 'SILVER/USD OTC',
    baseAsset: 'SILVER',
    quoteAsset: 'USD',
    category: 'COMMODITY',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 92,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 25,
    price: 32.850,
    priceChangePercent: 1.45,
    pricePrecision: 3,
    volatility: 0.008,
  },
  {
    symbol: 'USOIL_OTC',
    displayName: 'OIL/USD OTC',
    baseAsset: 'OIL',
    quoteAsset: 'USD',
    category: 'COMMODITY',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 91,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 26,
    price: 73.60,
    priceChangePercent: -0.65,
    pricePrecision: 2,
    volatility: 0.015,
  },

  // ================= INDEX & OTHER OTC =================
  {
    symbol: 'SPX500_OTC',
    displayName: 'US 500 OTC',
    baseAsset: 'SPX',
    quoteAsset: 'USD',
    category: 'INDEX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 27,
    price: 5890.20,
    priceChangePercent: 0.42,
    pricePrecision: 2,
    volatility: 0.45,
  },
  {
    symbol: 'NAS100_OTC',
    displayName: 'US TECH 100 OTC',
    baseAsset: 'NAS',
    quoteAsset: 'USD',
    category: 'INDEX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 28,
    price: 20450.00,
    priceChangePercent: 0.78,
    pricePrecision: 2,
    volatility: 1.8,
  },
  {
    symbol: 'US30_OTC',
    displayName: 'DOW JONES 30 OTC',
    baseAsset: 'US30',
    quoteAsset: 'USD',
    category: 'INDEX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 29,
    price: 43750.00,
    priceChangePercent: 0.54,
    pricePrecision: 2,
    volatility: 2.4,
  },
  {
    symbol: 'GER40_OTC',
    displayName: 'GERMANY 40 OTC',
    baseAsset: 'GER40',
    quoteAsset: 'EUR',
    category: 'INDEX',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 92,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 30,
    price: 19320.00,
    priceChangePercent: 0.32,
    pricePrecision: 2,
    volatility: 1.5,
  },
  {
    symbol: 'V75_OTC',
    displayName: 'VOLATILITY 75 OTC',
    baseAsset: 'V75',
    quoteAsset: 'USD',
    category: 'OTHER',
    type: 'OTC',
    status: 'ACTIVE',
    payoutRate: 93,
    priceSource: 'OTC_SYNTHETIC',
    enabled: true,
    sortOrder: 31,
    price: 1025.40,
    priceChangePercent: 1.25,
    pricePrecision: 2,
    volatility: 0.22,
  },
];

export class OtcPriceEngine {
  private static instance: OtcPriceEngine;

  private pairs: Map<string, InternalPairState> = new Map();
  private defaultPayout: number = 93; // 93% max and default
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private dynamicPayoutTimer: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  // Listeners
  private tickListeners: Set<(tick: OtcTickEvent) => void> = new Set();
  private candleListeners: Set<(candle: CandleData, isNewBar: boolean, symbol: string, timeframe: Timeframe) => void> = new Set();
  private pairUpdatedListeners: Set<(pair: OtcAsset) => void> = new Set();

  public static getInstance(): OtcPriceEngine {
    if (!OtcPriceEngine.instance) {
      OtcPriceEngine.instance = new OtcPriceEngine();
    }
    return OtcPriceEngine.instance;
  }

  private constructor() {
    this.initializeDefaultPairs();
    this.start();
    this.startDynamicPayouts();
  }

  private initializeDefaultPairs() {
    const now = Date.now();
    this.pairs.clear();

    const top5OtcPairs: Omit<OtcAsset, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        symbol: 'EURUSD_OTC',
        displayName: 'EUR/USD OTC',
        baseAsset: 'EUR',
        quoteAsset: 'USD',
        category: 'FOREX',
        type: 'OTC',
        status: 'ACTIVE',
        payoutRate: 93,
        priceSource: 'OTC_SYNTHETIC',
        enabled: true,
        sortOrder: 1,
        price: 1.08450,
        priceChangePercent: 0.32,
        pricePrecision: 5,
        volatility: 0.000045,
      },
      {
        symbol: 'GBPUSD_OTC',
        displayName: 'GBP/USD OTC',
        baseAsset: 'GBP',
        quoteAsset: 'USD',
        category: 'FOREX',
        type: 'OTC',
        status: 'ACTIVE',
        payoutRate: 92,
        priceSource: 'OTC_SYNTHETIC',
        enabled: true,
        sortOrder: 2,
        price: 1.29820,
        priceChangePercent: -0.18,
        pricePrecision: 5,
        volatility: 0.000055,
      },
      {
        symbol: 'GOLD_OTC',
        displayName: 'GOLD/USD OTC',
        baseAsset: 'GOLD',
        quoteAsset: 'USD',
        category: 'COMMODITY',
        type: 'OTC',
        status: 'ACTIVE',
        payoutRate: 93,
        priceSource: 'OTC_SYNTHETIC',
        enabled: true,
        sortOrder: 3,
        price: 2945.50,
        priceChangePercent: 0.82,
        pricePrecision: 2,
        volatility: 0.35,
      },
      {
        symbol: 'BTCUSD_OTC',
        displayName: 'BTC/USD OTC',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        category: 'CRYPTO',
        type: 'OTC',
        status: 'ACTIVE',
        payoutRate: 93,
        priceSource: 'OTC_SYNTHETIC',
        enabled: true,
        sortOrder: 4,
        price: 88540.00,
        priceChangePercent: 2.15,
        pricePrecision: 2,
        volatility: 12.5,
      },
      {
        symbol: 'ETHUSD_OTC',
        displayName: 'ETH/USD OTC',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        category: 'CRYPTO',
        type: 'OTC',
        status: 'ACTIVE',
        payoutRate: 91,
        priceSource: 'OTC_SYNTHETIC',
        enabled: true,
        sortOrder: 5,
        price: 2465.40,
        priceChangePercent: 1.45,
        pricePrecision: 2,
        volatility: 1.8,
      },
    ];

    for (const item of top5OtcPairs) {
      const id = 'otc_' + item.symbol.toLowerCase();
      const asset: OtcAsset = {
        ...item,
        id,
        payoutRate: Math.min(93, item.payoutRate || this.defaultPayout),
        createdAt: now - 86400000 * 7,
        updatedAt: now,
      };

      this.registerPair(asset);
    }
  }

  private registerPair(asset: OtcAsset) {
    const basePrice = asset.price;
    const volatility = asset.volatility || basePrice * 0.0001;

    const state: InternalPairState = {
      config: asset,
      currentPrice: basePrice,
      basePrice,
      anchorPrice: basePrice,
      drift: 0,
      volatility,
      open24h: basePrice * (1 - (asset.priceChangePercent || 0) / 100),
      high24h: basePrice * 1.015,
      low24h: basePrice * 0.985,
      volume24h: Math.round(50000 + Math.random() * 200000),
      quoteVolume24h: Math.round(1500000 + Math.random() * 8000000),
      lastTickTimestamp: Date.now(),
      candles: new Map(),
      currentCandles: new Map(),
    };

    // Pre-generate historical candles for all timeframes
    this.seedHistoricalCandles(state);

    this.pairs.set(asset.symbol, state);
  }

  /**
   * Generates continuous, realistic historical candlestick data
   * backwards in time so newly loaded charts immediately have rich bars.
   */
  private seedHistoricalCandles(state: InternalPairState) {
    const nowSec = Math.floor(Date.now() / 1000);

    for (const tf of ALL_SUPPORTED_TIMEFRAMES) {
      const bucketSec = timeframeToSeconds(tf);
      const count = 200; // 200 bars of history
      const candles: CandleData[] = [];

      let runningPrice = state.currentPrice;
      const sigma = state.volatility * Math.sqrt(Math.max(1, bucketSec / 5));

      // Generate in reverse from current price backwards
      const tempBars: Array<{ open: number; high: number; low: number; close: number; volume: number }> = [];
      for (let i = 0; i < count; i++) {
        // Multi-frequency noise for realistic candle shapes
        const r1 = (Math.random() - 0.5) * sigma * 1.8;
        const r2 = (Math.random() - 0.5) * sigma * 0.8;
        const close = runningPrice;
        const open = Number((runningPrice - r1).toFixed(state.config.pricePrecision));
        const bodyHigh = Math.max(open, close);
        const bodyLow = Math.min(open, close);
        const wickUpper = Math.abs(r2) * 1.5;
        const wickLower = Math.abs(r1) * 1.2;

        const high = Number((bodyHigh + wickUpper).toFixed(state.config.pricePrecision));
        const low = Number((Math.max(0.00001, bodyLow - wickLower)).toFixed(state.config.pricePrecision));
        const volume = Number((10 + Math.random() * 150).toFixed(2));

        tempBars.unshift({ open, high, low, close, volume });
        runningPrice = open;
      }

      // Assign time buckets sequentially
      const currentBucketTime = Math.floor(nowSec / bucketSec) * bucketSec;
      for (let i = 0; i < tempBars.length; i++) {
        const barTime = currentBucketTime - (tempBars.length - 1 - i) * bucketSec;
        const bar = tempBars[i];
        candles.push({
          time: barTime,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume,
        });
      }

      state.candles.set(tf, candles);

      // Set the active real-time current candle
      const latestBar = candles[candles.length - 1];
      state.currentCandles.set(tf, { ...latestBar });
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // High frequency tick engine: ticks every 150ms for ultra-smooth movement
    const TICK_INTERVAL_MS = 150;
    this.tickTimer = setInterval(() => {
      this.step();
    }, TICK_INTERVAL_MS);
  }

  public stop() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.dynamicPayoutTimer) {
      clearInterval(this.dynamicPayoutTimer);
      this.dynamicPayoutTimer = null;
    }
    this.isRunning = false;
  }

  /**
   * Automatically fluctuates OTC payout rates between 85% and 93% (Quotex/Pocket Option broker style).
   * Ensures the platform feels dynamic and alive with hot pairs cycling regularly.
   */
  public startDynamicPayouts() {
    if (this.dynamicPayoutTimer) return;
    this.dynamicPayoutTimer = setInterval(() => {
      this.stepDynamicPayouts();
    }, 45000); // Dynamic update cycle every 45 seconds
  }

  private stepDynamicPayouts() {
    const pairs = Array.from(this.pairs.values()).filter(p => p.config.enabled && p.config.status === 'ACTIVE');
    if (pairs.length === 0) return;

    // Pick 2 to 4 pairs to subtly adjust their payout rate
    const countToUpdate = Math.min(pairs.length, Math.floor(Math.random() * 3) + 2);
    const shuffled = [...pairs].sort(() => Math.random() - 0.5).slice(0, countToUpdate);

    let updatedAny = false;
    for (const state of shuffled) {
      const current = state.config.payoutRate;
      // Step delta: +/- 1% or 2%
      const delta = (Math.random() > 0.45 ? 1 : -1) * (Math.random() > 0.65 ? 2 : 1);
      let nextRate = current + delta;

      // Bound strictly between 85% and 93%
      if (nextRate > 93) nextRate = 93;
      if (nextRate < 85) nextRate = 85;

      if (nextRate !== current) {
        state.config.payoutRate = nextRate;
        state.config.updatedAt = Date.now();
        updatedAny = true;

        for (const listener of this.pairUpdatedListeners) {
          listener({ ...state.config });
        }
      }
    }

    if (updatedAny && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cb_otc_pairs_updated'));
    }
  }

  /**
   * Engine cycle: updates synthetic prices organically using:
   * - Mean reversion (Ornstein-Uhlenbeck)
   * - Wandering trend momentum
   * - Realistic micro-movements
   * - Real-time candle updates
   */
  private step() {
    const now = Date.now();
    const nowSec = Math.floor(now / 1000);

    for (const state of this.pairs.values()) {
      if (!state.config.enabled || state.config.status !== 'ACTIVE') continue;

      const p = state.currentPrice;
      const precision = state.config.pricePrecision;
      const minStep = Math.pow(10, -precision);

      // 1. Slowly adjust trend momentum with dampening
      state.drift = state.drift * 0.96 + (Math.random() - 0.5) * state.volatility * 0.15;

      // 2. Mean-reversion pull towards moving anchor (keeps prices bounded naturally)
      const distFromAnchor = (state.anchorPrice - p) / state.basePrice;
      const meanReversionForce = distFromAnchor * state.volatility * 0.35;

      // 3. OTC Trap Mechanism: Synthetic liquidity traps around local extremes and candle ends
      // Does NOT read user trades; creates natural false breakouts and candle-end micro-wicks
      const current1mCandle = state.currentCandles.get('1m');
      let trapForce = 0;
      if (current1mCandle) {
        const candleAgeSec = (nowSec - current1mCandle.time) % 60;
        // In the final 8 seconds of a 1-minute candle, induce micro-rejection wicks (candle-end trap)
        if (candleAgeSec >= 52) {
          const displacement = p - current1mCandle.open;
          trapForce = -Math.sign(displacement) * state.volatility * 0.16;
        } else {
          // Fakeout trap near recent bar extremes
          if (p >= current1mCandle.high - minStep * 2) {
            trapForce = -state.volatility * 0.11;
          } else if (p <= current1mCandle.low + minStep * 2) {
            trapForce = state.volatility * 0.11;
          }
        }
      }

      // 4. Multi-component micro-movement
      const microNoise = (Math.random() - 0.5) * state.volatility;
      const stepDelta = state.drift + meanReversionForce + trapForce + microNoise;

      // Ensure at least 1 fractional tick of subtle motion
      let newPrice = p + stepDelta;
      if (Math.abs(newPrice - p) < minStep * 0.5) {
        newPrice += (Math.random() > 0.5 ? 1 : -1) * minStep;
      }
      newPrice = Number(newPrice.toFixed(precision));
      if (newPrice <= 0) newPrice = minStep;

      const direction: 'UP' | 'DOWN' = newPrice >= p ? 'UP' : 'DOWN';
      state.currentPrice = newPrice;
      state.config.price = newPrice;
      state.lastTickTimestamp = now;

      // Update 24h metrics smoothly
      if (newPrice > state.high24h) state.high24h = newPrice;
      if (newPrice < state.low24h) state.low24h = newPrice;
      state.volume24h += 0.5 + Math.random() * 2;
      state.quoteVolume24h += (0.5 + Math.random() * 2) * newPrice;

      if (state.open24h > 0) {
        state.config.priceChangePercent = Number(
          (((newPrice - state.open24h) / state.open24h) * 100).toFixed(2)
        );
      }

      // Update real-time moving candles for all timeframes
      const tickVol = Number((0.2 + Math.random() * 1.5).toFixed(2));
      for (const tf of ALL_SUPPORTED_TIMEFRAMES) {
        const bucketSec = timeframeToSeconds(tf);
        const candleBucketTime = Math.floor(nowSec / bucketSec) * bucketSec;

        let activeCandle = state.currentCandles.get(tf);
        const historyList = state.candles.get(tf) || [];

        let isNewBar = false;

        if (!activeCandle || candleBucketTime > activeCandle.time) {
          // Timeframe ended! Finalize previous candle and start next candle immediately
          if (activeCandle) {
            historyList.push({ ...activeCandle });
            if (historyList.length > 300) {
              historyList.shift();
            }
          }

          activeCandle = {
            time: candleBucketTime,
            open: newPrice,
            high: newPrice,
            low: newPrice,
            close: newPrice,
            volume: tickVol,
          };
          isNewBar = true;
          state.currentCandles.set(tf, activeCandle);
        } else {
          // Same bar moving in real-time
          activeCandle.high = Math.max(activeCandle.high, newPrice);
          activeCandle.low = Math.min(activeCandle.low, newPrice);
          activeCandle.close = newPrice;
          activeCandle.volume = Number((activeCandle.volume + tickVol).toFixed(2));
        }

        // Broadcast updated candle to listeners
        const candleSnapshot = { ...activeCandle };
        for (const listener of this.candleListeners) {
          listener(candleSnapshot, isNewBar, state.config.symbol, tf);
        }
      }

      // Broadcast tick
      const tickEvent: OtcTickEvent = {
        symbol: state.config.symbol,
        price: newPrice,
        timestamp: now,
        direction,
        changePercent: state.config.priceChangePercent,
        volume: tickVol,
      };

      for (const listener of this.tickListeners) {
        listener(tickEvent);
      }
    }
  }

  // =========================================================================
  // PUBLIC QUERY & SUBSCRIPTION METHODS
  // =========================================================================

  public onTick(callback: (tick: OtcTickEvent) => void): () => void {
    this.tickListeners.add(callback);
    return () => this.tickListeners.delete(callback);
  }

  public onCandle(
    callback: (candle: CandleData, isNewBar: boolean, symbol: string, timeframe: Timeframe) => void
  ): () => void {
    this.candleListeners.add(callback);
    return () => this.candleListeners.delete(callback);
  }

  public onPairUpdated(callback: (pair: OtcAsset) => void): () => void {
    this.pairUpdatedListeners.add(callback);
    return () => this.pairUpdatedListeners.delete(callback);
  }

  public getAllPairs(): OtcAsset[] {
    return Array.from(this.pairs.values())
      .map((s) => ({ ...s.config }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getPair(symbolOrId: string): OtcAsset | undefined {
    for (const state of this.pairs.values()) {
      if (state.config.symbol === symbolOrId || state.config.id === symbolOrId) {
        return { ...state.config };
      }
    }
    return undefined;
  }

  public getCurrentPrice(symbol: string): number {
    const state = this.pairs.get(symbol);
    return state ? state.currentPrice : 0;
  }

  public getHistoricalCandles(symbol: string, timeframe: Timeframe, limit: number = 150): CandleData[] {
    const state = this.pairs.get(symbol);
    if (!state) return [];
    const list = state.candles.get(timeframe) || [];
    const current = state.currentCandles.get(timeframe);

    const merged = [...list];
    if (current && (!merged.length || merged[merged.length - 1].time < current.time)) {
      merged.push({ ...current });
    }
    return merged.slice(-limit);
  }

  public toMarketSymbol(pair: OtcAsset): MarketSymbol {
    const state = this.pairs.get(pair.symbol);
    const cleanDisplayName = pair.displayName.toUpperCase().includes('OTC')
      ? pair.displayName
      : `${pair.displayName} OTC`;

    return {
      symbol: pair.symbol,
      baseAsset: pair.baseAsset,
      quoteAsset: pair.quoteAsset,
      displayPair: cleanDisplayName,
      price: pair.price,
      priceChangePercent: pair.priceChangePercent,
      high24h: state ? state.high24h : pair.price * 1.01,
      low24h: state ? state.low24h : pair.price * 0.99,
      volume24h: state ? state.volume24h : 50000,
      quoteVolume24h: state ? state.quoteVolume24h : 5000000,
      pricePrecision: pair.pricePrecision,
      payoutRate: pair.payoutRate,
      enabled: pair.enabled && pair.status === 'ACTIVE',
      minInvestment: 1,
      maxInvestment: 2000,
      isFavorite: false,
      isOtc: true,
      marketType: 'OTC',
      category: pair.category,
      otcCategory: pair.category,
      priceSource: 'OTC_SYNTHETIC',
      status: pair.status,
    };
  }

  public getAllAsMarketSymbols(): MarketSymbol[] {
    return this.getAllPairs().map((p) => this.toMarketSymbol(p));
  }

  // =========================================================================
  // ADMIN MANAGEMENT ACTIONS (WITH STRICT 93% CAP)
  // =========================================================================

  public getDefaultPayout(): number {
    return this.defaultPayout;
  }

  public setDefaultPayout(rate: number): number {
    // Maximum 93% mandate
    const capped = Math.max(1, Math.min(93, Number(rate) || 93));
    this.defaultPayout = capped;
    return this.defaultPayout;
  }

  public updatePair(idOrSymbol: string, updates: Partial<OtcAsset>): OtcAsset | undefined {
    for (const [sym, state] of this.pairs.entries()) {
      if (state.config.id === idOrSymbol || state.config.symbol === idOrSymbol || sym === idOrSymbol) {
        // Enforce maximum 93% payout
        let newPayout = state.config.payoutRate;
        if (updates.payoutRate !== undefined) {
          newPayout = Math.max(1, Math.min(93, Number(updates.payoutRate) || 93));
        }

        const updated: OtcAsset = {
          ...state.config,
          ...updates,
          payoutRate: newPayout,
          updatedAt: Date.now(),
        };

        state.config = updated;

        for (const listener of this.pairUpdatedListeners) {
          listener(updated);
        }

        return { ...updated };
      }
    }
    return undefined;
  }

  public createPair(input: Partial<OtcAsset>): OtcAsset {
    const now = Date.now();
    const cleanSym = (input.symbol || 'CUSTOM_OTC').toUpperCase().trim().replace(/[^A-Z0-9_]/g, '');
    const symbol = cleanSym.endsWith('_OTC') ? cleanSym : `${cleanSym}_OTC`;
    const id = 'otc_' + symbol.toLowerCase();

    // Default payout is 93%, capped at 93%
    const payoutRate = Math.max(1, Math.min(93, Number(input.payoutRate) || this.defaultPayout));
    const price = Math.max(0.00001, Number(input.price) || 1.0);
    const precision = input.pricePrecision !== undefined ? input.pricePrecision : 5;

    const newAsset: OtcAsset = {
      id,
      symbol,
      displayName: input.displayName || `${symbol.replace('_OTC', '')} OTC`,
      baseAsset: input.baseAsset || symbol.slice(0, 3),
      quoteAsset: input.quoteAsset || 'USD',
      category: (input.category as OtcCategory) || 'OTHER',
      type: 'OTC',
      status: input.status || 'ACTIVE',
      payoutRate,
      priceSource: 'OTC_SYNTHETIC',
      enabled: input.enabled !== undefined ? input.enabled : true,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : this.pairs.size + 1,
      price,
      priceChangePercent: 0,
      pricePrecision: precision,
      volatility: input.volatility || price * 0.0001,
      createdAt: now,
      updatedAt: now,
    };

    this.registerPair(newAsset);

    for (const listener of this.pairUpdatedListeners) {
      listener(newAsset);
    }

    return newAsset;
  }

  public deletePair(idOrSymbol: string): boolean {
    for (const [sym, state] of this.pairs.entries()) {
      if (state.config.id === idOrSymbol || state.config.symbol === idOrSymbol) {
        this.pairs.delete(sym);
        return true;
      }
    }
    return false;
  }

  public togglePairEnabled(idOrSymbol: string, enabled?: boolean): OtcAsset | undefined {
    const target = this.getPair(idOrSymbol);
    if (!target) return undefined;
    const newEnabled = enabled !== undefined ? enabled : !target.enabled;
    return this.updatePair(target.symbol, {
      enabled: newEnabled,
      status: newEnabled ? 'ACTIVE' : 'INACTIVE',
    });
  }
}

export const otcPriceEngine = OtcPriceEngine.getInstance();
