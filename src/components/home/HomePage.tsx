import React, { useState } from 'react';
import { MarketSymbol } from '../../types';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  DollarSign,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Globe,
  Award,
  Clock,
  Flame,
  ChevronRight,
  Play,
  Users,
  BarChart3,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { AssetIcon } from '../trading/AssetIcon';

interface HomePageProps {
  onStartTrading: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  symbols?: MarketSymbol[];
  onOpenAdminPortal?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartTrading,
  onOpenAuth,
  symbols = [],
  onOpenAdminPortal,
}) => {
  const [calcInvestment, setCalcInvestment] = useState<number>(10);
  const payoutRate = 95; // 95% payout
  const estimatedReturn = calcInvestment * (1 + payoutRate / 100);
  const estimatedProfit = calcInvestment * (payoutRate / 100);

  // Recent live payouts simulating real global winners
  const recentPayouts = [
    { name: 'Johirul I.', flag: '🇧🇩', pair: 'BTC/USDT', profit: '+$38.00', time: '12s ago' },
    { name: 'Elena V.', flag: '🇩🇪', pair: 'ETH/USDT', profit: '+$190.00', time: '24s ago' },
    { name: 'Michael K.', flag: '🇺🇸', pair: 'SOL/USDT', profit: '+$95.00', time: '41s ago' },
    { name: 'Aisha N.', flag: '🇦🇪', pair: 'EUR/USD OTC', profit: '+$47.50', time: '55s ago' },
    { name: 'Lucas S.', flag: '🇧🇷', pair: 'BNB/USDT', profit: '+$19.00', time: '1m ago' },
    { name: 'Tanvir H.', flag: '🇧🇩', pair: 'BTC/USDT', profit: '+$95.00', time: '2m ago' },
  ];

  // Verified Diverse Global Traders with high-res images
  const globalTraders = [
    {
      name: 'Sarah Chen',
      country: 'Singapore',
      flag: '🇸🇬',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      role: 'Cryptocurrency Day Trader',
      trades: '3,420 trades',
      winRate: '88.4%',
      quote: 'The 100% real-time Binance connection eliminates fake spikes. I withdrew $4,800 to Binance Pay in 90 seconds.',
    },
    {
      name: 'Carlos Mendez',
      country: 'Spain',
      flag: '🇪🇸',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      role: 'Full-Time Forex & Crypto Trader',
      trades: '5,190 trades',
      winRate: '91.2%',
      quote: 'Being able to place $0.50 micro trades let me test 50 different 1-minute strategies without burning my capital.',
    },
    {
      name: 'Fatima Al-Mansoor',
      country: 'United Arab Emirates',
      flag: '🇦🇪',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      role: 'VIP Strategic Trader',
      trades: '2,890 trades',
      winRate: '89.7%',
      quote: 'The cleanest interface with zero hidden spread. The fast 30s & 60s settlements are razor-sharp.',
    },
    {
      name: 'David Okafor',
      country: 'Nigeria',
      flag: '🇳🇬',
      image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
      role: 'Mobile Futures Trader',
      trades: '1,940 trades',
      winRate: '86.5%',
      quote: 'CryptoBari gave me financial freedom. Instant TRC20 deposits and fair candlestick chart execution.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      {/* 1. TOP PROFESSIONAL COMPACT HEADER (Clean & Net) */}
      <header className="sticky top-0 z-40 bg-[#0c111e]/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-3 select-none flex items-center justify-between">
        {/* Brand Logo & Binance Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30 text-base">
              CB
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  CryptoBari
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3 fill-amber-400" />
                  Binance Cloud Feed
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block">
                Authentic High-Yield Binary Trading Terminal
              </p>
            </div>
          </div>
        </div>

        {/* Live Mini Ticker (Center Desktop) */}
        <div className="hidden xl:flex items-center gap-4 px-3 py-1 rounded-full bg-[#131a2a] border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-slate-300">100% LIVE DATA</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">BTC:</span>
            <span className="text-emerald-400 font-bold">$79,902.00</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Min Trade:</span>
            <span className="text-amber-400 font-bold">$0.50</span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            id="home-signin-btn"
            onClick={() => {
              sound.playClick();
              onOpenAuth('login');
            }}
            className="px-3.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer"
          >
            Sign In
          </button>

          <button
            id="home-start-journey-nav-btn"
            onClick={() => {
              sound.playWin();
              onOpenAuth('register');
            }}
            className="px-4 py-2 md:px-5 md:py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.35)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Start Journey</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION WITH 3D ELEMENTS & MOTIVATION */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Ambient 3D Glowing Background Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[700px] h-[350px] bg-gradient-to-tr from-amber-500/15 via-emerald-500/10 to-sky-500/15 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Motivational Trust Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-slate-800/80 to-emerald-500/20 border border-amber-500/40 text-amber-300 text-xs md:text-sm font-extrabold shadow-lg mb-6 animate-pulse">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Start Real Trading With Only $0.50 (50 Cents)</span>
          <span className="hidden sm:inline text-slate-400">• Up to 98% Instant Payout</span>
        </div>

        {/* High-Impact Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          The World’s Most Trusted{' '}
          <span className="bg-gradient-to-r from-amber-400 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">
            Binary Options Platform
          </span>
        </h1>

        {/* Subtitle with Real Data & Authenticity */}
        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed mb-8">
          Powered by <strong>100% direct Binance WebSocket feeds</strong>. Zero manipulation, zero delay,
          and instant automated withdrawals via Binance Pay. Practice with a free{' '}
          <span className="text-amber-400 font-bold">$10,000 Demo Balance</span> or place live trades from just{' '}
          <span className="text-emerald-400 font-bold">$0.50</span>.
        </p>

        {/* Main CTA Group */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-12">
          {/* Primary "Start Journey" Button */}
          <button
            id="hero-start-journey-btn"
            onClick={() => {
              sound.playWin();
              onOpenAuth('register');
            }}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black text-base md:text-lg rounded-2xl shadow-[0_10px_35px_rgba(245,158,11,0.4)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>Start Your Trading Journey</span>
            <ArrowRight className="w-5 h-5 stroke-[3] transition-transform group-hover:translate-x-1" />
          </button>

          {/* Secondary "Instant Demo Practice" Button */}
          <button
            id="hero-demo-try-btn"
            onClick={() => {
              sound.playClick();
              onStartTrading();
            }}
            className="w-full sm:w-auto px-6 py-4 bg-[#141b2c] hover:bg-[#1a233a] border border-slate-700/90 text-slate-200 font-extrabold text-base rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Try Free $10,000 Demo</span>
          </button>
        </div>

        {/* Key Core Guarantees Grid (Trust Pillars) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full max-w-4xl">
          <div className="p-3.5 md:p-4 rounded-xl bg-[#111726]/80 border border-slate-800/80 backdrop-blur-md flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2 font-black">
              $0.50
            </div>
            <span className="font-extrabold text-xs md:text-sm text-slate-100">Micro-Budget Trades</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Start with just 50 cents</span>
          </div>

          <div className="p-3.5 md:p-4 rounded-xl bg-[#111726]/80 border border-slate-800/80 backdrop-blur-md flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 fill-emerald-400" />
            </div>
            <span className="font-extrabold text-xs md:text-sm text-slate-100">Binance Cloud Feed</span>
            <span className="text-[11px] text-slate-400 mt-0.5">100% authentic real data</span>
          </div>

          <div className="p-3.5 md:p-4 rounded-xl bg-[#111726]/80 border border-slate-800/80 backdrop-blur-md flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center mb-2">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xs md:text-sm text-slate-100">Instant Binance Pay</span>
            <span className="text-[11px] text-slate-400 mt-0.5">0-fee deposit & withdrawals</span>
          </div>

          <div className="p-3.5 md:p-4 rounded-xl bg-[#111726]/80 border border-slate-800/80 backdrop-blur-md flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2">
              <Award className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xs md:text-sm text-slate-100">Up to 98% Payout</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Highest industry return</span>
          </div>
        </div>
      </section>

      {/* 3. LIVE RECENT PAYOUT TICKER BAR */}
      <div className="w-full bg-[#0d1320] border-y border-slate-800 py-2.5 px-4 overflow-x-auto no-scrollbar flex items-center gap-6 text-xs select-none">
        <div className="flex items-center gap-1.5 text-amber-400 font-extrabold shrink-0">
          <Flame className="w-4 h-4 fill-amber-400" />
          <span>LIVE PAYOUTS:</span>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          {recentPayouts.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-[#141b2a] px-3 py-1 rounded-full border border-slate-700/60 font-mono text-[11px]">
              <span>{p.flag}</span>
              <span className="font-bold text-slate-200">{p.name}</span>
              <span className="text-slate-400">{p.pair}</span>
              <span className="text-emerald-400 font-extrabold">{p.profit}</span>
              <span className="text-slate-500 text-[10px]">({p.time})</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. INTERACTIVE 3D PROFIT CALCULATOR & MOTIVATION */}
      <section className="py-16 md:py-20 px-4 md:px-8 max-w-5xl mx-auto w-full">
        <div className="p-6 md:p-10 rounded-3xl bg-gradient-to-br from-[#121829] via-[#0f1524] to-[#141c30] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative overflow-hidden">
          {/* Subtle Background Badge */}
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              Interactive Profit Estimator
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-3">
              Calculate Your Trade Earnings
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-2">
              Select your investment amount—even starting from just <strong>$0.50</strong>—to see your instant return.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Interactive Slider */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-300">Investment Amount</span>
                  <span className="text-xl md:text-2xl font-black font-mono text-amber-400">
                    ${calcInvestment.toFixed(2)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="500"
                  step="0.5"
                  value={calcInvestment}
                  onChange={(e) => setCalcInvestment(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
                  <span>$0.50 (Min)</span>
                  <span>$50.00</span>
                  <span>$250.00</span>
                  <span>$500.00</span>
                </div>
              </div>

              {/* Quick preset buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">Quick set:</span>
                {[0.5, 1, 5, 10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      sound.playClick();
                      setCalcInvestment(amt);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      calcInvestment === amt
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                        : 'bg-[#182033] text-slate-300 hover:bg-[#202b44]'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="p-3.5 bg-[#172033]/80 rounded-xl border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Fixed <strong>{payoutRate}% return</strong> on winning 60s trades. No hidden fees or commissions.
                </span>
              </div>
            </div>

            {/* Right: Calculated Yield Card */}
            <div className="p-6 rounded-2xl bg-[#161e32] border border-slate-700/80 shadow-2xl flex flex-col items-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Projected Total Return (In 60s)
              </span>
              <div className="text-4xl md:text-5xl font-black font-mono text-emerald-400 my-2">
                ${estimatedReturn.toFixed(2)}
              </div>
              <div className="text-sm font-bold text-slate-300 mb-6">
                Net Profit: <span className="text-emerald-400 font-mono">+${estimatedProfit.toFixed(2)}</span>
              </div>

              <button
                onClick={() => {
                  sound.playWin();
                  onOpenAuth('register');
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-98 text-slate-950 font-black text-sm shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Trade This with $10,000 Demo</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. VERIFIED WORLDWIDE TRADERS SHOWCASE (Male & Female, Diverse Countries) */}
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Worldwide Community of 250,000+ Traders</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Real Traders. Real Binance Feeds. Real Success.
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-2">
            Meet active traders who trust CryptoBari for transparent candlestick chart execution every day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {globalTraders.map((trader, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#111728] border border-slate-800 p-4 flex flex-col justify-between hover:border-amber-500/40 transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group"
            >
              <div>
                {/* Photo & Flag */}
                <div className="relative mb-3.5 overflow-hidden rounded-xl h-44 w-full bg-slate-800">
                  <img
                    src={trader.image}
                    alt={trader.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs font-bold flex items-center gap-1">
                    <span>{trader.flag}</span>
                    <span className="text-slate-200 text-[10px]">{trader.country}</span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-500/90 text-slate-950 text-[10px] font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                    <span>Verified Trader</span>
                  </div>
                </div>

                {/* Name & Role */}
                <h3 className="font-extrabold text-sm text-white">{trader.name}</h3>
                <p className="text-[11px] text-amber-400 font-bold mb-2">{trader.role}</p>

                {/* Stats */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#161f33] text-[11px] font-mono text-slate-300 mb-3">
                  <span>{trader.trades}</span>
                  <span className="text-emerald-400 font-bold">{trader.winRate} Win Rate</span>
                </div>

                {/* Testimonial Quote */}
                <p className="text-xs text-slate-400 italic leading-relaxed">
                  "{trader.quote}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. TRUST & AUTHENTICITY COMPARISON (Why We Are 100% Authentic) */}
      <section className="py-12 md:py-16 px-4 md:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            Transparency Matters
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            CryptoBari vs. Manipulated Brokers
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Never trade on platforms that fake or delay their candle data.
          </p>
        </div>

        <div className="rounded-2xl bg-[#111728] border border-slate-800 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-3 p-3.5 md:p-4 bg-[#151c30] border-b border-slate-700/80 font-bold text-xs md:text-sm">
            <span className="text-slate-400">Feature</span>
            <span className="text-amber-400 font-black text-center">CryptoBari (Binance Partner)</span>
            <span className="text-rose-400 text-center">Unregulated Brokers</span>
          </div>

          <div className="divide-y divide-slate-800 text-xs md:text-sm">
            <div className="grid grid-cols-3 p-3.5 md:p-4 items-center">
              <span className="font-bold text-slate-200">Price Feed Source</span>
              <span className="text-emerald-400 font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                100% Real Binance WebSocket
              </span>
              <span className="text-slate-400 text-center">Manipulated In-House Feeds</span>
            </div>

            <div className="grid grid-cols-3 p-3.5 md:p-4 items-center">
              <span className="font-bold text-slate-200">Minimum Trade Entry</span>
              <span className="text-emerald-400 font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                $0.50 (50 cents)
              </span>
              <span className="text-slate-400 text-center">$10 - $50 Forced Minimum</span>
            </div>

            <div className="grid grid-cols-3 p-3.5 md:p-4 items-center">
              <span className="font-bold text-slate-200">Withdrawal Speed</span>
              <span className="text-emerald-400 font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Instant (Binance Pay / TRC20)
              </span>
              <span className="text-slate-400 text-center">3 to 7 Days Pending</span>
            </div>

            <div className="grid grid-cols-3 p-3.5 md:p-4 items-center">
              <span className="font-bold text-slate-200">Demo Balance Reload</span>
              <span className="text-emerald-400 font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Free Unlimited $10,000 Reset
              </span>
              <span className="text-slate-400 text-center">Restricted or Expiring</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL 3D MOTIVATIONAL CALL TO ACTION BANNER */}
      <section className="py-12 md:py-20 px-4 md:px-8 max-w-5xl mx-auto w-full">
        <div className="p-8 md:p-14 rounded-3xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-emerald-500/20 border border-amber-500/40 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(245,158,11,0.2)]">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            Ready to Start Trading with Real Market Data?
          </h2>
          <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto mb-8">
            Create your account in 30 seconds. Start with a $10,000 free demo or begin with a $0.50 micro-budget.
          </p>

          <button
            id="footer-start-journey-cta"
            onClick={() => {
              sound.playWin();
              onOpenAuth('register');
            }}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black text-base md:text-lg rounded-2xl shadow-[0_10px_35px_rgba(245,158,11,0.45)] active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Start Trading Journey Now</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </section>

      {/* 8. FOOTER WITH SECURITY BADGES & POLICIES */}
      <footer className="mt-auto bg-[#070a10] border-t border-slate-800/80 px-4 md:px-8 py-8 text-xs text-slate-500 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <div className="font-extrabold text-sm text-slate-300">CryptoBari Financial</div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md">
              High-precision binary prediction platform connected to Binance Spot & Futures liquidity.
              Risk warning: Trading carries risk of capital loss.
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <span className="hover:text-slate-200 cursor-pointer">Binance Pay Verified</span>
            <span>•</span>
            <span className="hover:text-slate-200 cursor-pointer">Security Protocol</span>
            <span>•</span>
            <span className="hover:text-slate-200 cursor-pointer">24/7 Support</span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-center md:justify-end gap-2.5">
            <span>© 2026 Cryptobari , all rights reserved</span>
            <button
              id="admin-round-shape-portal-btn"
              type="button"
              onClick={() => {
                sound.playClick();
                if (onOpenAdminPortal) onOpenAdminPortal();
              }}
              title="CryptoBari Broker Administration Portal"
              aria-label="Admin Portal"
              className="w-3.5 h-3.5 rounded-full bg-slate-700/60 hover:bg-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.9)] border border-slate-600/70 hover:border-cyan-300 transition-all duration-300 cursor-pointer active:scale-75 shrink-0"
            />
          </div>
        </div>
      </footer>
    </div>
  );
};
