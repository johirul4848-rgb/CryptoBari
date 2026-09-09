import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// Admin environment credentials
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || '@53595';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Jahid@5359';
const ADMIN_BORN_DAY = (process.env.ADMIN_BORN_DAY || 'Sunday').trim().toLowerCase();

export interface DepositRequestRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: string;
  txHash: string;
  binanceId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  approvedAt?: number;
  rejectedReason?: string;
}

export interface WithdrawalRequestRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: string;
  address: string;
  network: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  processedAt?: number;
  rejectedReason?: string;
}

export interface PlatformNoticeRecord {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'PROMO' | 'ALERT';
  active: boolean;
  priority: number;
  createdAt: number;
}

export interface BrokerUserRecord {
  id: string;
  name: string;
  email: string;
  country: string;
  role: 'USER' | 'VIP' | 'ADMIN';
  kycStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
  liveBalance: number;
  demoBalance: number;
  status: 'ACTIVE' | 'FROZEN';
  totalDeposited: number;
  totalWithdrawn: number;
  registeredAt: number;
}

export interface BinanceGatewaySettings {
  binanceId: string;
  merchantName: string;
  qrCodeUrl: string;
  notes: string;
  updatedAt: number;
}

export interface SupportTicketRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: number;
  updatedAt: number;
  messages: Array<{
    id: string;
    sender: 'user' | 'support' | 'admin';
    senderName: string;
    text: string;
    timestamp: number;
  }>;
}

interface TradeRecord {
  id: string;
  userId: string;
  accountMode: 'DEMO' | 'LIVE';
  symbol: string;
  displayPair: string;
  direction: 'UP' | 'DOWN';
  investment: number;
  payoutRate: number;
  potentialPayout: number;
  entryPrice: number;
  entryTimestamp: number;
  expiryTimestamp: number;
  durationSeconds: number;
  exitPrice?: number;
  settledTimestamp?: number;
  result: 'WIN' | 'LOSS' | 'TIE' | 'PENDING';
  profit: number;
  status: 'ACTIVE' | 'SETTLED' | 'CANCELLED';
  priceSource: {
    provider: string;
    market: string;
    symbol: string;
  };
  createdAt: number;
}

