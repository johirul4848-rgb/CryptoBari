import React, { useState } from 'react';
import { UserProfile } from '../../types';
import {
  ArrowLeft,
  User,
  Mail,
  Globe,
  Sparkles,
  Check,
  LogOut,
  Wallet,
  ArrowDownLeft,
  Plus,
  ShieldCheck,
  Award,
  Calendar,
  Lock,
  Smartphone,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { getTraderTier } from '../../utils/tier';

interface ProfilePageProps {
  onBack: () => void;
  profile: UserProfile;
  liveBalance?: number;
  demoBalance?: number;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onOpenDeposit: () => void;
  onOpenWithdrawal: () => void;
  onLogout?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBack,
  profile,
  liveBalance = 250.0,
  demoBalance = 10000.0,
  onUpdateProfile,
  onOpenDeposit,
  onOpenWithdrawal,
  onLogout,
}) => {
  const [name, setName] = useState(profile.name || 'Johirul Islam');
  const [email, setEmail] = useState(profile.email || 'johirul4848@gmail.com');
  const [country, setCountry] = useState(profile.country || 'Bangladesh');
  const [binanceId, setBinanceId] = useState('794380283');
  const [isSaved, setIsSaved] = useState(false);

  const tierInfo = getTraderTier(liveBalance);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    onUpdateProfile({
      name: name.trim(),
      email: email.trim(),
      country: country.trim(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header Bar with Back Button */}
      <div className="sticky top-0 z-40 bg-[#0c101c]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl">
        <button
          id="profile-back-top-btn"
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-xs sm:text-sm">Back to Trading Terminal</span>
        </button>

        {/* Center Title Badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black shadow-lg ring-2 ring-cyan-400/30">
            <User className="w-5 h-5" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-black text-white tracking-wide">Trader Profile</div>
            <div className="text-[10px] text-cyan-400 font-medium">Account Settings & Balances</div>
          </div>
        </div>

        {/* Right Action: Quick Deposit */}
        <button
          id="profile-quick-deposit-btn"
          onClick={() => {
            sound.playClick();
            onOpenDeposit();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Deposit Funds</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Profile Identity Card */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#151c2e] via-[#101726] to-[#0c1220] border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.1)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-[#F0B90B] to-yellow-200 text-slate-950 flex items-center justify-center font-black shadow-2xl ring-4 ring-amber-400/30">
                  <User className="w-10 h-10 stroke-[2.5]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 ring-2 ring-[#0b101c] flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{name}</h1>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black shadow-sm ${tierInfo.badgeClass}`}>
                    {tierInfo.label}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>KYC Verified</span>
                  </span>
                </div>

                <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                  <span>UID: <strong className="text-slate-200 font-mono">#794380283</strong></span>
                  <span>•</span>
                  <span>Email: <strong className="text-slate-200">{email}</strong></span>
                  <span>•</span>
                  <span>Region: <strong className="text-slate-200">{country}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenDeposit();
                }}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs hover:from-emerald-400 hover:to-teal-400 transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Deposit</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenWithdrawal();
                }}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
                <span>Withdraw</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3D Wallet & Stats Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Live Balance Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/60 to-[#0e2118] border border-emerald-500/40 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span>Live Trading Balance</span>
              <Wallet className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              ${liveBalance.toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-300 flex items-center gap-1">
              <span>Ready for live orders & payout</span>
            </div>
          </div>

          {/* Demo Balance Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 to-[#1d1b14] border border-amber-500/30 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span>Practice Demo Wallet</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
              ${demoBalance.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">Risk-free virtual credit</div>
          </div>

          {/* Payout Rate Advantage */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-950/40 to-[#101b2b] border border-cyan-500/30 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <span>Standard Payout</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              Up to 95%
            </div>
            <div className="text-[10px] text-cyan-300">Binance 1-Sec Feed Precision</div>
          </div>

          {/* Account Tier Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-950/40 to-[#1a142e] border border-purple-500/30 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-purple-400 text-xs font-bold uppercase tracking-wider">
              <span>Trader Status</span>
              <Award className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-300">
              {tierInfo.label}
            </div>
            <div className="text-[10px] text-slate-400">Priority Treasury Processing</div>
          </div>
        </div>

        {/* Edit Information Form & Security Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Personal Settings Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-[#0f1422] border border-slate-800 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Personal Information
                  </h3>
                  <p className="text-[11px] text-slate-400">Update your verified profile identity</p>
                </div>

                {isSaved && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved Successfully!</span>
                  </span>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Full Trader Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-xl text-white text-sm outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-xl text-white text-sm outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Country / Region</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-xl text-white text-sm outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Default Binance ID (For Payouts)</label>
                  <input
                    type="text"
                    value={binanceId}
                    onChange={(e) => setBinanceId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-xl text-white font-mono text-sm outline-none transition-colors"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs transition cursor-pointer shadow-lg active:scale-95"
                  >
                    Save Changes
                  </button>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playLose();
                        onLogout();
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Security & Verification Details (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-[#0e1320] border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Security & Account Protection</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div>
                    <div className="font-bold text-white">2-Factor Authentication</div>
                    <div className="text-[11px] text-slate-400">Secured via Binance Cloud Bridge</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div>
                    <div className="font-bold text-white">Identity Verification</div>
                    <div className="text-[11px] text-slate-400">Passport / NID Confirmed</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    Level 2 Pass
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div>
                    <div className="font-bold text-white">Binance Pay Link</div>
                    <div className="text-[11px] text-slate-400">UID: 794380283</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                    Linked
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Back Button as requested */}
        <div className="pt-8 pb-12 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            id="profile-back-bottom-btn"
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-sm transition-all cursor-pointer shadow-lg active:scale-95 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Trading Terminal</span>
          </button>

          <div className="text-xs text-slate-500 text-center sm:text-right">
            <span>Trading Account UID #794380283 • Connected to Binance Liquidity</span>
          </div>
        </div>
      </div>
    </div>
  );
};
