export type TradeDirection = 'UP' | 'DOWN';
export type TradeResult = 'WIN' | 'LOSS' | 'TIE' | 'PENDING';
export type TradeStatus = 'ACTIVE' | 'SETTLED' | 'CANCELLED';
export type AccountMode = 'DEMO' | 'LIVE';
export type ConnectionStatus = 'LIVE' | 'RECONNECTING' | 'OFFLINE' | 'DELAYED';
export type Timeframe = '1s' | '5s' | '10s' | '15s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export interface MarketSymbol {
  symbol: string;         // e.g. 'BTCUSDT'
  baseAsset: string;      // e.g. 'BTC'
  quoteAsset: string;     // e.g. 'USDT'
  displayPair: string;    // e.g. 'BTC/USDT'
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
  status?: string;        // e.g. 'TRADING'
  payoutRate: number;     // e.g. 85 (%)
  enabled: boolean;
  minInvestment: number;
  maxInvestment: number;
  isFavorite?: boolean;
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
  type: 'horizontal_line' | 'trend_line' | 'fibonacci';
  price: number;
  color: string;
  label?: string;
  lineWidth?: number;
  highPrice?: number;
  lowPrice?: number;
}

export interface IndicatorSettings {
  sma: { enabled: boolean; period: number; color: string };
  ema: { enabled: boolean; period: number; color: string };
  bollinger: { enabled: boolean; period: number; stdDev: number; color: string };
  rsi: { enabled: boolean; period: number; overbought: number; oversold: number };
  macd: { enabled: boolean; fast: number; slow: number; signal: number };
}

export type NavTab = 'trade' | 'markets' | 'history' | 'wallet' | 'support' | 'admin' | 'landing' | 'deposit' | 'withdrawal' | 'profile';
