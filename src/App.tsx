import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MarketSymbol,
  Trade,
  UserWallet,
  AccountMode,
  ConnectionStatus,
  Timeframe,
  UserProfile,
  AdminStats,
  Transaction,
} from './types';
import { apiService } from './services/api';
import { binanceMarketData } from './services/binanceMarketData';
import { otcPriceEngine } from './services/otcEngine';
import { generateInitialLiveSymbols } from './constants/liveMarketPairs';
import { Header } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { AssetBar } from './components/trading/AssetBar';
import { ChartContainer } from './components/trading/ChartContainer';
import { TradePanel } from './components/trading/TradePanel';
import { MobileTradePanel } from './components/trading/MobileTradePanel';
import { AssetSelectorModal } from './components/trading/AssetSelectorModal';
import { TradeResultToast } from './components/trading/TradeResultToast';
import { TradeHistoryPage } from './components/history/TradeHistoryPage';
import { WatchlistPage } from './components/markets/WatchlistPage';
import { DepositModal } from './components/wallet/DepositModal';
import { WithdrawModal } from './components/wallet/WithdrawModal';
import { DepositPage } from './components/wallet/DepositPage';
import { WithdrawalPage } from './components/wallet/WithdrawalPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { NoticesModal } from './components/notices/NoticesModal';
import { SupportPage } from './components/support/SupportPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminAuthModal } from './components/admin/AdminAuthModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { ProfileModal } from './components/profile/ProfileModal';
import { ReferralPage } from './components/referral/ReferralPage';
import { PlatformOverview } from './components/common/PlatformOverview';
import { HomePage } from './components/home/HomePage';
import { AuthModal } from './components/auth/AuthModal';
import { sound } from './utils/audio';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const initialLiveList = generateInitialLiveSymbols();
// Default initial symbol: Top live pair (e.g. BTC/USDT or EUR/USD)
const DEFAULT_SYMBOL: MarketSymbol = initialLiveList[0];

