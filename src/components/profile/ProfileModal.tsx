import React, { useState } from 'react';
import { UserProfile } from '../../types';
import {
  X,
  ShieldCheck,
  User,
  Lock,
  Upload,
  CheckCircle2,
  Award,
  TrendingUp,
  Globe2,
  Mail,
  Phone,
  Smartphone,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { LogOut } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'security' | 'kyc'>('overview');
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || '+1 (555) 019-2834');
  const [twoFactor, setTwoFactor] = useState(profile.twoFactorEnabled);
  const [kycStatus, setKycStatus] = useState(profile.kycStatus);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    onUpdateProfile({ name, email, phone });
    setSuccessNotice('Profile details saved successfully.');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleToggle2FA = () => {
    sound.playClick();
    const nextVal = !twoFactor;
    setTwoFactor(nextVal);
    onUpdateProfile({ twoFactorEnabled: nextVal });
    setSuccessNotice(`Two-factor authentication ${nextVal ? 'enabled' : 'disabled'}.`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleSimulateKycUpload = () => {
    sound.playClick();
    setKycStatus('PENDING');
    onUpdateProfile({ kycStatus: 'PENDING' });
    setSuccessNotice('Identity documents uploaded! Verification in progress.');
    setTimeout(() => {
      setKycStatus('VERIFIED');
      onUpdateProfile({ kycStatus: 'VERIFIED' });
      setSuccessNotice('Identity successfully verified!');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-[#0c111d]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(255,255,255,0.03)] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Top 3D Glass Hero Banner */}
        <div className="relative p-5 md:p-6 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-blue-500/15 border-b border-white/10">
          <button
            id="close-profile-modal-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar with dynamic glow ring */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 text-slate-950 flex items-center justify-center font-black shadow-xl ring-4 ring-amber-400/30">
                <User className="w-8 h-8 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full ring-2 ring-[#0c111d] flex items-center justify-center shadow-md">
                <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-100">{profile.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  VIP TIER 2
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                    kycStatus === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {kycStatus === 'VERIFIED' ? 'VERIFIED TRADER' : 'KYC PENDING'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1 font-mono">
                <span>UID: <strong className="text-slate-200">{profile.id}</strong></span>
                <span>Currency: <strong className="text-emerald-400">USD ($)</strong></span>
                <span>Country: <strong className="text-slate-200">United Arab Emirates</strong></span>
              </div>
            </div>
          </div>

          {/* 4 Quick Stat Micro-Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold text-slate-400">Account Tier</div>
              <div className="text-xs font-black text-amber-400 mt-0.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                VIP Member
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold text-slate-400">Win Rate (Avg)</div>
              <div className="text-xs font-black text-emerald-400 mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                78.4%
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold text-slate-400">Security Rating</div>
              <div className="text-xs font-black text-sky-400 mt-0.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                {twoFactor ? 'High (2FA)' : 'Standard'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold text-slate-400">Member Since</div>
              <div className="text-xs font-black text-slate-200 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                2024
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-white/10 bg-[#0f1523]/80 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'profile', label: 'Personal Info' },
            { id: 'security', label: 'Security & 2FA' },
            { id: 'kyc', label: 'Verification (KYC)' },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`profile-tab-${tab.id}`}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`pb-3 px-2 text-xs font-extrabold tracking-wide uppercase transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Success Alert */}
        {successNotice && (
          <div className="mx-5 mt-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">
                  Trader Profile Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <span className="text-slate-400">Registered Name:</span>
                    <span className="font-bold text-slate-200">{profile.name}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <span className="text-slate-400">Account ID:</span>
                    <span className="font-mono font-bold text-slate-200">#{profile.id}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <span className="text-slate-400">Account Status:</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active & Compliant
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
                    <span className="text-slate-400">Withdrawal Limit:</span>
                    <span className="font-bold text-slate-200">Unlimited (Verified)</span>
                  </div>
                </div>
              </div>

              {/* Quotex Features checklist */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider mb-2.5">
                  Account Privileges & Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant Execution on Quotex Candlesticks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time Binance Spot WebSocket Feeds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free Demo Account Reloads ($10,000)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct Crypto & E-Wallet Cashier</span>
                  </div>
                </div>
              </div>

              {/* Logout & Exit Button */}
              {onLogout && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playLose();
                      onClose();
                      onLogout();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500/15 to-rose-600/10 hover:from-rose-500/25 hover:to-rose-600/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out & Return to Homepage</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERSONAL INFORMATION */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#141b2b] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#141b2b] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#141b2b] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                  Country of Residence
                </label>
                <input
                  type="text"
                  defaultValue="United Arab Emirates (UAE)"
                  disabled
                  className="w-full bg-[#101624] border border-slate-800 rounded-xl p-3 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                Save Profile Changes
              </button>
            </form>
          )}

          {/* TAB 3: SECURITY & 2FA */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    Two-Factor Authentication (2FA)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Protect withdrawals and logins with Google Authenticator or SMS codes
                  </div>
                </div>

                <button
                  id="profile-toggle-2fa-btn"
                  onClick={handleToggle2FA}
                  className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 ${
                    twoFactor
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {twoFactor ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-xs font-extrabold text-slate-200 mb-2.5">
                  Authorized Devices & Sessions
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 text-xs">
                    <div>
                      <div className="text-slate-100 font-bold">Chrome Browser (macOS) · Current</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">IP: 194.67.210.14 · Dubai, UAE</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ONLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VERIFICATION (KYC) */}
          {activeTab === 'kyc' && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-100">Verification Level</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Required for high-volume fiat & crypto withdrawals</div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black ${
                    kycStatus === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : kycStatus === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {kycStatus}
                </span>
              </div>

              {kycStatus !== 'VERIFIED' ? (
                <div
                  id="kyc-upload-box"
                  className="border-2 border-dashed border-slate-700/80 hover:border-amber-500/80 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white/5 hover:bg-white/10"
                  onClick={handleSimulateKycUpload}
                >
                  <Upload className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                  <div className="text-xs font-extrabold text-slate-200">
                    Upload National ID, Passport, or Driving License
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Drag and drop or browse files (PNG, JPG, PDF up to 10MB)
                  </div>
                  <button
                    type="button"
                    className="mt-3.5 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Select File
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3.5">
                  <ShieldCheck className="w-9 h-9 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-extrabold text-emerald-300 text-sm">Identity Successfully Verified</div>
                    <div className="text-slate-400 mt-1">
                      Your account has unlocked unrestricted real deposit, withdrawal, and trading capabilities.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
