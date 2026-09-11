import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { otcPriceEngine } from './src/services/otcEngine';
import { resolveUnderlyingSymbol, OTC_BINANCE_MAPPINGS } from './src/constants/otcMappings';
import { generateInitialLiveSymbols, ALL_LIVE_CONFIGS, resolveLiveMarketSymbol } from './src/constants/liveMarketPairs';
import { Timeframe } from './src/types';

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
  binanceId?: string;
  receiverBinanceId?: string;
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
    timestamp?: number;
    entryPrice?: number;
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

  // Initial seed symbols: Comprehensive live curated list (100% Live Spot Crypto Pairs)
  const initialSymbols: ServerMarketSymbol[] = generateInitialLiveSymbols().map(s => ({
    symbol: s.symbol,
    baseAsset: s.baseAsset,
    quoteAsset: s.quoteAsset,
    displayPair: s.displayPair,
    price: s.price,
    priceChangePercent: s.priceChangePercent,
    high24h: s.high24h,
    low24h: s.low24h,
    volume24h: s.volume24h,
    quoteVolume24h: s.quoteVolume24h,
    pricePrecision: s.pricePrecision,
    payoutRate: s.payoutRate,
    enabled: true,
    minInvestment: s.minInvestment || 1,
    maxInvestment: s.maxInvestment || 2000,
    isFavorite: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'SUIUSDT', 'PEPEUSDT', 'BNBUSDT'].includes(s.symbol),
    status: 'TRADING',
    category: s.category,
  }));
  cachedSymbols = initialSymbols;
  initialSymbols.forEach(s => latestPrices.set(s.symbol, s.price));

  // Dynamic Binance symbol refresh
  async function refreshBinanceSymbols() {
    try {
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

        const tickerMap = new Map(rawTickers.map(t => [t.symbol, t]));

        cachedSymbols.forEach(sym => {
          const resolved = resolveLiveMarketSymbol(sym.symbol);
          const t = tickerMap.get(resolved.underlying);
          if (t) {
            const rawPrice = parseFloat(t.lastPrice) * resolved.multiplier;
            const price = Number(rawPrice.toFixed(resolved.precision));
            sym.price = price;
            sym.priceChangePercent = parseFloat(t.priceChangePercent);
            sym.high24h = Number((parseFloat(t.highPrice) * resolved.multiplier).toFixed(resolved.precision));
            sym.low24h = Number((parseFloat(t.lowPrice) * resolved.multiplier).toFixed(resolved.precision));
            sym.volume24h = parseFloat(t.volume);
            sym.quoteVolume24h = parseFloat(t.quoteVolume);
            latestPrices.set(sym.symbol, price);
          }
        });
        lastSymbolsFetchTime = Date.now();
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
        let currentExitPrice = latestPrices.get(trade.symbol) || trade.entryPrice;

        const resolved = resolveLiveMarketSymbol(trade.symbol);
        if (resolved.underlying) {
          try {
            const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${resolved.underlying}`);
            if (priceRes.ok) {
              const priceData = await priceRes.json();
              const underlyingPrice = parseFloat(priceData.price);
              const prec = resolved.precision ?? 2;
              currentExitPrice = Number((underlyingPrice * resolved.multiplier).toFixed(prec));
              latestPrices.set(trade.symbol, currentExitPrice);
            }
          } catch {}
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

  // Binance Klines proxy with fallback (supports both Spot and OTC mappings)
  app.get('/api/markets/klines', async (req, res) => {
    const rawSymbol = (req.query.symbol as string) || 'BTCUSDT';
    const interval = (req.query.interval as string) || '1m';
    const limit = parseInt((req.query.limit as string) || '100', 10);

    const { underlying, multiplier, precision } = resolveUnderlyingSymbol(rawSymbol);

    try {
      const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${underlying}&interval=${interval}&limit=${limit}`;
      const response = await fetch(binanceUrl);
      if (response.ok) {
        const raw: (string | number)[][] = await response.json();
        const prec = precision ?? (rawSymbol.endsWith('_OTC') ? 5 : 2);
        const candles = raw.map(item => {
          const o = parseFloat(String(item[1])) * multiplier;
          const h = parseFloat(String(item[2])) * multiplier;
          const l = parseFloat(String(item[3])) * multiplier;
          const c = parseFloat(String(item[4])) * multiplier;
          return {
            time: Math.floor(Number(item[0]) / 1000),
            open: Number(o.toFixed(prec)),
            high: Number(h.toFixed(prec)),
            low: Number(l.toFixed(prec)),
            close: Number(c.toFixed(prec)),
            volume: parseFloat(String(item[5])),
          };
        });
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
    const isOtcTrade = symbol.endsWith('_OTC') || otcPriceEngine.getPair(symbol) !== undefined;

    if (isOtcTrade) {
      const resolved = resolveUnderlyingSymbol(symbol);
      let foundUnderlying = false;
      if (resolved.underlying) {
        try {
          const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${resolved.underlying}`);
          if (priceRes.ok) {
            const priceData = await priceRes.json();
            const underlyingPrice = parseFloat(priceData.price);
            const prec = resolved.precision ?? 5;
            entryPrice = Number((underlyingPrice * resolved.multiplier).toFixed(prec));
            latestPrices.set(symbol, entryPrice);
            foundUnderlying = true;
          }
        } catch {}
      }
      if (!foundUnderlying) {
        const otcPrice = otcPriceEngine.getCurrentPrice(symbol);
        if (otcPrice > 0) {
          entryPrice = otcPrice;
        }
      }
    } else {
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
    }

    let payoutRate = 85;
    if (isOtcTrade) {
      const otcConfig = otcPriceEngine.getPair(symbol);
      payoutRate = otcConfig ? otcConfig.payoutRate : otcPriceEngine.getDefaultPayout();
    } else {
      const symbolConfig = cachedSymbols.find(s => s.symbol === symbol);
      payoutRate = symbolConfig ? symbolConfig.payoutRate : 85;
    }
    const potentialPayout = numInvestment * (1 + payoutRate / 100);

    const now = Date.now();
    const tradeId = 'CB-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const otcPair = isOtcTrade ? otcPriceEngine.getPair(symbol) : undefined;
    const finalDisplayPair = displayPair || (otcPair ? otcPair.displayName : `${symbol.replace('USDT', '')}/USDT`);

    const trade: TradeRecord = {
      id: tradeId,
      userId: 'user_default',
      accountMode,
      symbol,
      displayPair: finalDisplayPair,
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
        provider: isOtcTrade ? 'OTC' : 'BINANCE',
        market: isOtcTrade ? 'SYNTHETIC' : 'SPOT',
        symbol,
        timestamp: now,
        entryPrice,
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
    const {
      amount,
      method = 'Binance Pay',
      address,
      receiverBinanceId,
      binanceId,
      currentLiveBalance,
      network = 'Binance Pay UID Transfer',
      userId = 'usr_johirul',
      userName = 'Johirul Islam',
      userEmail = 'johirul4848@gmail.com',
    } = req.body;

    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid withdrawal amount required' });
    }
    if (numAmount < 10) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is $10.00 USD. Requests under $10 are not permitted.' });
    }

    // Sync client-side live balance if provided
    const clientBal = typeof currentLiveBalance === 'number' ? currentLiveBalance : parseFloat(currentLiveBalance);
    if (!isNaN(clientBal) && clientBal > walletState.liveBalance) {
      walletState.liveBalance = clientBal;
    }

    const effectiveBalance = Math.max(walletState.liveBalance, !isNaN(clientBal) ? clientBal : 0);

    if (effectiveBalance < 10) {
      return res.status(400).json({ error: 'Minimum live balance of $10.00 USD required to submit a withdrawal.' });
    }
    if (effectiveBalance < numAmount) {
      return res.status(400).json({ error: `Insufficient Live Balance ($${effectiveBalance.toFixed(2)} USD available) for this withdrawal request.` });
    }

    // Deduct from live balance immediately into pending escrow
    walletState.liveBalance = Math.max(0, effectiveBalance - numAmount);

    const targetBinanceId = (receiverBinanceId || binanceId || address || '').toString().trim() || '794380283';

    const newWithdrawal: WithdrawalRequestRecord = {
      id: 'WTH-' + Math.floor(10000 + Math.random() * 90000),
      userId,
      userName,
      userEmail,
      amount: numAmount,
      currency: 'USD',
      method: method || 'Binance Pay',
      address: targetBinanceId,
      binanceId: targetBinanceId,
      receiverBinanceId: targetBinanceId,
      network: network || 'Binance Pay UID Transfer',
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

  // ==========================================
  // OTC MARKET & ADMIN OTC MANAGEMENT ENDPOINTS
  // ==========================================

  // 1. Get all OTC pairs
  app.get('/api/otc/pairs', (req, res) => {
    res.json(otcPriceEngine.getAllPairs());
  });

  // 2. Get OTC historical klines
  app.get('/api/otc/klines', (req, res) => {
    const symbol = (req.query.symbol as string) || 'EURUSD_OTC';
    const interval = ((req.query.interval as string) || '1m') as Timeframe;
    const limit = parseInt((req.query.limit as string) || '150', 10);
    const candles = otcPriceEngine.getHistoricalCandles(symbol, interval, limit);
    res.json(candles);
  });

  // 3. Get current OTC price
  app.get('/api/otc/price', (req, res) => {
    const symbol = (req.query.symbol as string) || 'EURUSD_OTC';
    const price = otcPriceEngine.getCurrentPrice(symbol);
    res.json({ symbol, price, timestamp: Date.now() });
  });

  // 4. Admin - Get all OTC pairs with configuration
  app.get('/api/admin/otc/pairs', (req, res) => {
    res.json({
      pairs: otcPriceEngine.getAllPairs(),
      defaultPayout: otcPriceEngine.getDefaultPayout(),
      maxAllowedPayout: 93,
    });
  });

  // 5. Admin - Create new OTC pair
  app.post('/api/admin/otc/pairs', (req, res) => {
    const { symbol, displayName, baseAsset, quoteAsset, category, payoutRate, price, pricePrecision } = req.body;
    if (!symbol) {
      return res.status(400).json({ error: 'Pair symbol is required' });
    }
    const created = otcPriceEngine.createPair({
      symbol,
      displayName,
      baseAsset,
      quoteAsset,
      category,
      payoutRate: Math.min(93, Number(payoutRate) || 93),
      price: Number(price) || 1.0,
      pricePrecision: pricePrecision !== undefined ? Number(pricePrecision) : 5,
    });
    res.json({ success: true, pair: created });
  });

  // 6. Admin - Update OTC pair
  app.put('/api/admin/otc/pairs/:id', (req, res) => {
    const { id } = req.params;
    const { displayName, category, sortOrder, payoutRate, status, enabled } = req.body;
    const updated = otcPriceEngine.updatePair(id, {
      ...(displayName !== undefined && { displayName }),
      ...(category !== undefined && { category }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      ...(payoutRate !== undefined && { payoutRate: Math.min(93, Number(payoutRate)) }),
      ...(status !== undefined && { status }),
      ...(enabled !== undefined && { enabled: Boolean(enabled) }),
    });

    if (!updated) {
      return res.status(404).json({ error: 'OTC Pair not found' });
    }
    res.json({ success: true, pair: updated });
  });

  // 7. Admin - Delete OTC pair
  app.delete('/api/admin/otc/pairs/:id', (req, res) => {
    const { id } = req.params;
    const deleted = otcPriceEngine.deletePair(id);
    if (!deleted) {
      return res.status(404).json({ error: 'OTC Pair not found' });
    }
    res.json({ success: true, message: 'OTC Pair deleted successfully' });
  });

  // 8. Admin - Set Global Default OTC Payout
  app.post('/api/admin/otc/default-payout', (req, res) => {
    const { rate } = req.body;
    const newRate = otcPriceEngine.setDefaultPayout(Number(rate) || 93);
    res.json({ success: true, defaultPayout: newRate, maxAllowed: 93 });
  });

  // Create HTTP Server to host both Express REST and WebSocket Server
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws/otc' });

  interface ClientSubscription {
    symbol?: string;
    timeframe?: Timeframe;
    subscribeTickers?: boolean;
  }

  const clientSubs = new Map<WebSocket, ClientSubscription>();

  wss.on('connection', (ws) => {
    clientSubs.set(ws, { symbol: 'EURUSD_OTC', timeframe: '1m', subscribeTickers: true });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        const sub = clientSubs.get(ws) || {};

        if (data.type === 'subscribe') {
          if (data.symbol) sub.symbol = data.symbol;
          if (data.timeframe) sub.timeframe = data.timeframe;
          clientSubs.set(ws, sub);

          // Send confirmation & initial candles
          ws.send(JSON.stringify({
            type: 'subscribed',
            symbol: sub.symbol,
            timeframe: sub.timeframe,
          }));

          const history = otcPriceEngine.getHistoricalCandles(sub.symbol!, sub.timeframe || '1m', 150);
          ws.send(JSON.stringify({
            type: 'history',
            symbol: sub.symbol,
            timeframe: sub.timeframe,
            candles: history,
          }));
        } else if (data.type === 'subscribe_tickers') {
          sub.subscribeTickers = true;
          clientSubs.set(ws, sub);
          ws.send(JSON.stringify({
            type: 'tickers',
            symbols: otcPriceEngine.getAllAsMarketSymbols(),
          }));
        }
      } catch (e) {
        // Safe handle
      }
    });

    ws.on('close', () => {
      clientSubs.delete(ws);
    });
  });

  // Stream OTC ticks to connected clients
  otcPriceEngine.onTick((tick) => {
    const payload = JSON.stringify({
      type: 'tick',
      symbol: tick.symbol,
      price: tick.price,
      timestamp: tick.timestamp,
      direction: tick.direction,
      changePercent: tick.changePercent,
      volume: tick.volume,
    });

    for (const [ws, sub] of clientSubs.entries()) {
      if (ws.readyState === WebSocket.OPEN && sub.symbol === tick.symbol) {
        ws.send(payload);
      }
    }
  });

  // Stream OTC candle updates to connected clients
  otcPriceEngine.onCandle((candle, isNewBar, symbol, timeframe) => {
    const payload = JSON.stringify({
      type: 'candle',
      symbol,
      timeframe,
      candle,
      isNewBar,
    });

    for (const [ws, sub] of clientSubs.entries()) {
      if (ws.readyState === WebSocket.OPEN && sub.symbol === symbol && sub.timeframe === timeframe) {
        ws.send(payload);
      }
    }
  });

  // Broadcast ticker updates periodically
  setInterval(() => {
    if (clientSubs.size === 0) return;
    const payload = JSON.stringify({
      type: 'tickers',
      symbols: otcPriceEngine.getAllAsMarketSymbols(),
    });

    for (const [ws, sub] of clientSubs.entries()) {
      if (ws.readyState === WebSocket.OPEN && sub.subscribeTickers) {
        ws.send(payload);
      }
    }
  }, 1000);

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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CryptoBari Trading Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
