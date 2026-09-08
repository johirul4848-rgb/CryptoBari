import React from 'react';
import { Shield, Zap, Smartphone, Globe, Lock, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { sound } from '../../utils/audio';

interface PlatformOverviewProps {
  onStartTrading: () => void;
}

export const PlatformOverview: React.FC<PlatformOverviewProps> = ({ onStartTrading }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0a0e16] text-slate-100 custom-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-10 py-6">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Next-Gen Binary Options Trading Platform
          </div>

          <div className="flex justify-center">
            <Logo size="lg" />
          </div>

          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            Trade cryptocurrency binary contracts with real-time streaming price feeds directly from Binance Spot. Experience millisecond execution, transparent payout calculations, and seamless practice modes.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                sound.playClick();
                onStartTrading();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <span>Launch Trading Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-[#111724] border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-100">Live Binance Spot Streams</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No simulated or delayed prices. Public Binance WebSockets deliver sub-second candle feeds and live price ticks.
            </p>
          </div>

          <div className="bg-[#111724] border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-100">Server-Authoritative Settlement</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All trades are registered, monitored, and expired by the backend server. The browser cannot manipulate trade outcomes.
            </p>
          </div>

          <div className="bg-[#111724] border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-100">Mobile-First Touch Design</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ergonomically engineered for single-handed trading on smartphones with oversized UP/DOWN controls and responsive chart gestures.
            </p>
          </div>
        </div>

        {/* Specs summary */}
        <div className="bg-[#111624] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-black text-sm text-slate-200 uppercase tracking-wider">Trading Architecture Specifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-3 bg-[#151c2c] rounded-xl border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">STARTING DEMO BALANCE</span>
              <span className="text-amber-400 font-extrabold text-base">$10,000.00</span>
            </div>
            <div className="p-3 bg-[#151c2c] rounded-xl border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">PAYOUT RATES</span>
              <span className="text-emerald-400 font-extrabold text-base">Up to 92%</span>
            </div>
            <div className="p-3 bg-[#151c2c] rounded-xl border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">EXPIRY INTERVALS</span>
              <span className="text-slate-200 font-extrabold text-base">5s - 1 hour</span>
            </div>
            <div className="p-3 bg-[#151c2c] rounded-xl border border-slate-800/80">
              <span className="text-slate-500 text-[10px] block">REFERENCE PROVIDER</span>
              <span className="text-blue-400 font-extrabold text-base">Binance API</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
