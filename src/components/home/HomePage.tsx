import React, { useState } from 'react';
import { MarketSymbol } from '../../types';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Globe,
  Award,
  Clock,
  Play,
  Users,
  BarChart3,
  Wallet,
  ArrowUpRight,
  TrendingDown,
  Activity,
  DollarSign,
  AlertTriangle,
  Layers,
  ChevronRight,
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
  const [activeStep, setActiveStep] = useState<number>(1);
  const [calcInvestment, setCalcInvestment] = useState<number>(10);
  const payoutRate = 93; // 93% standard high payout
  const estimatedReturn = calcInvestment * (1 + payoutRate / 100);
  const estimatedProfit = calcInvestment * (payoutRate / 100);

  // 4 Interactive Trading Steps
  const tradingSteps = [
    {
      step: 1,
      title: 'Select an Asset',
      shortTitle: '1. Select Asset',
      desc: 'Pick from 40+ authentic Binance live cryptocurrency spot pairs including Bitcoin, Ethereum, Solana, and top trending meme coins.',
      detail: 'Direct Binance Spot Liquidity',
      icon: Layers,
      color: 'from-amber-500 to-amber-400',
      badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      mockup: {
        type: 'asset',
        items: [
          { symbol: 'BTCUSDT', name: 'Bitcoin', price: '$79,029.70', payout: '93%', change: '+3.4%' },
          { symbol: 'ETHUSDT', name: 'Ethereum', price: '$2,618.05', payout: '92%', change: '+2.1%' },
          { symbol: 'SOLUSDT', name: 'Solana', price: '$103.82', payout: '91%', change: '+5.7%' },
        ],
      },
    },
    {
      step: 2,
      title: 'Monitor the Chart',
      shortTitle: '2. Monitor Chart',
      desc: 'Analyze live second-by-second candlestick price action directly from the Binance WebSocket book with zero delay or fake spread.',
      detail: 'Real-Time Binance Candlesticks',
      icon: BarChart3,
      color: 'from-sky-500 to-sky-400',
      badgeColor: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
      mockup: {
        type: 'chart',
        symbol: 'BTC/USDT',
        price: '79,029.70',
        high: '79,450.00',
        low: '78,210.50',
      },
    },
    {
      step: 3,
      title: 'Place a Trade',
      shortTitle: '3. Place Trade',
      desc: 'Predict if price goes UP or DOWN. Invest as little as $0.50 (50 cents) with durations from 30 seconds to 60 minutes.',
      detail: 'Instant 1-Click Order Execution',
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-400',
      badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
      mockup: {
        type: 'trade',
        investment: '$10.00',
        payout: '+93%',
        duration: '01:00',
        potentialProfit: '+$9.30',
      },
    },
    {
      step: 4,
      title: 'Get the Result',
      shortTitle: '4. Get Result',
      desc: 'At expiry, profit is automatically locked in and credited to your wallet in real time. Withdraw instantly to Binance Pay.',
      detail: 'Up to 93% Instant Settlement',
      icon: Award,
      color: 'from-purple-500 to-purple-400',
      badgeColor: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
      mockup: {
        type: 'result',
        status: 'WIN',
        payout: '$19.30',
        profit: '+$9.30',
        time: 'Settled in 60s',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      {/* 1. TOP PROFESSIONAL COMPACT HEADER */}
      <header className="sticky top-0 z-40 bg-[#0a0f1d]/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-3 select-none flex items-center justify-between">
        {/* Brand Logo & Binance Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
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
        <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 rounded-full bg-[#111728] border border-slate-800 text-xs font-mono shadow-inner">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-slate-300">100% REAL MARKET DATA</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">BTC/USDT:</span>
            <span className="text-emerald-400 font-bold">$79,029.70</span>
          </div>
          <span className="text-slate-700">|</span>
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
            className="px-3.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer transform-gpu hover:scale-105 active:scale-95"
          >
            Sign In
          </button>

          <button
            id="home-start-journey-nav-btn"
            onClick={() => {
              sound.playWin();
              onOpenAuth('register');
            }}
            className="px-4 py-2 md:px-5 md:py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.35)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 transform-gpu hover:scale-105"
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Ambient 3D Glowing Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] md:w-[750px] h-[350px] bg-gradient-to-tr from-amber-500/15 via-emerald-500/10 to-sky-500/15 rounded-full blur-[110px] pointer-events-none -z-10" />

        {/* Anti-Manipulation Guarantee Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-slate-800/90 to-amber-500/20 border border-emerald-500/40 text-emerald-300 text-xs md:text-sm font-extrabold shadow-lg mb-6 transform-gpu hover:scale-105 transition-all cursor-pointer">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Non-Manipulated Live Broker • 100% Direct Binance L2 WebSocket Feed</span>
        </div>

        {/* Hero Title Required by User */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Grow your capital by making the{' '}
          <span className="bg-gradient-to-r from-amber-400 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">
            right trading predictions
          </span>
        </h1>

        {/* Subtitle Required by User */}
        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed mb-10">
          Will the price go up or down? Predict the price movement of a trading asset and place a trade.
          Powered by real-time Binance spot exchange feeds with zero artificial spikes.
        </p>

        {/* Main CTA Group */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14">
          {/* Primary "Try it for free" Button with Demo details */}
          <button
            id="hero-demo-try-btn"
            onClick={() => {
              sound.playClick();
              onStartTrading();
            }}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black text-base md:text-lg rounded-2xl shadow-[0_10px_35px_rgba(245,158,11,0.4)] active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center transform-gpu hover:scale-105 group"
          >
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Try It for Free</span>
              <ArrowRight className="w-5 h-5 stroke-[3] transition-transform group-hover:translate-x-1" />
            </div>
            <span className="text-[11px] text-slate-900/80 font-bold mt-0.5">
              Practice on a demo account without registration
            </span>
          </button>

          {/* Secondary "Open Real Account" Button ($0.50 micro entry) */}
          <button
            id="hero-start-journey-btn"
            onClick={() => {
              sound.playWin();
              onOpenAuth('register');
            }}
            className="w-full sm:w-auto px-7 py-4 bg-[#121829] hover:bg-[#182137] border border-slate-700/90 text-slate-200 font-extrabold text-base rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center shadow-xl transform-gpu hover:scale-105 group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Open Real Account</span>
            </div>
            <span className="text-[11px] text-amber-400/90 font-bold mt-0.5">
              Trade micro-lots from just $0.50 (50¢)
            </span>
          </button>
        </div>

        {/* Trust Highlights Grid with Tactile Zoom Feel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full max-w-4xl">
          <div className="p-4 rounded-2xl bg-[#0f1526]/80 border border-slate-800/80 backdrop-blur-md flex flex-col items-center text-center transition-all duration-300 transform-gpu hover:scale-[1.05] hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2 font-black text-sm">
              $0.50
            </div>
            <span className="font-extrabold text-xs md:text-sm text-slate-100">Micro-Budget Trading</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Start with only 50 cents</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0f1526]/80 border border-slate-800/80 backdrop-blur-md flex flex-col items-center text-center transition-all duration-300 transform-gpu hover:scale-[1.05] hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 fill-emerald-400" />
            </div>
            <span className="font-extrabold text-xs md:text-sm text-slate-100">Binance Cloud Feed</span>
            <span className="text-[11px] text-slate-400 mt-0.5">100% unmanipulated ticks</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0f1526]/80 border border-slate-800/80 backdrop-blur-md flex flex-col items-center text-center transition-all duration-300 transform-gpu hover:scale-[1.05] hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/10 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-2">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xs md:text-sm text-slate-100">Instant Binance Pay</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Zero deposit & payout fees</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0f1526]/80 border border-slate-800/80 backdrop-blur-md flex flex-col items-center text-center transition-all duration-300 transform-gpu hover:scale-[1.05] hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2">
              <Award className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xs md:text-sm text-slate-100">Up to 93% Return</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Highest verified broker payout</span>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE 4-STEP TRADING SYSTEM ("capital-money") WITH ZOOM FEEL */}
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
            How It Works • Capital Growth
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-3">
            4 Simple Steps to Trade and Profit
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-2">
            Experience our ultra-smooth binary prediction workflow. Click or hover on any step to preview.
          </p>
        </div>

        {/* Step Selector Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-8">
          {tradingSteps.map((s) => {
            const Icon = s.icon;
            const isCurrent = activeStep === s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveStep(s.step);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all duration-300 transform-gpu hover:scale-[1.04] active:scale-[0.98] cursor-pointer flex items-center gap-3 ${
                  isCurrent
                    ? 'bg-[#151c2e] border-amber-400/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                    : 'bg-[#0f1422] border-slate-800/80 hover:bg-[#131929] hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    isCurrent ? 'bg-amber-400 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  0{s.step}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                    {s.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Click to inspect</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Card with Deep Zoom & Interactive Preview */}
        {(() => {
          const current = tradingSteps.find((s) => s.step === activeStep) || tradingSteps[0];
          const CurrentIcon = current.icon;

          return (
            <div className="p-6 md:p-10 rounded-3xl bg-gradient-to-br from-[#12182a] via-[#0f1424] to-[#141d33] border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-500 transform-gpu hover:scale-[1.01] hover:border-amber-500/30">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Step Description */}
                <div className="lg:col-span-6 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-slate-700 bg-slate-800/60">
                    <CurrentIcon className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400">Step 0{current.step} of 04</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">{current.detail}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {current.title}
                  </h3>

                  <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                    {current.desc}
                  </p>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => {
                        sound.playClick();
                        onStartTrading();
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs md:text-sm rounded-xl transition-all cursor-pointer transform-gpu hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <span>Try This on Demo</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveStep((prev) => (prev % 4) + 1);
                      }}
                      className="px-4 py-2.5 bg-[#172033] hover:bg-[#1d2942] border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer transform-gpu hover:scale-105"
                    >
                      <span>Next Step ➔</span>
                    </button>
                  </div>
                </div>

                {/* Right Interactive Mockup Simulation with Zoom Feedback */}
                <div className="lg:col-span-6">
                  <div className="bg-[#0b101c] rounded-2xl border border-slate-700/80 p-5 shadow-2xl transition-all duration-300 transform-gpu hover:scale-[1.03] hover:border-amber-400/50 hover:shadow-amber-500/10">
                    {/* Mockup Top Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold text-slate-200">Terminal Live Preview</span>
                      </div>
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-bold">
                        100% Real Binance WebSocket
                      </span>
                    </div>

                    {/* Step 1 Mockup: Asset Selector */}
                    {current.step === 1 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Available Spot Crypto Pairs
                        </div>
                        {current.mockup.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[#131929] hover:bg-[#192238] border border-slate-800/80 transition-all cursor-pointer transform-gpu hover:scale-[1.02]"
                          >
                            <div className="flex items-center gap-2">
                              <AssetIcon symbol={item.symbol} size="sm" showFlag={true} />
                              <div>
                                <div className="font-bold text-xs text-white">{item.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{item.symbol}</div>
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              <div className="font-bold text-xs text-slate-200">{item.price}</div>
                              <div className="text-[10px] text-emerald-400 font-bold">{item.change} • {item.payout} Payout</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Step 2 Mockup: Live Chart Preview */}
                    {current.step === 2 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AssetIcon symbol="BTCUSDT" size="sm" showFlag={true} />
                            <span className="font-bold text-sm text-white">BTC/USDT</span>
                            <span className="text-emerald-400 text-xs font-mono font-bold">$79,029.70</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">1m Candlestick</span>
                        </div>

                        {/* Simulated Candlestick Bars */}
                        <div className="h-32 bg-[#080d17] rounded-xl border border-slate-800 p-3 flex items-end justify-between gap-1.5 overflow-hidden">
                          {[40, 55, 30, 65, 80, 50, 70, 85, 95, 60, 80, 110, 90, 115, 125].map((h, i) => {
                            const isGreen = i % 3 !== 0;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                                <div className={`w-0.5 ${isGreen ? 'bg-emerald-400/50' : 'bg-rose-400/50'}`} style={{ height: `${h * 0.25}px` }} />
                                <div
                                  className={`w-full rounded-xs transition-all ${isGreen ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                  style={{ height: `${h * 0.6}px` }}
                                />
                                <div className={`w-0.5 ${isGreen ? 'bg-emerald-400/50' : 'bg-rose-400/50'}`} style={{ height: `${h * 0.15}px` }} />
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                          <span>Low: $78,210.50</span>
                          <span className="text-emerald-400">High: $79,450.00</span>
                        </div>
                      </div>
                    )}

                    {/* Step 3 Mockup: Execution */}
                    {current.step === 3 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2.5 rounded-xl bg-[#121828] border border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase">Investment</span>
                            <div className="text-base font-black text-amber-400">$10.00</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#121828] border border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase">Duration</span>
                            <div className="text-base font-black text-sky-400">01:00 min</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-center flex flex-col items-center cursor-pointer transform-gpu hover:scale-105 transition-all shadow-lg shadow-emerald-500/10">
                            <span className="text-lg font-black text-emerald-400">HIGHER ↑</span>
                            <span className="text-[10px] text-emerald-300 font-bold mt-0.5">Payout: +93%</span>
                          </div>

                          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/50 text-center flex flex-col items-center cursor-pointer transform-gpu hover:scale-105 transition-all shadow-lg shadow-rose-500/10">
                            <span className="text-lg font-black text-rose-400">LOWER ↓</span>
                            <span className="text-[10px] text-rose-300 font-bold mt-0.5">Payout: +93%</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-center text-slate-400">
                          Micro trade from <strong>$0.50</strong> • Sub-10ms server execution
                        </div>
                      </div>
                    )}

                    {/* Step 4 Mockup: Settled Profit */}
                    {current.step === 4 && (
                      <div className="space-y-3 text-center py-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/20 animate-bounce">
                          <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-emerald-400 tracking-wide uppercase">
                            Trade Won (+93% Payout)
                          </span>
                          <div className="text-3xl font-black font-mono text-white mt-1">
                            +$19.30 USD
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Credited instantly to balance. 0 withdrawal fees via Binance Pay.
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#141b2a] border border-slate-800 text-[11px] font-mono text-slate-300 flex justify-between">
                          <span>Settlement: Automatic</span>
                          <span className="text-emerald-400 font-bold">Status: Completed</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* 4. WHY CHOOSE US & ANTI-MANIPULATION GUARANTEE */}
      <section className="py-14 md:py-20 px-4 md:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10">
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
            Why Choose CryptoBari
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-3">
            Real Binance Broker vs. Manipulated Competitors
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-2">
            Many shady brokers manipulate the 5-second candle wick to liquidate your bet.
            CryptoBari runs on 100% public, verifiable Binance exchange order books.
          </p>
        </div>

        {/* Comparison Table with Deep Zoom Feedback */}
        <div className="rounded-3xl bg-[#0e1322] border border-slate-800 overflow-hidden shadow-2xl transition-all duration-300 transform-gpu hover:scale-[1.01] hover:border-amber-500/40">
          <div className="grid grid-cols-3 p-4 md:p-5 bg-[#131a2e] border-b border-slate-700/80 font-bold text-xs md:text-sm">
            <span className="text-slate-400">Feature Comparison</span>
            <span className="text-amber-400 font-black text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              CryptoBari (Binance Cloud)
            </span>
            <span className="text-rose-400 text-center flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Manipulated Brokers
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 text-xs md:text-sm">
            <div className="grid grid-cols-3 p-4 md:p-4.5 items-center hover:bg-[#12192c] transition-colors">
              <span className="font-bold text-slate-200">Price Feed Integrity</span>
              <span className="text-emerald-400 font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                100% Real Binance WebSocket
              </span>
              <span className="text-slate-400 text-center">Faked / Manipulated In-House</span>
            </div>

            <div className="grid grid-cols-3 p-4 md:p-4.5 items-center hover:bg-[#12192c] transition-colors">
              <span className="font-bold text-slate-200">Candle Wick Manipulation</span>
              <span className="text-emerald-400 font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Zero (Verifiable on Binance.com)
              </span>
              <span className="text-rose-400/90 text-center font-medium">Spikes at last second to trigger loss</span>
            </div>

            <div className="grid grid-cols-3 p-4 md:p-4.5 items-center hover:bg-[#12192c] transition-colors">
              <span className="font-bold text-slate-200">Minimum Trade Entry</span>
              <span className="text-emerald-400 font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                $0.50 (50 cents)
              </span>
              <span className="text-slate-400 text-center">$10 - $50 Forced Minimum</span>
            </div>

            <div className="grid grid-cols-3 p-4 md:p-4.5 items-center hover:bg-[#12192c] transition-colors">
              <span className="font-bold text-slate-200">Withdrawal Speed</span>
              <span className="text-emerald-400 font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Instant (Binance Pay / TRC20)
              </span>
              <span className="text-slate-400 text-center">3 to 14 Days (Verification traps)</span>
            </div>

            <div className="grid grid-cols-3 p-4 md:p-4.5 items-center hover:bg-[#12192c] transition-colors">
              <span className="font-bold text-slate-200">Free Practice Demo</span>
              <span className="text-emerald-400 font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Unlimited $10,000 Free Reloads
              </span>
              <span className="text-slate-400 text-center">Rigged Demo with Fake Win Spikes</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRADER BENEFITS (BENTO GRID WITH ZOOM FEEL) */}
      <section className="py-14 md:py-20 px-4 md:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
            Trader Benefits
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-3">
            Designed for Modern Strategic Traders
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-2">
            Enjoy premium broker conditions designed to give you an authentic edge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0e1424] border border-slate-800 transition-all duration-300 transform-gpu hover:scale-[1.04] hover:border-amber-400/50 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-1">50 Cents Micro-Trades</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Test and fine-tune your strategies on real money without risking large portions of your capital.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-bold text-amber-400">
              Min Trade: $0.50
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e1424] border border-slate-800 transition-all duration-300 transform-gpu hover:scale-[1.04] hover:border-emerald-400/50 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 fill-emerald-400" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-1">Sub-10ms Execution</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-speed binary order dispatch directly against Binance L2 orderbook feeds with zero artificial latency.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-bold text-emerald-400">
              Zero Slippage
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e1424] border border-slate-800 transition-all duration-300 transform-gpu hover:scale-[1.04] hover:border-sky-400/50 hover:shadow-xl hover:shadow-sky-500/10 cursor-pointer flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-1">Instant Binance Pay</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deposit and withdraw in seconds directly to your Binance Pay ID or USDT wallet with zero transaction fee.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-bold text-sky-400">
              0% Broker Fee
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e1424] border border-slate-800 transition-all duration-300 transform-gpu hover:scale-[1.04] hover:border-purple-400/50 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-1">93% Fixed Returns</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Know your exact payout before placing any trade. No variable spreads or hidden broker commissions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-bold text-purple-400">
              Clear Fixed Yield
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE PROFIT ESTIMATOR WITH ZOOM FEEL */}
      <section className="py-14 md:py-20 px-4 md:px-8 max-w-5xl mx-auto w-full">
        <div className="p-6 md:p-10 rounded-3xl bg-gradient-to-br from-[#121829] via-[#0f1524] to-[#141c30] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative overflow-hidden transition-all duration-300 transform-gpu hover:scale-[1.01]">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              Profit Estimator
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-3">
              Calculate Your Trade Earnings
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-2">
              Select your trade size—from <strong>$0.50</strong> to <strong>$500</strong>—to see your instant returns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Slider Column */}
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

              {/* Presets with Zoom */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">Quick set:</span>
                {[0.5, 1, 5, 10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      sound.playClick();
                      setCalcInvestment(amt);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer transform-gpu hover:scale-110 active:scale-95 ${
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
                  Guaranteed <strong>{payoutRate}% return</strong> on winning 60s trades.
                </span>
              </div>
            </div>

            {/* Projected Total Return Card with Zoom */}
            <div className="p-6 rounded-2xl bg-[#161e32] border border-slate-700/80 shadow-2xl flex flex-col items-center text-center transition-all duration-300 transform-gpu hover:scale-[1.04]">
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
                  onStartTrading();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 text-slate-950 font-black text-sm shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 transform-gpu hover:scale-105"
              >
                <span>Test This with $10,000 Demo</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION BANNER */}
      <section className="py-12 md:py-20 px-4 md:px-8 max-w-5xl mx-auto w-full">
        <div className="p-8 md:p-14 rounded-3xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-emerald-500/20 border border-amber-500/40 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(245,158,11,0.2)] transition-all duration-300 transform-gpu hover:scale-[1.01]">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            Ready to Start Trading with Real Binance Data?
          </h2>
          <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto mb-8">
            Create your account in 30 seconds or practice immediately on a free $10,000 demo account.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="footer-start-journey-cta"
              onClick={() => {
                sound.playWin();
                onOpenAuth('register');
              }}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black text-base md:text-lg rounded-2xl shadow-[0_10px_35px_rgba(245,158,11,0.45)] active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-2 transform-gpu hover:scale-105"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>

            <button
              id="footer-try-demo-cta"
              onClick={() => {
                sound.playClick();
                onStartTrading();
              }}
              className="w-full sm:w-auto px-6 py-4 bg-[#141b2c] hover:bg-[#1a233a] border border-slate-700 text-slate-200 font-extrabold text-base rounded-2xl transition-all cursor-pointer inline-flex items-center justify-center gap-2 transform-gpu hover:scale-105"
            >
              <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Practice Demo Without Registration</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER WITH SECURITY BADGES & POLICIES */}
      <footer className="mt-auto bg-[#05080f] border-t border-slate-800/80 px-4 md:px-8 py-8 text-xs text-slate-500 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <div className="font-extrabold text-sm text-slate-300">CryptoBari Financial Technologies</div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md">
              High-precision binary options terminal connected to Binance Spot & Futures liquidity.
              Risk warning: Trading carries financial risk.
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <span className="hover:text-slate-200 cursor-pointer">Binance Pay Verified</span>
            <span>•</span>
            <span className="hover:text-slate-200 cursor-pointer">Non-Manipulated Feed Guarantee</span>
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
