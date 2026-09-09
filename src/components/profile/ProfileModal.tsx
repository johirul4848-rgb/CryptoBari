import React, { useState } from 'react';
import { UserProfile } from '../../types';
import {
  X,
  User,
  Mail,
  Globe,
  Sparkles,
  Check,
  LogOut,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { getTraderTier } from '../../utils/tier';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  liveBalance?: number;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  liveBalance = 250.0,
  onUpdateProfile,
  onOpenDeposit,
  onOpenWithdraw,
  onLogout,
}) => {
  const [name, setName] = useState(profile.name || 'Johirul Islam');
  const [email, setEmail] = useState(profile.email || 'johirul4848@gmail.com');
  const [country, setCountry] = useState(profile.country || 'Bangladesh');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-[#0b101c] border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_30px_rgba(255,255,255,0.05)] flex flex-col">
        {/* Header Bar */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[#162033] via-[#101726] to-[#162033] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-cyan-500/20 ring-2 ring-white/10">
                <User className="w-7 h-7" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-[#0b101c] flex items-center justify-center">
                <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">{name}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] ${tierInfo.badgeClass}`}>
                  {tierInfo.label}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Trader UID: {profile.id || 'USR-79438'}
              </div>
            </div>
          </div>

          <button
            id="close-profile-modal-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Membership Tier Card */}
          <div className="p-4 rounded-2xl bg-[#111728] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Membership Status</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs ${tierInfo.badgeClass}`}>
                {tierInfo.label}
              </span>
            </div>

            {/* Progress bar to next tier */}
            {tierInfo.nextTierLabel && (
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>
                    Current Balance: <strong className="text-white">${liveBalance.toFixed(2)}</strong>
                  </span>
                  <span>
                    Next: <strong className="text-amber-400">{tierInfo.nextTierLabel} (${tierInfo.nextTierBalance})</strong>
                  </span>
                </div>
                <div className="w-full h-2 bg-[#090d18] rounded-full overflow-hidden border border-slate-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${tierInfo.progressPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Reach $500 balance for Silver Member or $1,000 for VIP Member perks.
                </p>
              </div>
            )}
            {tierInfo.tier === 'VIP' && (
              <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>You are enjoying VIP status with 0% fees and priority processing!</span>
              </p>
            )}
          </div>

          {/* Quick Wallet Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              id="profile-quick-deposit"
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
                if (onOpenDeposit) onOpenDeposit();
              }}
              className="p-3 rounded-2xl bg-gradient-to-r from-[#F0B90B]/15 to-amber-500/20 border border-[#F0B90B]/40 hover:border-[#F0B90B] flex items-center justify-between text-left transition cursor-pointer group shadow-sm"
            >
              <div>
                <div className="text-xs font-black text-white group-hover:text-amber-300 transition">Deposit</div>
                <div className="text-[10px] text-slate-400">Via Binance Pay</div>
              </div>
              <ArrowDownLeft className="w-5 h-5 text-[#F0B90B]" />
            </button>

            <button
              id="profile-quick-withdraw"
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
                if (onOpenWithdraw) onOpenWithdraw();
              }}
              className="p-3 rounded-2xl bg-gradient-to-r from-blue-500/15 to-indigo-500/20 border border-blue-500/40 hover:border-blue-400 flex items-center justify-between text-left transition cursor-pointer group shadow-sm"
            >
              <div>
                <div className="text-xs font-black text-white group-hover:text-blue-300 transition">Withdrawal</div>
                <div className="text-[10px] text-slate-400">Min $10.00 USD</div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-blue-400" />
            </button>
          </div>

          {/* Clean Trader Details Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080c16] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080c16] border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Country / Region</span>
              </label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080c16] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                placeholder="e.g. Bangladesh"
              />
            </div>

            {/* Submit & Save */}
            <div className="pt-2 flex items-center gap-3">
              <button
                id="save-profile-btn"
                type="submit"
                className={`flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md ${
                  isSaved
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Saved Changes!</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onLogout();
                    onClose();
                  }}
                  className="px-4 py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