export const App: React.FC = () => {
  // Authentication & Guest State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('quotex_authenticated') === 'true';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdminViewOpen, setIsAdminViewOpen] = useState(false);

  // Navigation & UI State
  const [currentTab, setCurrentTab] = useState<NavTab>('trade');
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isNoticesModalOpen, setIsNoticesModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [chartType, setChartType] = useState<'candles' | 'area'>('candles');

  // Market & Trading State: Initialized with Curated Live pairs (Binance + Forex + Trap)
  const [symbols, setSymbols] = useState<MarketSymbol[]>(() => initialLiveList);
  const [activeSymbol, setActiveSymbol] = useState<MarketSymbol>(() => DEFAULT_SYMBOL);
  const [openTabs, setOpenTabs] = useState<MarketSymbol[]>(() => initialLiveList.slice(0, 4));
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [currentPrice, setCurrentPrice] = useState<number>(DEFAULT_SYMBOL.price);
  const [favorites, setFavorites] = useState<string[]>([
    'BTCUSDT',
    'ETHUSDT',
    'SOLUSDT',
    'XRPUSDT',
    'DOGEUSDT',
    'SUIUSDT',
    'PEPEUSDT',
    'BNBUSDT',
  ]);

  const binanceSymbolsRef = useRef<MarketSymbol[]>([]);
  const activeSymbolRef = useRef<MarketSymbol>(activeSymbol);
  useEffect(() => {
    activeSymbolRef.current = activeSymbol;
  }, [activeSymbol]);

  // Connection & Account
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('LIVE');
  const [accountMode, setAccountMode] = useState<AccountMode>('DEMO');
  const [wallet, setWallet] = useState<UserWallet>({
    demoBalance: 10000.00,
    liveBalance: 250.00,
    lockedBalance: 0,
    currency: 'USD',
  });

  // Trades & Transactions
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [settledTradeToast, setSettledTradeToast] = useState<Trade | null>(null);
  const [isPlacingTrade, setIsPlacingTrade] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'TX-INIT-01',
      type: 'DEPOSIT',
      amount: 250.00,
      currency: 'USD',
      status: 'COMPLETED',
      timestamp: Date.now() - 86400000,
      description: 'Initial balance deposit (USDT TRC20)',
    },
  ]);

  // Profile & Admin State
  const [profile, setProfile] = useState<UserProfile>({
    id: 'USR-79102',
    name: 'Crypto Trader',
    email: 'trader@cryptobari.com',
    role: 'ADMIN',
    kycStatus: 'VERIFIED',
    twoFactorEnabled: false,
    createdAt: Date.now() - 86400000 * 30,
  });

  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 14280,
    activeUsers: 842,
    totalTrades: 128490,
    winningTrades: 67320,
    losingTrades: 61170,
    totalVolume: 4982310.00,
    totalDeposits: 3204910.00,
    totalWithdrawals: 2194020.00,
    platformProfit: 194890.00,
  });

  // Real-time Binance + Forex live market connection status & dynamic discovery
  useEffect(() => {
    let isMounted = true;

    // Register initial live symbols with Binance market data manager
    binanceMarketData.registerLiveSymbols(initialLiveList);

    const unsubStatus = binanceMarketData.onStatusChange((status) => {
      if (isMounted) {
        setConnectionStatus(status);
      }
    });

    // Discover all Binance and live pairs dynamically
    binanceMarketData
      .discoverAllSpotSymbols()
      .then((fetched) => {
        if (isMounted && fetched && fetched.length > 0) {
          binanceSymbolsRef.current = fetched;
          setSymbols(fetched);
        }
      })
      .catch((err) => {
        console.warn('Could not discover live symbols:', err);
      });

    // Subscribe to all-ticker live updates (!miniTicker@arr)
    const unsubTickers = binanceMarketData.subscribeMiniTickers((updatedList) => {
      if (!isMounted) return;
      const map = new Map(updatedList.map((s) => [s.symbol, s]));

      setSymbols((prev) =>
        prev.map((s) => (map.has(s.symbol) ? { ...s, ...map.get(s.symbol)! } : s))
      );

      setOpenTabs((prev) =>
        prev.map((s) => (map.has(s.symbol) ? { ...s, ...map.get(s.symbol)! } : s))
      );

      setActiveSymbol((prev) => {
        if (map.has(prev.symbol)) {
          const updated = map.get(prev.symbol)!;
          return {
            ...prev,
            price: updated.price ?? prev.price,
            priceChangePercent: updated.priceChangePercent,
            high24h: updated.high24h,
            low24h: updated.low24h,
            volume24h: updated.volume24h,
            quoteVolume24h: updated.quoteVolume24h,
          };
        }
        return prev;
      });
    });

    return () => {
      isMounted = false;
      unsubStatus();
      unsubTickers();
    };
  }, []);

  // Fetch initial wallet state from server
  useEffect(() => {
    apiService.fetchWallet().then(w => {
      if (w) setWallet(w);
    }).catch(() => {});
  }, []);

  // Fetch active and past trades periodically
  useEffect(() => {
    const checkTrades = async () => {
      try {
        const trades = await apiService.fetchTrades();
        if (!trades) return;

        // Compare newly settled trades for audio/visual notification
        const active = trades.filter(t => t.status === 'ACTIVE');
        const closed = trades.filter(t => t.status === 'SETTLED');

        // Check if a trade recently settled
        setActiveTrades(prevActive => {
          for (const prev of prevActive) {
            const nowSettled = closed.find(c => c.id === prev.id);
            if (nowSettled) {
              // Sound notification
              if (nowSettled.result === 'WIN') {
                sound.playWin();
              } else if (nowSettled.result === 'LOSS') {
                sound.playLoss();
              }
              setSettledTradeToast(nowSettled);
              // Update wallet
              apiService.fetchWallet().then(w => {
                if (w) setWallet(w);
              });
            }
          }
          return active;
        });

        setAllTrades(trades);
      } catch {
        // silent
      }
    };

    const interval = setInterval(checkTrades, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to Binance 24h ticker for all symbol price updates
  useEffect(() => {
    const unsub = apiService.subscribeAllTickers((updatedSymbols) => {
      setSymbols(prevSymbols => {
        const symbolMap = new Map(updatedSymbols.map(s => [s.symbol, s]));
        return prevSymbols.map(sym => {
          const u = symbolMap.get(sym.symbol);
          if (!u) return sym;
          return {
            ...sym,
            price: u.price,
            priceChangePercent: u.priceChangePercent,
            high24h: u.high24h,
            low24h: u.low24h,
            volume24h: u.volume24h,
            quoteVolume24h: u.quoteVolume24h,
          };
        });
      });
    });

    return unsub;
  }, []);

  // Handle active symbol switch
  const handleSelectSymbol = useCallback((symbol: MarketSymbol) => {
    setActiveSymbol(symbol);
    setCurrentPrice(symbol.price);

    // Add to open tabs if not already present
    setOpenTabs(prev => {
      if (prev.some(t => t.symbol === symbol.symbol)) return prev;
      return [...prev, symbol];
    });
  }, []);

  // Handle close tab
  const handleCloseTab = useCallback((symbolCode: string) => {
    setOpenTabs(prev => {
      const remaining = prev.filter(t => t.symbol !== symbolCode);
      if (remaining.length === 0) return prev;
      if (activeSymbol.symbol === symbolCode) {
        setActiveSymbol(remaining[0]);
        setCurrentPrice(remaining[0].price);
      }
      return remaining;
    });
  }, [activeSymbol]);

  // Handle toggle favorite
  const handleToggleFavorite = useCallback((symbolCode: string) => {
    setFavorites(prev =>
      prev.includes(symbolCode) ? prev.filter(s => s !== symbolCode) : [...prev, symbolCode]
    );
  }, []);

  // Handle place trade
  const handlePlaceTrade = async (params: {
    direction: 'UP' | 'DOWN';
    investment: number;
    durationSeconds: number;
  }) => {
    setIsPlacingTrade(true);
    try {
      const newTrade = await apiService.createTrade({
        symbol: activeSymbol.symbol,
        displayPair: activeSymbol.displayPair,
        direction: params.direction,
        investment: params.investment,
        durationSeconds: params.durationSeconds,
        accountMode,
        payoutRate: activeSymbol.payoutRate,
      });

      // Optimistically add to active trades
      setActiveTrades(prev => [newTrade, ...prev]);
      setAllTrades(prev => [newTrade, ...prev]);

      // Deduct from wallet optimistically
      setWallet(prev => {
        if (accountMode === 'DEMO') {
          return { ...prev, demoBalance: Math.max(0, prev.demoBalance - params.investment) };
        } else {
          return {
            ...prev,
            liveBalance: Math.max(0, prev.liveBalance - params.investment),
            lockedBalance: prev.lockedBalance + params.investment,
          };
        }
      });
    } catch (err) {
      console.error('Failed to create trade:', err);
    } finally {
      setIsPlacingTrade(false);
    }
  };

  // Handle reset demo balance
  const handleResetDemo = async () => {
    try {
      sound.playClick();
      const res = await apiService.resetDemoBalance();
      const newBal = (res && typeof res.newBalance === 'number') ? res.newBalance : 10000.00;
      setWallet(prev => ({
        ...prev,
        demoBalance: newBal,
      }));
    } catch {
      setWallet(prev => ({ ...prev, demoBalance: 10000.00 }));
    }
  };

  // Handle user deposit request via Binance Pay
  const handleDepositSuccess = (amount: number, method: string, binanceId: string, txHash: string) => {
    setTransactions(prev => [
      {
        id: `DEP-${Date.now()}`,
        type: 'DEPOSIT',
        amount,
        currency: 'USD',
        status: 'PENDING',
        timestamp: Date.now(),
        description: `Deposit via Binance Pay (Sender UID: ${binanceId || 'N/A'}) • Tx: ${txHash.slice(0, 10)}...`,
      },
      ...prev,
    ]);
  };

  // Handle user withdraw submission via Binance Pay
  const handleWithdrawSuccess = (amount: number, method: string, address: string) => {
    setWallet(prev => ({
      ...prev,
      liveBalance: Math.max(0, prev.liveBalance - amount),
    }));

    setTransactions(prev => [
      {
        id: `WTH-${Date.now()}`,
        type: 'WITHDRAWAL',
        amount,
        currency: 'USD',
        status: 'PENDING',
        timestamp: Date.now(),
        description: `Withdrawal via Binance Pay to ID: ${address}`,
      },
      ...prev,
    ]);
  };

  // Admin update asset payout
  const handleUpdateSymbolPayout = (symbolCode: string, payoutRate: number, enabled: boolean) => {
    setSymbols(prev =>
      prev.map(s => s.symbol === symbolCode ? { ...s, payoutRate, enabled } : s)
    );
    if (activeSymbol.symbol === symbolCode) {
      setActiveSymbol(prev => ({ ...prev, payoutRate, enabled }));
    }
  };

  const handleLogout = () => {
    sound.playLose();
    setIsAuthenticated(false);
    localStorage.removeItem('quotex_authenticated');
    setCurrentTab('trade');
  };

  const handleAuthSuccess = (userData: { name: string; email: string; country: string }) => {
    sound.playWin();
    setIsAuthenticated(true);
    localStorage.setItem('quotex_authenticated', 'true');
    if (userData.name) {
      setProfile(prev => ({
        ...prev,
        name: userData.name,
        email: userData.email || prev.email,
      }));
    }
    setIsAuthModalOpen(false);
    setCurrentTab('trade');
  };

  const availableBalance = accountMode === 'DEMO' ? wallet.demoBalance : wallet.liveBalance;

  // Master Broker Admin Panel View
  if (isAdminViewOpen) {
    return (
      <AdminPanel
        symbols={symbols}
        onUpdateSymbolPayout={handleUpdateSymbolPayout}
        onClose={() => setIsAdminViewOpen(false)}
        currentLiveBalance={wallet.liveBalance}
        onDepositApprovedNotification={(amount, newBalance) => {
          setWallet(prev => ({ ...prev, liveBalance: newBalance }));
          setTransactions(prev => [
            {
              id: 'TX-DEP-' + Date.now(),
              type: 'DEPOSIT',
              amount,
              currency: 'USD',
              status: 'COMPLETED',
              timestamp: Date.now(),
              description: `Admin approved deposit credited ($${amount.toFixed(2)})`,
            },
            ...prev,
          ]);
        }}
      />
    );
  }

  // Unauthenticated / Landing View: Show 3D HomePage as the primary entry point
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans select-none">
        <HomePage
          symbols={symbols}
          onStartTrading={() => {
            sound.playClick();
            setAuthModalMode('register');
            setIsAuthModalOpen(true);
          }}
          onOpenAuth={(mode) => {
            sound.playClick();
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          onOpenAdminPortal={() => {
            setIsAdminAuthModalOpen(true);
          }}
        />

        {/* 3D Glassmorphic Login / Register Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />

        {/* 3-Stage Broker Admin Security Portal Modal */}
        <AdminAuthModal
          isOpen={isAdminAuthModalOpen}
          onClose={() => setIsAdminAuthModalOpen(false)}
          onSuccess={() => {
            setIsAdminAuthModalOpen(false);
            setIsAdminViewOpen(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d14] text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER */}
      <Header
        connectionStatus={connectionStatus}
        accountMode={accountMode}
        onToggleAccountMode={(mode) => {
          sound.playClick();
          setAccountMode(mode);
        }}
        demoBalance={wallet.demoBalance}
        liveBalance={wallet.liveBalance}
        onResetDemo={handleResetDemo}
        onOpenDeposit={() => {
          sound.playClick();
          setCurrentTab('deposit');
        }}
        onOpenWithdrawal={() => {
          sound.playClick();
          setCurrentTab('withdrawal');
        }}
        onOpenNotifications={() => {
          sound.playClick();
          setIsNoticesModalOpen(true);
        }}
        onOpenProfile={() => {
          sound.playClick();
          setCurrentTab('profile');
        }}
        unreadNotificationsCount={activeTrades.length}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeTradesCount={activeTrades.length}
        onLogout={handleLogout}
        userName={profile.name}
      />

      {/* 2. MAIN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Dynamic Center Area based on currentTab */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Back bar on non-trade views */}
          {currentTab !== 'trade' && (
            <div className="bg-[#111624] border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between z-10 shrink-0">
              <button
                id="page-back-to-trading-btn"
                onClick={() => {
                  sound.playClick();
                  setCurrentTab('trade');
                }}
                className="flex items-center gap-2 text-xs font-black text-[#00c278] hover:text-emerald-300 bg-[#00c278]/15 hover:bg-[#00c278]/25 px-3 py-1.5 rounded-lg border border-[#00c278]/40 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>← Back to Trading</span>
              </button>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {currentTab}
              </span>
            </div>
          )}

          {currentTab === 'trade' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Asset Tabs Bar along top of terminal */}
              <AssetBar
                activeSymbol={activeSymbol}
                openTabs={openTabs}
                onSelectSymbol={handleSelectSymbol}
                onCloseTab={handleCloseTab}
                onOpenSelector={() => setIsAssetSelectorOpen(true)}
                allSymbols={symbols}
              />

              {/* Chart and Trading Panel Grid */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                {/* Candlestick Interactive Chart */}
                <div className="flex-1 flex flex-col h-full min-h-0 relative">
                  <ErrorBoundary fallbackTitle="Trading Chart">
                    <ChartContainer
                      symbol={activeSymbol}
                      currentPrice={currentPrice}
                      timeframe={timeframe}
                      onTimeframeChange={setTimeframe}
                      chartType={chartType}
                      onChartTypeChange={setChartType}
                      accountMode={accountMode}
                      connectionStatus={connectionStatus}
                      activeTrades={activeTrades.filter(t => t.symbol === activeSymbol.symbol)}
                      onOpenSelector={() => setIsAssetSelectorOpen(true)}
                      onPriceUpdate={(price) => {
                        setCurrentPrice(price);
                        setActiveSymbol(prev => ({ ...prev, price }));
                      }}
                    />
                  </ErrorBoundary>
                </div>

                {/* Right Desktop Trading Panel (Quotex style) */}
                <div className="hidden lg:flex h-full">
                  <TradePanel
                    symbol={activeSymbol}
                    currentPrice={currentPrice}
                    availableBalance={availableBalance}
                    accountMode={accountMode}
                    activeTrades={activeTrades}
                    allTrades={allTrades}
                    isPlacingTrade={isPlacingTrade}
                    onPlaceTrade={handlePlaceTrade}
                  />
                </div>
              </div>

              {/* Dedicated Mobile Bottom Trade Panel (Mobile-First) */}
              <MobileTradePanel
                symbol={activeSymbol}
                currentPrice={currentPrice}
                availableBalance={availableBalance}
                accountMode={accountMode}
                activeTrades={activeTrades}
                isPlacingTrade={isPlacingTrade}
                onPlaceTrade={handlePlaceTrade}
              />
            </div>
          )}

          {currentTab === 'referral' && (
            <ReferralPage
              liveBalance={wallet.liveBalance}
              userName={profile.name}
              userEmail={profile.email}
              onBackToTrade={() => {
                sound.playClick();
                setCurrentTab('trade');
              }}
              onConvertToLive={(amount) => {
                setWallet((prev) => ({
                  ...prev,
                  liveBalance: Number((prev.liveBalance + amount).toFixed(2)),
                }));
                setTransactions((prev) => [
                  {
                    id: `TX-REF-${Date.now().toString().slice(-6)}`,
                    type: 'DEPOSIT',
                    amount,
                    currency: 'USD',
                    status: 'COMPLETED',
                    timestamp: Date.now(),
                    description: `Referral Commission Transfer to Live Balance (+$${amount.toFixed(2)})`,
                  },
                  ...prev,
                ]);
              }}
            />
          )}

          {currentTab === 'markets' && (
            <WatchlistPage
              symbols={symbols}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onTradePair={(sym) => {
                handleSelectSymbol(sym);
                setCurrentTab('trade');
              }}
            />
          )}

          {currentTab === 'history' && (
            <TradeHistoryPage trades={allTrades} />
          )}

          {currentTab === 'deposit' && (
            <div className="flex-1 overflow-y-auto">
              <DepositPage
                liveBalance={wallet.liveBalance}
                userEmail={profile.email}
                userName={profile.name}
                onBack={() => {
                  sound.playClick();
                  setCurrentTab('trade');
                }}
                onDepositSuccess={(amount, method, binanceId) => {
                  setTransactions((prev) => [
                    {
                      id: `TX-DEP-${Date.now().toString().slice(-6)}`,
                      type: 'DEPOSIT',
                      amount,
                      currency: 'USD',
                      status: 'PENDING',
                      timestamp: Date.now(),
                      description: `Deposit request via ${method} (Binance ID: ${binanceId})`,
                    },
                    ...prev,
                  ]);
                }}
              />
            </div>
          )}

          {currentTab === 'withdrawal' && (
            <div className="flex-1 overflow-y-auto">
              <WithdrawalPage
                liveBalance={wallet.liveBalance}
                userEmail={profile.email}
                userName={profile.name}
                onBack={() => {
                  sound.playClick();
                  setCurrentTab('trade');
                }}
                onWithdrawSuccess={(amount, method, address) => {
                  setWallet((prev) => ({
                    ...prev,
                    liveBalance: Math.max(0, prev.liveBalance - amount),
                  }));
                  setTransactions((prev) => [
                    {
                      id: `TX-WTH-${Date.now().toString().slice(-6)}`,
                      type: 'WITHDRAWAL',
                      amount,
                      currency: 'USD',
                      status: 'PENDING',
                      timestamp: Date.now(),
                      description: `Withdrawal request to Binance ID ${address} (${method})`,
                    },
                    ...prev,
                  ]);
                }}
              />
            </div>
          )}

          {currentTab === 'profile' && (
            <div className="flex-1 overflow-y-auto">
              <ProfilePage
                profile={profile}
                liveBalance={wallet.liveBalance}
                demoBalance={wallet.demoBalance}
                onBack={() => {
                  sound.playClick();
                  setCurrentTab('trade');
                }}
                onOpenDeposit={() => {
                  sound.playClick();
                  setCurrentTab('deposit');
                }}
                onOpenWithdrawal={() => {
                  sound.playClick();
                  setCurrentTab('withdrawal');
                }}
                onLogout={handleLogout}
                onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
              />
            </div>
          )}

          {currentTab === 'wallet' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0c1018]">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setCurrentTab('deposit');
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer transition active:scale-95 flex items-center gap-2"
                  >
                    <span>+ Deposit (Binance Pay)</span>
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setCurrentTab('withdrawal');
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer transition active:scale-95 flex items-center gap-2"
                  >
                    <span>Withdrawal (Binance Pay • Min $10)</span>
                  </button>
                </div>
                <div className="p-6 bg-[#111724] border border-slate-800 rounded-2xl">
                  <h2 className="text-xl font-bold text-slate-100">Wallet Details</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 font-mono text-sm">
                    <div className="p-4 bg-[#151c2c] rounded-xl">
                      <span className="text-slate-400 text-xs block">DEMO BALANCE</span>
                      <span className="text-amber-400 font-black text-xl">${wallet.demoBalance.toFixed(2)}</span>
                    </div>
                    <div className="p-4 bg-[#151c2c] rounded-xl">
                      <span className="text-slate-400 text-xs block">LIVE REAL BALANCE</span>
                      <span className="text-emerald-400 font-black text-xl">${wallet.liveBalance.toFixed(2)}</span>
                    </div>
                    <div className="p-4 bg-[#151c2c] rounded-xl">
                      <span className="text-slate-400 text-xs block">LOCKED IN TRADES</span>
                      <span className="text-slate-300 font-black text-xl">${wallet.lockedBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'support' && <SupportPage />}

          {currentTab === 'admin' && (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="bg-[#0f172a] border-b border-cyan-500/30 px-4 py-2.5 flex items-center justify-between z-10 shrink-0">
                <span className="text-xs font-black text-cyan-400">Broker Governance & Treasury Center</span>
                <button
                  onClick={() => setIsAdminViewOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition active:scale-95"
                >
                  Launch Fullscreen Master Admin Panel →
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdminDashboard
                  stats={adminStats}
                  symbols={symbols}
                  trades={allTrades}
                  onUpdateSymbol={handleUpdateSymbolPayout}
                />
              </div>
            </div>
          )}

          {currentTab === 'landing' && (
            <div className="flex-1 overflow-y-auto">
              <HomePage
                symbols={symbols}
                onStartTrading={() => setCurrentTab('trade')}
                onOpenAuth={(mode) => {
                  setAuthModalMode(mode);
                  setIsAuthModalOpen(true);
                }}
                onOpenAdminPortal={() => {
                  setIsAdminAuthModalOpen(true);
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeTradesCount={activeTrades.length}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* 4. MODALS & POPUPS */}
      {/* 3-Stage Broker Admin Security Portal Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={() => {
          setIsAdminAuthModalOpen(false);
          setIsAdminViewOpen(true);
        }}
      />
      {/* Searchable Binance Asset Selector Modal */}
      <AssetSelectorModal
        isOpen={isAssetSelectorOpen}
        onClose={() => setIsAssetSelectorOpen(false)}
        symbols={symbols}
        activeSymbol={activeSymbol}
        onSelectSymbol={handleSelectSymbol}
        onToggleFavorite={handleToggleFavorite}
        favorites={favorites}
      />

      {/* Dedicated Binance Pay Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDepositSuccess={handleDepositSuccess}
        userName={profile.name}
        userEmail={profile.email}
      />

      {/* Dedicated Binance Pay Withdrawal Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        liveBalance={wallet.liveBalance}
        onWithdrawSuccess={handleWithdrawSuccess}
        userName={profile.name}
        userEmail={profile.email}
      />

      {/* Broker Notices & Announcements Modal */}
      <NoticesModal
        isOpen={isNoticesModalOpen}
        onClose={() => setIsNoticesModalOpen(false)}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        liveBalance={wallet.liveBalance}
        onUpdateProfile={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
        onOpenDeposit={() => setIsDepositModalOpen(true)}
        onOpenWithdraw={() => setIsWithdrawModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Settlement Result Toast Popup */}
      {settledTradeToast && (
        <TradeResultToast
          trade={settledTradeToast}
          onDismiss={() => setSettledTradeToast(null)}
        />
      )}
    </div>
  );
};

export default App;
