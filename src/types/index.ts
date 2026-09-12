export type TradeDirection = 'UP' | 'DOWN';
export type TradeResult = 'WIN' | 'LOSS' | 'TIE' | 'PENDING';
export type TradeStatus = 'ACTIVE' | 'SETTLED' | 'CANCELLED';
export type AccountMode = 'DEMO' | 'LIVE';
export type ConnectionStatus = 'LIVE' | 'RECONNECTING' | 'OFFLINE' | 'DELAYED';
export type Timeframe = '1s' | '5s' | '10s' | '15s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export type OtcCategory = 'FOREX' | 'CRYPTO' | 'COMMODITY' | 'INDEX' | 'OTHER';

export interface OtcAsset {
  id: string;
  symbol: string;         // e.g. 'EURUSD_OTC', 'BTCUSDT_OTC'
  displayName: string;    // e.g. 'EUR/USD OTC'
  baseAsset: string;      // 'EUR'
  quoteAsset: string;     // 'USD'
  category: OtcCategory;
  type: 'OTC';
  status: 'ACTIVE' | 'INACTIVE';
  payoutRate: number;     // max 93%, default 93%
  priceSource: string;    // 'OTC_SYNTHETIC'
  enabled: boolean;
  sortOrder: number;
  price: number;
  priceChangePercent: number;
  pricePrecision: number;
  volatility?: number;
  createdAt: number;
  updatedAt: number;
}

export interface MarketSymbol {
  symbol: string;         // e.g. 'BTCUSDT' or 'EURUSD_OTC'
  baseAsset: string;      // e.g. 'BTC' or 'EUR'
  quoteAsset: string;     // e.g. 'USDT' or 'USD'
  displayPair: string;    // e.g. 'BTC/USDT' or 'EUR/USD OTC'
  price: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  pricePrecision: number;
  quantityPrecision?: number;
  tickSize?: number;
  minQty?: number;
  status?: string;        // e.g. 'TRADING' or 'ACTIVE'
  payoutRate: number;     // e.g. 85 or 93 (%)
  enabled: boolean;
  minInvestment: number;
  maxInvestment: number;
  isFavorite?: boolean;
  isOtc?: boolean;
  marketType?: 'REAL' | 'OTC';
  category?: OtcCategory;
  otcCategory?: OtcCategory | string;
  priceSource?: string;
}

export interface CandleData {
  time: number;  // timestamp in seconds (for Lightweight Charts)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  userId: string;
  accountMode: AccountMode;
  symbol: string;
  displayPair: string;
  direction: TradeDirection;
  investment: number;
  payoutRate: number;
  potentialPayout: number;
  entryPrice: number;
  entryTimestamp: number;   // ms
  expiryTimestamp: number;  // ms
  durationSeconds: number;
  exitPrice?: number;
  settledTimestamp?: number;
  result: TradeResult;
  profit: number;           // net profit (positive for win, negative for loss)
  status: TradeStatus;
  priceSource: {
    provider: string;
    market: string;
    symbol: string;
  };
  createdAt: number;
}

export interface UserWallet {
  demoBalance: number;
  liveBalance: number;
  lockedBalance: number;
  currency: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN' | 'SUPPORT';
  isVerified?: boolean;
  kycStatus?: string;
  twoFactorEnabled?: boolean;
  accountMode?: AccountMode;
  createdAt: string | number;
  country?: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  accountMode?: AccountMode;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE' | 'PAYOUT' | 'REFUND';
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  description: string;
  timestamp: number;
  currency?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  timestamp: number;
  read: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: number;
  messages: {
    sender: 'user' | 'support';
    text: string;
    timestamp: number;
  }[];
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalVolume: number;
  totalDeposits: number;
  totalWithdrawals: number;
  platformProfit: number;
}

export interface DrawingToolItem {
  id: string;
  type: 'horizontal_line' | 'trend_line' | 'ray' | 'vertical_line' | 'fibonacci' | 'channel' | 'zone_box';
  price: number;
  color: string;
  label?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  highPrice?: number;
  lowPrice?: number;
  price2?: number;          // Secondary price for trendline / channel / zone box
  channelWidth?: number;    // Width for parallel channel
  time?: number;            // Timestamp for vertical line / anchor 1
  time2?: number;           // Timestamp for anchor 2
  isLocked?: boolean;       // Lock against accidental dragging
  isVisible?: boolean;      // Toggle visibility
}

export interface IndicatorSettings {
  sma: { enabled: boolean; period: number; color: string; lineWidth?: number };
  ema: { enabled: boolean; period: number; color: string; lineWidth?: number };
  wma?: { enabled: boolean; period: number; color: string; lineWidth?: number };
  bollinger: { enabled: boolean; period: number; stdDev: number; color: string; fillOpacity?: number };
  rsi: { enabled: boolean; period: number; overbought: number; oversold: number; color?: string };
  macd: { enabled: boolean; fast: number; slow: number; signal: number; color?: string };
  stochastic?: { enabled: boolean; kPeriod: number; dPeriod: number; slowing: number; overbought: number; oversold: number };
  parabolicSar?: { enabled: boolean; step: number; max: number; color: string };
  supertrend?: { enabled: boolean; period: number; multiplier: number; color?: string };
}

export type NavTab = 'trade' | 'markets' | 'history' | 'wallet' | 'support' | 'admin' | 'landing' | 'deposit' | 'withdrawal' | 'profile';