interface ServerMarketSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  displayPair: string;
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
  status?: string;
  payoutRate: number;
  enabled: boolean;
  minInvestment: number;
  maxInvestment: number;
  isFavorite?: boolean;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory persistent state (persists across user trades)
  const walletState = {
    demoBalance: 10000.00,
    liveBalance: 0.00,
    lockedBalance: 0.00,
    currency: 'USD',
  };

  const activeTrades: Map<string, TradeRecord> = new Map();
  const closedTrades: TradeRecord[] = [];
  const latestPrices: Map<string, number> = new Map();
  let cachedSymbols: ServerMarketSymbol[] = [];
  let lastSymbolsFetchTime = 0;

  // Broker Admin Collections
  const depositRequests: DepositRequestRecord[] = [
    {
      id: 'DEP-849201',
      userId: 'usr_johirul',
      userName: 'Johirul Islam',
      userEmail: 'johirul4848@gmail.com',
      amount: 150.00,
      currency: 'USD',
      method: 'Binance Pay (USDT)',
      txHash: '0x94f83d7120a4b92c81e592df894021bb8a4d7023c',
      binanceId: '849201948',
      status: 'PENDING',
      createdAt: Date.now() - 1000 * 60 * 12,
    },
    {
      id: 'DEP-849195',
      userId: 'usr_tariq',
      userName: 'Tariq Al-Mansoor',
      userEmail: 'tariq.mansoor@binance-vip.org',
      amount: 500.00,
      currency: 'USD',
      method: 'USDT (TRC-20)',
      txHash: 'TK9aLz8401nm29a9b0c031aa23dce0912384a',
      binanceId: '719302481',
      status: 'PENDING',
      createdAt: Date.now() - 1000 * 60 * 35,
    },
    {
      id: 'DEP-849180',
      userId: 'usr_elena',
      userName: 'Elena Rostova',
      userEmail: 'elena.rostova@broker.fi',
      amount: 250.00,
      currency: 'USD',
      method: 'Binance Pay (USDT)',
      txHash: '0x49ca21980beadfc8812903120cbac49821849',
      binanceId: '520194832',
      status: 'APPROVED',
      createdAt: Date.now() - 1000 * 60 * 120,
      approvedAt: Date.now() - 1000 * 60 * 115,
    }
  ];

  const withdrawalRequests: WithdrawalRequestRecord[] = [
    {
      id: 'WTH-92140',
      userId: 'usr_marcus',
      userName: 'Marcus Sterling',
      userEmail: 'marcus.s@fintechtrade.uk',
      amount: 320.00,
      currency: 'USD',
      method: 'USDT (TRC20)',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      network: 'TRON TRC-20',
      status: 'PENDING',
      createdAt: Date.now() - 1000 * 60 * 25,
    },
    {
      id: 'WTH-92135',
      userId: 'usr_amira',
      userName: 'Amira Ben Ali',
      userEmail: 'amira.fx@tunistrade.com',
      amount: 180.00,
      currency: 'USD',
      method: 'Binance Pay ID',
      address: 'PayID: 298410291',
      network: 'Binance Internal Transfer',
      status: 'APPROVED',
      createdAt: Date.now() - 1000 * 60 * 180,
      processedAt: Date.now() - 1000 * 60 * 140,
    }
  ];

  const notices: PlatformNoticeRecord[] = [
    {
      id: 'NOT-101',
      title: 'Binance Cloud Ultra-Low Latency Upgrade',
      content: 'Direct WebSocket bridge optimized to 8ms tick synchronization for binary options precision.',
      type: 'INFO',
      active: true,
      priority: 1,
      createdAt: Date.now() - 1000 * 60 * 60 * 24,
    },
    {
      id: 'NOT-102',
      title: 'Weekend 100% First Deposit Bonus',
      content: 'Get 100% matching trade credit on all crypto deposits processed today. Zero rollover locks.',
      type: 'PROMO',
      active: true,
      priority: 2,
      createdAt: Date.now() - 1000 * 60 * 60 * 12,
    },
    {
      id: 'NOT-103',
      title: 'VIP Instant Withdrawal Processing Active',
      content: 'TRC-20 and Binance Pay withdrawals are being approved within under 5 minutes by treasury.',
      type: 'ALERT',
      active: true,
      priority: 3,
      createdAt: Date.now() - 1000 * 60 * 60 * 6,
    }
  ];

  const brokerUsers: BrokerUserRecord[] = [
    {
      id: 'usr_johirul',
      name: 'Johirul Islam',
      email: 'johirul4848@gmail.com',
      country: 'Bangladesh',
      role: 'VIP',
      kycStatus: 'VERIFIED',
      liveBalance: 0.00,
      demoBalance: 10000.00,
      status: 'ACTIVE',
      totalDeposited: 150.00,
      totalWithdrawn: 0.00,
      registeredAt: Date.now() - 1000 * 60 * 60 * 48,
    },
    {
      id: 'usr_tariq',
      name: 'Tariq Al-Mansoor',
      email: 'tariq.mansoor@binance-vip.org',
      country: 'United Arab Emirates',
      role: 'VIP',
      kycStatus: 'VERIFIED',
      liveBalance: 1450.00,
      demoBalance: 10000.00,
      status: 'ACTIVE',
      totalDeposited: 2500.00,
      totalWithdrawn: 1050.00,
      registeredAt: Date.now() - 1000 * 60 * 60 * 72,
    },
    {
      id: 'usr_marcus',
      name: 'Marcus Sterling',
      email: 'marcus.s@fintechtrade.uk',
      country: 'United Kingdom',
      role: 'USER',
      kycStatus: 'PENDING',
      liveBalance: 420.00,
      demoBalance: 9800.00,
      status: 'ACTIVE',
      totalDeposited: 800.00,
      totalWithdrawn: 320.00,
      registeredAt: Date.now() - 1000 * 60 * 60 * 96,
    },
    {
      id: 'usr_elena',
      name: 'Elena Rostova',
      email: 'elena.rostova@broker.fi',
      country: 'Finland',
      role: 'VIP',
      kycStatus: 'VERIFIED',
      liveBalance: 890.00,
      demoBalance: 10000.00,
      status: 'ACTIVE',
      totalDeposited: 1200.00,
      totalWithdrawn: 310.00,
      registeredAt: Date.now() - 1000 * 60 * 60 * 120,
    }
  ];

  // Configurable Binance Pay Gateway Settings (Admin Managed)
  const binanceGatewaySettings: BinanceGatewaySettings = {
    binanceId: '794380283',
    merchantName: 'CryptoBari',
    qrCodeUrl: '',
    notes: 'Official verified Binance Pay Receiver for CryptoBari Trading Platform.',
    updatedAt: Date.now(),
  };

  // Live Support Tickets Desk
  const supportTickets: SupportTicketRecord[] = [
    {
      id: 'TICK-802',
      userId: 'usr_johirul',
      userName: 'Johirul Islam',
      userEmail: 'johirul4848@gmail.com',
      subject: 'Binance Pay Instant Settlement Inquiry',
      category: 'Billing & Deposit',
      status: 'RESOLVED',
      createdAt: Date.now() - 3600000 * 12,
      updatedAt: Date.now() - 3600000 * 10,
      messages: [
        {
          id: 'msg-1',
          sender: 'user',
          senderName: 'Johirul Islam',
          text: 'Hello, I sent 150 USD via Binance Pay ID. When will my account balance reflect it?',
          timestamp: Date.now() - 3600000 * 12,
        },
        {
          id: 'msg-2',
          sender: 'admin',
          senderName: 'CryptoBari Treasury Admin',
          text: 'Welcome Johirul! Your deposit was verified and live balance credited. Happy trading!',
          timestamp: Date.now() - 3600000 * 10,
        },
      ],
    },
  ];

  // Initial seed symbols
  const initialSymbols: ServerMarketSymbol[] = [
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', displayPair: 'BTC/USDT', price: 88540.20, priceChangePercent: 2.34, high24h: 89400.00, low24h: 86320.50, volume24h: 34521.8, quoteVolume24h: 3045230000, pricePrecision: 2, payoutRate: 88, enabled: true, minInvestment: 1, maxInvestment: 2000, isFavorite: true },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', displayPair: 'ETH/USDT', price: 2465.45, priceChangePercent: 1.82, high24h: 2510.00, low24h: 2410.20, volume24h: 184520.4, quoteVolume24h: 454320000, pricePrecision: 2, payoutRate: 86, enabled: true, minInvestment: 1, maxInvestment: 2000, isFavorite: true },
    { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', displayPair: 'SOL/USDT', price: 154.30, priceChangePercent: 4.15, high24h: 158.40, low24h: 147.80, volume24h: 843210.0, quoteVolume24h: 129432000, pricePrecision: 2, payoutRate: 85, enabled: true, minInvestment: 1, maxInvestment: 2000, isFavorite: true },
    { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', displayPair: 'BNB/USDT', price: 585.10, priceChangePercent: -0.42, high24h: 592.00, low24h: 579.50, volume24h: 92340.5, quoteVolume24h: 54100000, pricePrecision: 2, payoutRate: 84, enabled: true, minInvestment: 1, maxInvestment: 1500 },
    { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', displayPair: 'XRP/USDT', price: 0.6145, priceChangePercent: 3.12, high24h: 0.6350, low24h: 0.5890, volume24h: 45210000.0, quoteVolume24h: 27500000, pricePrecision: 4, payoutRate: 83, enabled: true, minInvestment: 1, maxInvestment: 1500 },
    { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', displayPair: 'DOGE/USDT', price: 0.12450, priceChangePercent: 5.60, high24h: 0.13100, low24h: 0.11600, volume24h: 120540000.0, quoteVolume24h: 14800000, pricePrecision: 5, payoutRate: 82, enabled: true, minInvestment: 1, maxInvestment: 1000 },
    { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', displayPair: 'ADA/USDT', price: 0.3840, priceChangePercent: -1.15, high24h: 0.3950, low24h: 0.3780, volume24h: 25410000.0, quoteVolume24h: 9800000, pricePrecision: 4, payoutRate: 82, enabled: true, minInvestment: 1, maxInvestment: 1000 },
    { symbol: 'TRXUSDT', baseAsset: 'TRX', quoteAsset: 'USDT', displayPair: 'TRX/USDT', price: 0.1582, priceChangePercent: 0.65, high24h: 0.1610, low24h: 0.1560, volume24h: 38900000.0, quoteVolume24h: 6150000, pricePrecision: 4, payoutRate: 80, enabled: true, minInvestment: 1, maxInvestment: 1000 },
    { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', displayPair: 'LINK/USDT', price: 11.85, priceChangePercent: 1.45, high24h: 12.20, low24h: 11.45, volume24h: 1845000.0, quoteVolume24h: 21850000, pricePrecision: 2, payoutRate: 84, enabled: true, minInvestment: 1, maxInvestment: 1500 },
    { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', displayPair: 'AVAX/USDT', price: 24.75, priceChangePercent: -2.10, high24h: 25.80, low24h: 24.10, volume24h: 2840000.0, quoteVolume24h: 70450000, pricePrecision: 2, payoutRate: 85, enabled: true, minInvestment: 1, maxInvestment: 1500 },
  ];
  cachedSymbols = initialSymbols;
  initialSymbols.forEach(s => latestPrices.set(s.symbol, s.price));

  // Dynamic Binance symbol refresh
  async function refreshBinanceSymbols() {
    try {
      // 1. Fetch Exchange Info to get precision, tick size, and valid spot pairs
      let exchangeMap = new Map<string, { tickSize: number; precision: number; minQty: number; status: string }>();
      try {
        const exRes = await fetch('https://api.binance.com/api/v3/exchangeInfo?permissions=SPOT');
        if (exRes.ok) {
          const exData: any = await exRes.json();
          if (Array.isArray(exData.symbols)) {
            for (const s of exData.symbols) {
              if (s.status === 'TRADING' && s.isSpotTradingAllowed !== false) {
                let tickSize = 0.01;
                let precision = 2;
                let minQty = 0.001;

                if (Array.isArray(s.filters)) {
                  const pf = s.filters.find((f: any) => f.filterType === 'PRICE_FILTER');
                  if (pf && pf.tickSize) {
                    tickSize = parseFloat(pf.tickSize);
                    const tickStr = pf.tickSize.replace(/0+$/, '');
                    const dot = tickStr.indexOf('.');
                    precision = dot !== -1 ? tickStr.length - dot - 1 : 0;
                  }
                  const lf = s.filters.find((f: any) => f.filterType === 'LOT_SIZE');
                  if (lf && lf.minQty) {
                    minQty = parseFloat(lf.minQty);
                  }
                }

                exchangeMap.set(s.symbol, { tickSize, precision, minQty, status: s.status });
              }
            }
          }
        }
      } catch {
        // use fallback precision if exchangeInfo fails
      }

      // 2. Fetch 24hr tickers
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (res.ok) {
        const rawTickers: Array<{
          symbol: string;
          lastPrice: string;
          priceChangePercent: string;
          highPrice: string;
          lowPrice: string;
          volume: string;
          quoteVolume: string;
        }> = await res.json();

        const usdtTickers = rawTickers
          .filter(t => t.symbol.endsWith('USDT') && parseFloat(t.quoteVolume) > 1000000)
          .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
          .slice(0, 100);

        if (usdtTickers.length > 0) {
          cachedSymbols = usdtTickers.map(t => {
            const base = t.symbol.replace('USDT', '');
            const price = parseFloat(t.lastPrice);
            latestPrices.set(t.symbol, price);

            const meta = exchangeMap.get(t.symbol);
            let precision = meta ? meta.precision : 2;
            if (!meta) {
              if (price < 0.0001) precision = 8;
              else if (price < 0.01) precision = 6;
              else if (price < 1) precision = 4;
              else if (price < 10) precision = 3;
            }

            // Existing payout rate or default 85%
            const existing = cachedSymbols.find(s => s.symbol === t.symbol);
            const payoutRate = existing ? existing.payoutRate : (['BTCUSDT', 'ETHUSDT'].includes(t.symbol) ? 88 : 85);

            return {
              symbol: t.symbol,
              baseAsset: base,
              quoteAsset: 'USDT',
              displayPair: `${base}/USDT`,
              price,
              priceChangePercent: parseFloat(t.priceChangePercent),
              high24h: parseFloat(t.highPrice),
              low24h: parseFloat(t.lowPrice),
              volume24h: parseFloat(t.volume),
              quoteVolume24h: parseFloat(t.quoteVolume),
              pricePrecision: precision,
              tickSize: meta ? meta.tickSize : 1 / Math.pow(10, precision),
              minQty: meta ? meta.minQty : 0.001,
              status: meta ? meta.status : 'TRADING',
              payoutRate,
              enabled: true,
              minInvestment: 1,
              maxInvestment: 2000,
              isFavorite: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'].includes(t.symbol),
            };
          });
          lastSymbolsFetchTime = Date.now();
        }
      }
    } catch {
      // Keep existing cached symbols
    }
  }

  // Initial load and periodic refresh
  refreshBinanceSymbols();
  setInterval(refreshBinanceSymbols, 30000);

  // Background Settlement Engine loop (Checks every 250ms with Server Timestamps)
  setInterval(async () => {
    const now = Date.now();
    for (const [tradeId, trade] of activeTrades.entries()) {
      if (now >= trade.expiryTimestamp) {
        // Authoritative expiry reached!
        // Fetch current live price for this symbol
        let currentExitPrice = latestPrices.get(trade.symbol) || trade.entryPrice;

        // Fetch direct current Binance price for ultra-precise settlement
        try {
          const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${trade.symbol}`);
          if (priceRes.ok) {
            const priceData = await priceRes.json();
            currentExitPrice = parseFloat(priceData.price);
            latestPrices.set(trade.symbol, currentExitPrice);
          }
        } catch {
          // Use latest cached
        }

        trade.exitPrice = currentExitPrice;
        trade.settledTimestamp = now;
        trade.status = 'SETTLED';

        let win = false;
        let tie = false;

        if (trade.direction === 'UP') {
          if (currentExitPrice > trade.entryPrice) win = true;
          else if (currentExitPrice === trade.entryPrice) tie = true;
        } else {
          // DOWN
          if (currentExitPrice < trade.entryPrice) win = true;
          else if (currentExitPrice === trade.entryPrice) tie = true;
        }

        if (win) {
          trade.result = 'WIN';
          trade.profit = (trade.investment * trade.payoutRate) / 100;
          const returnAmount = trade.investment + trade.profit;
          if (trade.accountMode === 'DEMO') {
            walletState.demoBalance += returnAmount;
          } else {
            walletState.liveBalance += returnAmount;
          }
        } else if (tie) {
          trade.result = 'TIE';
          trade.profit = 0;
          if (trade.accountMode === 'DEMO') {
            walletState.demoBalance += trade.investment;
          } else {
            walletState.liveBalance += trade.investment;
          }
        } else {
          trade.result = 'LOSS';
          trade.profit = -trade.investment;
        }

        walletState.lockedBalance = Math.max(0, walletState.lockedBalance - trade.investment);

        // Remove from active trades and add to closed trades
        activeTrades.delete(tradeId);
        closedTrades.unshift(trade);
        if (closedTrades.length > 200) {
          closedTrades.pop();
        }
      }
    }
  }, 250);

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  // Dynamic Binance Symbols with cached live prices and precision
  app.get('/api/markets/symbols', (req, res) => {
    res.json(cachedSymbols);
  });

  // Binance Klines proxy with fallback
  app.get('/api/markets/klines', async (req, res) => {
    const symbol = (req.query.symbol as string) || 'BTCUSDT';
    const interval = (req.query.interval as string) || '1m';
    const limit = parseInt((req.query.limit as string) || '100', 10);

    try {
      const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(binanceUrl);
      if (response.ok) {
        const raw: (string | number)[][] = await response.json();
        const candles = raw.map(item => ({
          time: Math.floor(Number(item[0]) / 1000),
          open: parseFloat(String(item[1])),
          high: parseFloat(String(item[2])),
          low: parseFloat(String(item[3])),
          close: parseFloat(String(item[4])),
          volume: parseFloat(String(item[5])),
        }));
        return res.json(candles);
      }
    } catch {
      // Fallback
    }

    res.status(500).json({ error: 'Failed to fetch klines' });
  });

  // Get Wallet Details
  app.get('/api/wallet', (req, res) => {
    res.json(walletState);
  });

  // Reset Demo Balance
  app.post('/api/wallet/reset-demo', (req, res) => {
    walletState.demoBalance = 10000.00;
    walletState.lockedBalance = 0.00;
    res.json({ success: true, newBalance: walletState.demoBalance });
  });

  // Simulated Deposit
  app.post('/api/wallet/deposit', (req, res) => {
    const { amount, method } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }
    walletState.liveBalance += numAmount;
    res.json({ success: true, liveBalance: walletState.liveBalance, message: `Deposited $${numAmount.toFixed(2)} via ${method || 'Crypto'}` });
  });

  // Simulated Withdrawal
  app.post('/api/wallet/withdraw', (req, res) => {
    const { amount, method, address } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }
    if (walletState.liveBalance < numAmount) {
      return res.status(400).json({ error: 'Insufficient live balance' });
    }
    walletState.liveBalance -= numAmount;
    res.json({ success: true, liveBalance: walletState.liveBalance, message: `Withdrawal of $${numAmount.toFixed(2)} submitted for processing` });
  });

  // Authoritative Trade Placement
  app.post('/api/trades/place', async (req, res) => {
    const {
      symbol,
      displayPair,
      direction,
      investment,
      durationSeconds,
      accountMode = 'DEMO',
      currentPrice,
    } = req.body;

    const numInvestment = parseFloat(investment);
    const numDuration = parseInt(durationSeconds, 10);

    if (!symbol || !['UP', 'DOWN'].includes(direction)) {
      return res.status(400).json({ success: false, message: 'Invalid trade parameters' });
    }
    if (!numInvestment || numInvestment < 1) {
      return res.status(400).json({ success: false, message: 'Minimum investment is $1' });
    }
    if (!numDuration || numDuration < 5) {
      return res.status(400).json({ success: false, message: 'Minimum duration is 5 seconds' });
    }

    // Check Balance
    const available = accountMode === 'DEMO' ? walletState.demoBalance : walletState.liveBalance;
    if (available < numInvestment) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Lock funds
    if (accountMode === 'DEMO') {
      walletState.demoBalance -= numInvestment;
    } else {
      walletState.liveBalance -= numInvestment;
    }
    walletState.lockedBalance += numInvestment;

    // Determine Entry Price authoritatively from live market
    let entryPrice = parseFloat(currentPrice);
    try {
      const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        entryPrice = parseFloat(priceData.price);
        latestPrices.set(symbol, entryPrice);
      }
    } catch {
      // Fall back to client passed price if available
    }

    const symbolConfig = cachedSymbols.find(s => s.symbol === symbol);
    const payoutRate = symbolConfig ? symbolConfig.payoutRate : 85;
    const potentialPayout = numInvestment * (1 + payoutRate / 100);

    const now = Date.now();
    const tradeId = 'CB-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const trade: TradeRecord = {
      id: tradeId,
      userId: 'user_default',
      accountMode,
      symbol,
      displayPair: displayPair || `${symbol.replace('USDT', '')}/USDT`,
      direction,
      investment: numInvestment,
      payoutRate,
      potentialPayout,
      entryPrice,
      entryTimestamp: now,
      expiryTimestamp: now + numDuration * 1000,
      durationSeconds: numDuration,
      result: 'PENDING',
      profit: 0,
      status: 'ACTIVE',
      priceSource: {
        provider: 'BINANCE',
        market: 'SPOT',
        symbol,
      },
      createdAt: now,
    };

    activeTrades.set(tradeId, trade);

    res.json({
      success: true,
      trade,
    });
  });

  // Active Trades
  app.get('/api/trades/active', (req, res) => {
    res.json(Array.from(activeTrades.values()));
  });

  // Closed Trades History
  app.get('/api/trades/history', (req, res) => {
    res.json(closedTrades);
  });

  // Admin Statistics
  app.get('/api/admin/stats', (req, res) => {
    const totalTrades = closedTrades.length + activeTrades.size;
    const winningTrades = closedTrades.filter(t => t.result === 'WIN').length;
    const losingTrades = closedTrades.filter(t => t.result === 'LOSS').length;
    const totalVolume = closedTrades.reduce((acc, t) => acc + t.investment, 0);
    const totalPayouts = closedTrades.reduce((acc, t) => acc + (t.result === 'WIN' ? t.profit + t.investment : 0), 0);
    const platformProfit = totalVolume - totalPayouts;

    res.json({
      totalUsers: 1420,
      activeUsers: 342,
      totalTrades,
      winningTrades,
      losingTrades,
      totalVolume,
      totalDeposits: 28450,
      totalWithdrawals: 19820,
      platformProfit,
    });
  });

  // Update Asset Payout Settings
  app.post('/api/admin/assets/update', (req, res) => {
    const { symbol, payoutRate, enabled } = req.body;
    const asset = cachedSymbols.find(s => s.symbol === symbol);
    if (asset) {
      if (typeof payoutRate === 'number') asset.payoutRate = payoutRate;
      if (typeof enabled === 'boolean') asset.enabled = enabled;
      return res.json({ success: true, asset });
    }
    res.status(404).json({ error: 'Asset not found' });
  });

  // ==========================================
  // BROKER ADMIN & MANAGEMENT API ENDPOINTS
  // ==========================================

  // 1. Three-Stage Admin Security Verification Portal
  app.post('/api/admin/auth/verify-stage', (req, res) => {
    const { stage, accessCode, password, bornDay } = req.body;

    if (stage === 1) {
      if (!accessCode || accessCode !== ADMIN_ACCESS_CODE) {
        return res.status(401).json({ success: false, message: 'Invalid Access Code. Access Denied.' });
      }
      return res.json({ success: true, stage: 1, message: 'Stage 1 Passed. Proceed to Password.' });
    }

    if (stage === 2) {
      if (!accessCode || accessCode !== ADMIN_ACCESS_CODE) {
        return res.status(401).json({ success: false, message: 'Session expired. Access Code invalid.' });
      }
      if (!password || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Incorrect Password. Security Alert Logged.' });
      }
      return res.json({ success: true, stage: 2, message: 'Stage 2 Passed. Identity Question Required.' });
    }

    if (stage === 3) {
      if (!accessCode || accessCode !== ADMIN_ACCESS_CODE) {
        return res.status(401).json({ success: false, message: 'Session expired. Access Code invalid.' });
      }
      if (!password || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Password invalid.' });
      }
      const formattedBornDay = (bornDay || '').trim().toLowerCase();
      if (!formattedBornDay || formattedBornDay !== ADMIN_BORN_DAY) {
        return res.status(401).json({ success: false, message: 'Security Born Day verification failed.' });
      }

      // Generate verified session
      const adminSessionToken = 'cb_admin_session_' + Buffer.from(`${Date.now()}_${ADMIN_ACCESS_CODE}`).toString('base64');
      return res.json({
        success: true,
        verified: true,
        adminToken: adminSessionToken,
        admin: {
          role: 'SUPER_ADMIN',
          name: 'Jahid Chowdhury',
          email: 'johirul4848@gmail.com',
          portal: 'CryptoBari Master Management Portal',
          verifiedAt: Date.now(),
        },
        message: 'Security Verification Complete. Welcome, Admin.',
      });
    }

    res.status(400).json({ success: false, message: 'Invalid verification stage' });
  });

  // 2. Deposit Requests (List, Approve, Reject)
  app.get('/api/admin/deposits', (req, res) => {
    res.json(depositRequests);
  });

  // User submits a deposit request from wallet
  app.post('/api/wallet/deposit-request', (req, res) => {
    const { amount, method, txHash, binanceId, userId = 'usr_johirul', userName = 'Johirul Islam', userEmail = 'johirul4848@gmail.com' } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid deposit amount required' });
    }

    const newDeposit: DepositRequestRecord = {
      id: 'DEP-' + Math.floor(100000 + Math.random() * 900000),
      userId,
      userName,
      userEmail,
      amount: numAmount,
      currency: 'USD',
      method: method || 'Binance Pay',
      txHash: txHash || ('BPAY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase()),
      binanceId: binanceId ? String(binanceId).trim() : 'Unspecified',
      status: 'PENDING',
      createdAt: Date.now(),
    };

    depositRequests.unshift(newDeposit);
    res.json({
      success: true,
      message: 'Deposit request submitted successfully. Awaiting Admin Approval.',
      deposit: newDeposit,
    });
  });

  // Admin approves deposit -> Automatically credits live balance and removes from pending
  app.post('/api/admin/deposits/:id/approve', (req, res) => {
    const { id } = req.params;
    const deposit = depositRequests.find(d => d.id === id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }
    if (deposit.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Deposit is already approved' });
    }

    deposit.status = 'APPROVED';
    deposit.approvedAt = Date.now();

    // Credit real platform live balance
    walletState.liveBalance += deposit.amount;

    // Credit user if in registered broker users
    const user = brokerUsers.find(u => u.id === deposit.userId || u.email === deposit.userEmail);
    if (user) {
      user.liveBalance += deposit.amount;
      user.totalDeposited += deposit.amount;
    }

    res.json({
      success: true,
      message: `Deposit of $${deposit.amount.toFixed(2)} approved! Live balance credited to user.`,
      deposit,
      liveBalance: walletState.liveBalance,
    });
  });

  // Admin rejects deposit
  app.post('/api/admin/deposits/:id/reject', (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const deposit = depositRequests.find(d => d.id === id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }

    deposit.status = 'REJECTED';
    deposit.rejectedReason = reason || 'Transaction hash could not be verified on blockchain.';

    res.json({
      success: true,
      message: 'Deposit request rejected.',
      deposit,
    });
  });

  // 3. Withdrawal Requests (List, Approve, Reject)
  app.get('/api/admin/withdrawals', (req, res) => {
    res.json(withdrawalRequests);
  });

  // User submits a withdrawal request
  app.post('/api/wallet/withdraw-request', (req, res) => {
    const { amount, method, address, network = 'Binance Pay UID Transfer', userId = 'usr_johirul', userName = 'Johirul Islam', userEmail = 'johirul4848@gmail.com' } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid withdrawal amount required' });
    }
    if (walletState.liveBalance < 10) {
      return res.status(400).json({ error: 'Minimum live balance of $10.00 USD required to submit a withdrawal.' });
    }
    if (numAmount < 10) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is $10.00 USD. Requests under $10 are not permitted.' });
    }
    if (walletState.liveBalance < numAmount) {
      return res.status(400).json({ error: 'Insufficient Live Balance for this withdrawal request' });
    }

    // Deduct from live balance immediately into pending escrow
    walletState.liveBalance -= numAmount;

    const newWithdrawal: WithdrawalRequestRecord = {
      id: 'WTH-' + Math.floor(10000 + Math.random() * 90000),
      userId,
      userName,
      userEmail,
      amount: numAmount,
      currency: 'USD',
      method: method || 'Binance Pay',
      address: address || 'PayID: 794380283',
      network: 'Binance Pay UID Transfer',
      status: 'PENDING',
      createdAt: Date.now(),
    };

    withdrawalRequests.unshift(newWithdrawal);
    res.json({
      success: true,
      message: 'Withdrawal request submitted for Admin authorization.',
      withdrawal: newWithdrawal,
      liveBalance: walletState.liveBalance,
    });
  });

  // Admin approves withdrawal
  app.post('/api/admin/withdrawals/:id/approve', (req, res) => {
    const { id } = req.params;
    const item = withdrawalRequests.find(w => w.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }
    item.status = 'APPROVED';
    item.processedAt = Date.now();

    const user = brokerUsers.find(u => u.id === item.userId || u.email === item.userEmail);
    if (user) {
      user.totalWithdrawn += item.amount;
    }

    res.json({
      success: true,
      message: `Withdrawal of $${item.amount.toFixed(2)} approved and dispatched to ${item.address}.`,
      withdrawal: item,
    });
  });

  // Admin rejects withdrawal -> Refunds to user's live balance!
  app.post('/api/admin/withdrawals/:id/reject', (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const item = withdrawalRequests.find(w => w.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    item.status = 'REJECTED';
    item.rejectedReason = reason || 'Address formatting rejected or KYC mismatch.';

    // Refund live balance
    walletState.liveBalance += item.amount;

    res.json({
      success: true,
      message: `Withdrawal rejected. Funds of $${item.amount.toFixed(2)} refunded to Live balance.`,
      withdrawal: item,
      liveBalance: walletState.liveBalance,
    });
  });

  // 4. System Notices & Announcements
  app.get('/api/admin/notices', (req, res) => {
    res.json(notices);
  });

  // Public active notices
  app.get('/api/notices/active', (req, res) => {
    res.json(notices.filter(n => n.active));
  });

  app.post('/api/admin/notices', (req, res) => {
    const { title, content, type = 'INFO', priority = 1 } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const newNotice: PlatformNoticeRecord = {
      id: 'NOT-' + (notices.length + 101),
      title,
      content,
      type,
      active: true,
      priority: Number(priority) || 1,
      createdAt: Date.now(),
    };
    notices.unshift(newNotice);
    res.json({ success: true, notice: newNotice });
  });

  app.put('/api/admin/notices/:id', (req, res) => {
    const { id } = req.params;
    const notice = notices.find(n => n.id === id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    const { title, content, type, active, priority } = req.body;
    if (title !== undefined) notice.title = title;
    if (content !== undefined) notice.content = content;
    if (type !== undefined) notice.type = type;
    if (active !== undefined) notice.active = active;
    if (priority !== undefined) notice.priority = priority;
    res.json({ success: true, notice });
  });

  app.delete('/api/admin/notices/:id', (req, res) => {
    const { id } = req.params;
    const index = notices.findIndex(n => n.id === id);
    if (index !== -1) {
      notices.splice(index, 1);
      return res.json({ success: true, message: 'Notice deleted' });
    }
    res.status(404).json({ error: 'Notice not found' });
  });

  // 5. User Management
  app.get('/api/admin/users', (req, res) => {
    res.json(brokerUsers);
  });

  app.post('/api/admin/users/:id/adjust-balance', (req, res) => {
    const { id } = req.params;
    const { amount, type = 'LIVE' } = req.body;
    const user = brokerUsers.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (type === 'LIVE') {
      user.liveBalance = Math.max(0, user.liveBalance + numAmount);
      // Sync with primary wallet if it's the current user
      walletState.liveBalance = user.liveBalance;
    } else {
      user.demoBalance = Math.max(0, user.demoBalance + numAmount);
      walletState.demoBalance = user.demoBalance;
    }
    res.json({ success: true, user, walletState });
  });

  app.post('/api/admin/users/:id/toggle-kyc', (req, res) => {
    const { id } = req.params;
    const user = brokerUsers.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.kycStatus = user.kycStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED';
    res.json({ success: true, user });
  });

  app.post('/api/admin/users/:id/toggle-status', (req, res) => {
    const { id } = req.params;
    const user = brokerUsers.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.status = user.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    res.json({ success: true, user });
  });

  // Register new trader user (Auto-adds into Trader Users directory for Admin Panel)
  app.post('/api/users/register', (req, res) => {
    const { name, email, country } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    const existing = brokerUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.json({ success: true, user: existing, message: 'Existing trader session restored' });
    }

    const newUser: BrokerUserRecord = {
      id: 'usr_' + Date.now().toString(36),
      name,
      email,
      country: country || 'International',
      role: 'USER',
      kycStatus: 'PENDING',
      liveBalance: 0.00,
      demoBalance: 10000.00,
      status: 'ACTIVE',
      totalDeposited: 0.00,
      totalWithdrawn: 0.00,
      registeredAt: Date.now(),
    };

    brokerUsers.unshift(newUser);
    res.json({
      success: true,
      message: 'Account registered successfully and added to Trader Users menu.',
      user: newUser,
    });
  });

  // 6. Referral Management
  app.get('/api/admin/referrals', (req, res) => {
    res.json({
      totalAffiliates: 142,
      activeReferrers: 89,
      totalReferredTraders: 1250,
      totalReferredVolume: 489200.00,
      totalCommissionsPaid: 24460.00,
      defaultCommissionRate: 5.0,
      topAffiliates: [
        { code: 'CRYPTO_PRO', owner: 'Johirul Islam', invited: 42, volume: 84000, commission: 4200 },
        { code: 'BINANCE_HUB', owner: 'Tariq Al-Mansoor', invited: 38, volume: 76000, commission: 3800 },
        { code: 'DHAKA_TRADER', owner: 'Rafiqul Hassan', invited: 29, volume: 58000, commission: 2900 },
        { code: 'SCALPER_VIP', owner: 'Elena Rostova', invited: 21, volume: 42000, commission: 2100 },
      ]
    });
  });

  // 7. Finance & In-depth Audit (Deposit - Payouts = Net Balance, - Referral = Net Profit/Loss)
  app.get('/api/admin/finance', (req, res) => {
    const totalDeposits = depositRequests
      .filter(d => d.status === 'APPROVED')
      .reduce((acc, d) => acc + d.amount, 0) + 28450; // includes verified baseline

    const dispatchedPayouts = withdrawalRequests
      .filter(w => w.status === 'APPROVED')
      .reduce((acc, w) => acc + w.amount, 0) + 19820;

    // Total Deposits - Dispatched Payouts = Total Gross Balance
    const totalBalanceAmount = totalDeposits - dispatchedPayouts;

    // Total Referral Commission
    const referralCommissions = 3450.00;

    // Net Profit or Loss = (Total Deposits - Dispatched Payouts) - Referral Commission
    const netProfitOrLoss = totalBalanceAmount - referralCommissions;
    const isProfit = netProfitOrLoss >= 0;

    // Daily breakdown for Admin (Smart Daily P&L Tracker)
    const dailyReports = [
      {
        date: 'Today (' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ')',
        deposits: 2850.00,
        dispatchedPayouts: 1420.00,
        netBalance: 1430.00,
        referralCommission: 140.00,
        netProfitLoss: 1290.00,
        status: 'PROFIT',
      },
      {
        date: 'Yesterday',
        deposits: 3100.00,
        dispatchedPayouts: 1750.00,
        netBalance: 1350.00,
        referralCommission: 165.00,
        netProfitLoss: 1185.00,
        status: 'PROFIT',
      },
      {
        date: '2 Days Ago',
        deposits: 1400.00,
        dispatchedPayouts: 1950.00,
        netBalance: -550.00,
        referralCommission: 90.00,
        netProfitLoss: -640.00,
        status: 'LOSS',
      },
      {
        date: '3 Days Ago',
        deposits: 4200.00,
        dispatchedPayouts: 2100.00,
        netBalance: 2100.00,
        referralCommission: 210.00,
        netProfitLoss: 1890.00,
        status: 'PROFIT',
      },
      {
        date: '4 Days Ago',
        deposits: 2950.00,
        dispatchedPayouts: 1380.00,
        netBalance: 1570.00,
        referralCommission: 150.00,
        netProfitLoss: 1420.00,
        status: 'PROFIT',
      },
    ];

    res.json({
      totalDeposits,
      dispatchedPayouts,
      totalBalanceAmount,
      referralCommissions,
      netProfitOrLoss,
      status: isProfit ? 'PROFIT' : 'LOSS',
      pendingDepositsVolume: depositRequests.filter(d => d.status === 'PENDING').reduce((acc, d) => acc + d.amount, 0),
      pendingWithdrawalsVolume: withdrawalRequests.filter(w => w.status === 'PENDING').reduce((acc, w) => acc + w.amount, 0),
      reserveFund: 150000.00 + totalBalanceAmount,
      dailyReports,
    });
  });

  // 8. Binance Payment Gateway Settings (Admin Managed)
  app.get('/api/payment/binance-settings', (req, res) => {
    res.json(binanceGatewaySettings);
  });

  app.post('/api/admin/payment/binance-settings', (req, res) => {
    const { binanceId, merchantName, qrCodeUrl, notes } = req.body;
    if (binanceId !== undefined && String(binanceId).trim()) {
      binanceGatewaySettings.binanceId = String(binanceId).trim();
    }
    if (merchantName !== undefined && String(merchantName).trim()) {
      binanceGatewaySettings.merchantName = String(merchantName).trim();
    }
    if (qrCodeUrl !== undefined) {
      binanceGatewaySettings.qrCodeUrl = String(qrCodeUrl).trim();
    }
    if (notes !== undefined) {
      binanceGatewaySettings.notes = String(notes).trim();
    }
    binanceGatewaySettings.updatedAt = Date.now();

    res.json({
      success: true,
      message: 'Binance Pay gateway configuration updated successfully.',
      settings: binanceGatewaySettings,
    });
  });

  // 9. 24/7 Support Desk & Ticketing API
  app.get('/api/support/tickets', (req, res) => {
    res.json(supportTickets);
  });

  app.post('/api/support/tickets', (req, res) => {
    const { subject, category, message, userId = 'usr_johirul', userName = 'Johirul Islam', userEmail = 'johirul4848@gmail.com' } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const newTicket: SupportTicketRecord = {
      id: 'TICK-' + Math.floor(100 + Math.random() * 900),
      userId,
      userName,
      userEmail,
      subject,
      category: category || 'General Trading',
      status: 'OPEN',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'msg-' + Date.now(),
          sender: 'user',
          senderName: userName,
          text: message,
          timestamp: Date.now(),
        },
      ],
    };

    supportTickets.unshift(newTicket);
    res.json({ success: true, ticket: newTicket });
  });

  app.post('/api/support/tickets/:id/messages', (req, res) => {
    const { id } = req.params;
    const { text, sender = 'user', senderName = 'Johirul Islam' } = req.body;
    const ticket = supportTickets.find(t => t.id === id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty' });
    }

    const newMsg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      sender: sender as 'user' | 'support' | 'admin',
      senderName: senderName || (sender === 'admin' ? 'CryptoBari Treasury Admin' : 'Johirul Islam'),
      text: text.trim(),
      timestamp: Date.now(),
    };

    ticket.messages.push(newMsg);
    ticket.updatedAt = Date.now();
    if (sender === 'admin' || sender === 'support') {
      ticket.status = 'IN_PROGRESS';
    }

    res.json({ success: true, message: newMsg, ticket });
  });

  app.post('/api/admin/support/tickets/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const ticket = supportTickets.find(t => t.id === id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    ticket.status = status;
    ticket.updatedAt = Date.now();
    res.json({ success: true, ticket });
  });

  // 10. Detailed Trade Reports
  app.get('/api/admin/reports', (req, res) => {
    res.json({
      allTrades: closedTrades,
      activeTrades: Array.from(activeTrades.values()),
      generatedAt: Date.now(),
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CryptoBari Trading Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
