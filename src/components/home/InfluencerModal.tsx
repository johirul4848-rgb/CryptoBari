import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  ArrowRight,
  User,
  Mail,
  Globe,
  Wallet,
  Lock,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import {
  influencerService,
  InfluencerProfile,
  InfluencerDepositLog,
  InfluencerWithdrawalRequest,
  generateInfluencerCardImage,
  generateShortPromoCode,
} from '../../services/influencerService';

interface InfluencerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'join' | 'login' | 'dashboard';
}

export const InfluencerModal: React.FC<InfluencerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'join',
}) => {
  const [activeTab, setActiveTab] = useState<'join' | 'login' | 'dashboard'>(initialTab);
  const [currentInfluencer, setCurrentInfluencer] = useState<InfluencerProfile | null>(() =>
    influencerService.getCurrentSession()
  );

  // Registration form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('🇧🇩 Bangladesh');
  const [binanceId, setBinanceId] = useState('');
  const [customPromo, setCustomPromo] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [createdProfile, setCreatedProfile] = useState<InfluencerProfile | null>(null);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  // Login form
  const [loginUserId, setLoginUserId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard state
  const [depositLogs, setDepositLogs] = useState<InfluencerDepositLog[]>([]);
  const [withdrawals, setWithdrawals] = useState<InfluencerWithdrawalRequest[]>([]);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(60);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  // Edit Binance Pay ID
  const [isEditingBinanceId, setIsEditingBinanceId] = useState(false);
  const [editBinanceIdValue, setEditBinanceIdValue] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Copied states
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const countries = [
    '🇧🇩 Bangladesh',
    '🇮🇳 India',
    '🇵🇰 Pakistan',
    '🇦🇪 United Arab Emirates',
    '🇸🇦 Saudi Arabia',
    '🇬🇧 United Kingdom',
    '🇺🇸 United States',
    '🇨🇦 Canada',
    '🇲🇾 Malaysia',
    '🇸🇬 Singapore',
    '🌍 International',
  ];

  useEffect(() => {
    const unsub = influencerService.subscribe(() => {
      const session = influencerService.getCurrentSession();
      setCurrentInfluencer(session);
      if (session) {
        setDepositLogs(influencerService.getDepositLogsForInfluencer(session.id));
        setWithdrawals(influencerService.getWithdrawalsForInfluencer(session.id));
      }
    });

    const session = influencerService.getCurrentSession();
    if (session) {
      setCurrentInfluencer(session);
      setDepositLogs(influencerService.getDepositLogsForInfluencer(session.id));
      setWithdrawals(influencerService.getWithdrawalsForInfluencer(session.id));
      if (initialTab === 'dashboard') {
        setActiveTab('dashboard');
      }
    } else if (initialTab === 'dashboard') {
      setActiveTab('login');
    }

    return () => {
      unsub();
    };
  }, [initialTab]);

  if (!isOpen) return null;

  // Handle Create Profile
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please provide a valid email address.');
      return;
    }
    if (!binanceId.trim()) {
      setFormError('Please enter your Binance Pay ID / UID.');
      return;
    }

    sound.playClick();
    const res = influencerService.registerInfluencer({
      name,
      country,
      email,
      binanceId,
      customPromoCode: customPromo.trim() || undefined,
    });

    if (res.success && res.influencer) {
      sound.playWin();
      setCreatedProfile(res.influencer);
      setCurrentInfluencer(res.influencer);
    } else {
      sound.playLose();
      setFormError(res.message);
    }
  };

  // Handle Download Pass Card
  const handleDownloadCard = () => {
    const target = createdProfile || currentInfluencer;
    if (!target) return;
    setIsDownloadingCard(true);
    sound.playClick();

    setTimeout(() => {
      try {
        const dataUrl = generateInfluencerCardImage(target);
        const link = document.createElement('a');
        link.download = `CryptoBari_Influencer_${target.userId}_Pass.jpg`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Failed to download card', err);
      } finally {
        setIsDownloadingCard(false);
      }
    }, 150);
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginUserId.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both your User ID and Password.');
      return;
    }

    sound.playClick();
    const res = influencerService.loginInfluencer(loginUserId, loginPassword);
    if (res.success && res.influencer) {
      sound.playWin();
      setCurrentInfluencer(res.influencer);
      setDepositLogs(influencerService.getDepositLogsForInfluencer(res.influencer.id));
      setWithdrawals(influencerService.getWithdrawalsForInfluencer(res.influencer.id));
      setActiveTab('dashboard');
    } else {
      sound.playLose();
      setLoginError(res.message);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sound.playClick();
    influencerService.logoutInfluencer();
    setCurrentInfluencer(null);
    setActiveTab('login');
  };

  // Handle Update Binance Pay ID
  const handleSaveBinanceId = () => {
    if (!currentInfluencer || !editBinanceIdValue.trim()) return;
    sound.playClick();
    const res = influencerService.updateBinanceId(currentInfluencer.id, editBinanceIdValue);
    if (res.success) {
      setIsEditingBinanceId(false);
      setEditSuccessMsg('Binance Pay ID updated successfully!');
      setTimeout(() => setEditSuccessMsg(null), 3000);
    }
  };

  // Handle Influencer Withdrawal Submission
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    if (!currentInfluencer) return;

    if (currentInfluencer.availableBalance < 60) {
      sound.playLose();
      setWithdrawError(`Minimum balance of $60.00 USD is required before submitting a payout request. Your current balance is $${currentInfluencer.availableBalance.toFixed(2)} USD.`);
      return;
    }

    if (withdrawAmount < 60) {
      sound.playLose();
      setWithdrawError('Minimum withdrawal amount is $60.00 USD.');
      return;
    }

    sound.playClick();
    const res = influencerService.requestInfluencerWithdrawal({
      influencerId: currentInfluencer.id,
      amount: withdrawAmount,
      binanceId: currentInfluencer.binanceId,
    });

    if (res.success) {
      sound.playWin();
      setWithdrawSuccess(res.message);
      setWithdrawAmount(60);
      setTimeout(() => {
        setIsWithdrawOpen(false);
        setWithdrawSuccess(null);
      }, 2500);
    } else {
      sound.playLose();
      setWithdrawError(res.message);
    }
  };

  return (
    <div
      id="influencer_program_modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden my-8">
        {/* Header Ribbon */}
        <div className="relative bg-gradient-to-r from-amber-600/30 via-slate-900 to-emerald-600/30 border-b border-white/10 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Influencer Promotion Program
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  20% Commission
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Earn 20% lifetime profit on every deposit generated through your code
              </p>
            </div>
          </div>

          <button
            id="close_influencer_modal_btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (If not showing created profile screen) */}
        {!createdProfile && (
          <div className="flex border-b border-white/10 bg-slate-950/60 px-6 pt-3 gap-2">
            <button
              id="tab_join_program"
              onClick={() => {
                sound.playClick();
                setActiveTab('join');
              }}
              className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2 ${
                activeTab === 'join'
                  ? 'bg-amber-500/20 text-amber-300 border-t-2 border-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Join Program (Create Profile)</span>
            </button>

            <button
              id="tab_access_portal"
              onClick={() => {
                sound.playClick();
                setActiveTab(currentInfluencer ? 'dashboard' : 'login');
              }}
              className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2 ${
                activeTab === 'login' || activeTab === 'dashboard'
                  ? 'bg-emerald-500/20 text-emerald-300 border-t-2 border-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>
                {currentInfluencer ? 'Influencer Portal Dashboard' : 'Access Influencer Portal'}
              </span>
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {/* SCREEN 1: REGISTRATION SUCCESS & DOWNLOAD CARD */}
          {createdProfile && (
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Welcome to CryptoBari Influencer Network!
                </h3>
                <p className="text-sm text-slate-300 max-w-lg mx-auto">
                  Your official influencer profile has been generated. Please download and save your
                  Credential Pass Card immediately to keep your login keys safe.
                </p>
              </div>

              {/* Generated Credentials Highlight Box */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-xs font-mono text-slate-400">YOUR USER ID</span>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold font-mono text-white">
                        {createdProfile.userId}
                      </span>
                      <button
                        onClick={() => {
                          sound.playClick();
                          navigator.clipboard.writeText(createdProfile.userId);
                          setCopiedUserId(true);
                          setTimeout(() => setCopiedUserId(false), 2000);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedUserId ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-xs font-mono text-slate-400">PASSWORD</span>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold font-mono text-emerald-400">
                        {createdProfile.password}
                      </span>
                      <button
                        onClick={() => {
                          sound.playClick();
                          navigator.clipboard.writeText(createdProfile.password);
                          setCopiedPassword(true);
                          setTimeout(() => setCopiedPassword(false), 2000);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedPassword ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-1">
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      PROMOTION CODE
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black font-mono text-amber-300">
                        {createdProfile.promoCode}
                      </span>
                      <button
                        onClick={() => {
                          sound.playClick();
                          navigator.clipboard.writeText(createdProfile.promoCode);
                          setCopiedPromo(true);
                          setTimeout(() => setCopiedPromo(false), 2000);
                        }}
                        className="text-amber-400 hover:text-white"
                      >
                        {copiedPromo ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10 text-xs text-slate-400">
                  <span>Binance Pay ID: {createdProfile.binanceId}</span>
                  <span className="text-emerald-400 font-semibold">
                    Commission: 20% on Every Deposit
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  id="download_pass_card_btn"
                  onClick={handleDownloadCard}
                  disabled={isDownloadingCard}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition transform active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  <span>
                    {isDownloadingCard ? 'Rendering Pass...' : 'Download Credentials Card (.jpg)'}
                  </span>
                </button>

                <button
                  id="enter_portal_btn"
                  onClick={() => {
                    sound.playClick();
                    setCreatedProfile(null);
                    setActiveTab('dashboard');
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold flex items-center justify-center space-x-2 border border-white/15 transition"
                >
                  <span>Enter Influencer Portal</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: JOIN PROGRAM (CREATE INFLUENCER PROFILE) */}
          {!createdProfile && activeTab === 'join' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white">Register as an Influencer</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Provide your details to auto-generate your verified promotion code & portal keys.
                  </p>
                </div>

                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name / Channel Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (!customPromo) {
                            setCustomPromo(generateShortPromoCode(e.target.value));
                          }
                        }}
                        placeholder="e.g. Tanvir Trading / Tanvir Hossain"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Country / Region
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400"
                        >
                          {countries.map((c) => (
                            <option key={c} value={c} className="bg-slate-900 text-white">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="influencer@gmail.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Binance Pay ID / UID (For 20% Payouts)
                      </label>
                      <span className="text-[11px] text-amber-400">Can be edited anytime</span>
                    </div>
                    <div className="relative">
                      <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={binanceId}
                        onChange={(e) => setBinanceId(e.target.value)}
                        placeholder="e.g. 794380283 or Binance Pay UID"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Preferred Promotion Code (Short & Memorable)
                    </label>
                    <input
                      type="text"
                      value={customPromo}
                      onChange={(e) => setCustomPromo(e.target.value.toUpperCase())}
                      placeholder="e.g. WIN99, VIP77"
                      maxLength={8}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-amber-300 font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-amber-400 uppercase"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Short uppercase code (4-8 chars). Auto-generated if left default.
                    </span>
                  </div>

                  <button
                    type="submit"
                    id="submit_influencer_register_btn"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition transform active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Official Influencer Pass & Keys</span>
                  </button>
                </form>
              </div>

              {/* Commission Program Rules & Perks Card */}
              <div className="lg:col-span-5 space-y-4 bg-slate-950/70 p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                    <TrendingUp className="w-5 h-5" />
                    <span>Influencer Reward Structure</span>
                  </div>

                  {/* 20% Net Commission Feature */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <span className="text-xs font-bold text-amber-300">
                      💰 20% Commission on Every Deposit
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Whenever a trader deposits using your code, 20% of the deposit amount is
                      instantly credited to your withdrawable balance (e.g. $100 deposit = $20 to you).
                    </p>
                  </div>

                  {/* Deposit Bonus Tiers for Traders */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Trader Promotional Bonuses:
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-slate-300 font-mono">$30 - $49 Deposit:</span>
                        <span className="font-bold text-emerald-400">+30% Live Bonus</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-slate-300 font-mono">$50 - $69 Deposit:</span>
                        <span className="font-bold text-emerald-400">+40% Live Bonus</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-slate-300 font-mono">$70 - $100+ Deposit:</span>
                        <span className="font-bold text-amber-400">+60% Live Bonus</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-[11px] text-slate-400 space-y-1">
                    <p>
                      • Minimum deposit required to unlock promo bonus is <strong>$30 USD</strong>.
                    </p>
                    <p>• Promotional bonus is added to live balance for trading leverage.</p>
                    <p>• Bonus is forfeited upon trader withdrawal to protect capital.</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 text-center">
                  <span className="text-xs text-slate-400">Already have an influencer account? </span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('login');
                    }}
                    className="text-xs text-amber-400 hover:underline font-bold"
                  >
                    Login here
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 3: ACCESS INFLUENCER PORTAL (LOGIN) */}
          {!createdProfile && activeTab === 'login' && (
            <div className="max-w-md mx-auto space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Influencer Portal Login</h3>
                <p className="text-xs text-slate-400">
                  Enter your short User ID and Password to view stats and request commission payouts.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={loginUserId}
                    onChange={(e) => setLoginUserId(e.target.value.toUpperCase())}
                    placeholder="e.g. INF-2048"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-400 font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  id="submit_influencer_login_btn"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Portal</span>
                </button>
              </form>

              <div className="pt-4 border-t border-white/10 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  Need a promotion code?{' '}
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('join');
                    }}
                    className="text-amber-400 hover:underline font-bold"
                  >
                    Create Influencer Profile
                  </button>
                </p>
                <p className="text-[11px] text-slate-500">
                  Demo account: User ID <code>INF-2048</code> | Password <code>VIP7782</code>
                </p>
              </div>
            </div>
          )}

          {/* SCREEN 4: INFLUENCER PORTAL DASHBOARD */}
          {!createdProfile && activeTab === 'dashboard' && currentInfluencer && (
            <div className="space-y-6">
              {/* Profile Bar */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">{currentInfluencer.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-xs font-mono">
                      {currentInfluencer.userId}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      {currentInfluencer.country}
                    </span>
                  </div>

                  {/* Binance Pay ID display with edit */}
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span>Binance Pay ID:</span>
                    {isEditingBinanceId ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={editBinanceIdValue}
                          onChange={(e) => setEditBinanceIdValue(e.target.value)}
                          placeholder="New Binance ID"
                          className="px-2 py-0.5 rounded bg-slate-900 border border-amber-400 text-white font-mono text-xs focus:outline-none"
                        />
                        <button
                          onClick={handleSaveBinanceId}
                          className="px-2 py-0.5 rounded bg-emerald-500 text-black font-bold text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingBinanceId(false)}
                          className="px-2 py-0.5 rounded bg-white/10 text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 font-mono text-white font-bold">
                        <span>{currentInfluencer.binanceId}</span>
                        <button
                          onClick={() => {
                            sound.playClick();
                            setEditBinanceIdValue(currentInfluencer.binanceId);
                            setIsEditingBinanceId(true);
                          }}
                          className="text-amber-400 hover:text-amber-300 p-1"
                          title="Edit Binance Pay ID"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {editSuccessMsg && (
                    <span className="text-[11px] text-emerald-400">{editSuccessMsg}</span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownloadCard}
                    disabled={isDownloadingCard}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center space-x-1.5 border border-white/10 transition"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Download Pass (.jpg)</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center space-x-1.5 border border-rose-500/20 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>

              {/* Promo Code & Link Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase">
                    YOUR ACTIVE PROMOTION CODE
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-wider">
                    {currentInfluencer.promoCode}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="copy_influencer_promo_btn"
                    onClick={() => {
                      sound.playClick();
                      navigator.clipboard.writeText(currentInfluencer.promoCode);
                      setCopiedPromo(true);
                      setTimeout(() => setCopiedPromo(false), 2000);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center space-x-1.5 shadow-md transition"
                  >
                    {copiedPromo ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPromo ? 'Code Copied!' : 'Copy Promo Code'}</span>
                  </button>

                  <button
                    id="copy_influencer_link_btn"
                    onClick={() => {
                      sound.playClick();
                      const url = `https://cryptobari.com?promo=${currentInfluencer.promoCode}`;
                      navigator.clipboard.writeText(url);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center space-x-1.5 border border-white/15 transition"
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
                  </button>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {/* Available Balance */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Available Balance</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                    ${currentInfluencer.availableBalance.toFixed(2)}
                  </div>
                  {currentInfluencer.availableBalance < 60 && (
                    <div className="text-[10px] text-amber-400/90 font-mono">
                      Min $60.00 required (${(60 - currentInfluencer.availableBalance).toFixed(2)} needed)
                    </div>
                  )}
                  <button
                    id="open_influencer_withdraw_btn"
                    onClick={() => {
                      sound.playClick();
                      setIsWithdrawOpen(true);
                      setWithdrawAmount(Math.max(60, currentInfluencer.availableBalance));
                    }}
                    disabled={currentInfluencer.availableBalance < 60}
                    className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentInfluencer.availableBalance >= 60 ? 'Request Payout ($60+)' : 'Min $60 Balance Required'}
                  </button>
                </div>

                {/* Total 20% Earned */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Total 20% Earned</span>
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                    ${currentInfluencer.totalEarned.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-500 block">Lifetime earnings</span>
                </div>

                {/* Total Deposit Volume */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Deposit Volume</span>
                    <Wallet className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                    ${currentInfluencer.totalVolumeGenerated.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-500 block">Referred deposits</span>
                </div>

                {/* Total Withdrawn */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Total Dispatched</span>
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                    ${currentInfluencer.totalWithdrawn.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-500 block">Binance Pay Payouts</span>
                </div>
              </div>

              {/* WITHDRAWAL MODAL / POPUP */}
              {isWithdrawOpen && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-950 to-black border border-emerald-500/40 space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <Wallet className="w-5 h-5" />
                      <span>Request Influencer Commission Payout</span>
                    </div>
                    <button
                      onClick={() => setIsWithdrawOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {withdrawError && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{withdrawError}</span>
                    </div>
                  )}

                  {withdrawSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{withdrawSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Payout Amount ($ USD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="60"
                          max={currentInfluencer.availableBalance}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                          required
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                          Min: $60.00 • Available: ${currentInfluencer.availableBalance.toFixed(2)}
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Target Binance Pay ID
                        </label>
                        <input
                          type="text"
                          value={currentInfluencer.binanceId}
                          disabled
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-400 font-mono text-sm"
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Sent directly to your saved Binance Pay UID
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsWithdrawOpen(false)}
                        className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        id="submit_influencer_payout_btn"
                        className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-md transition"
                      >
                        Submit Payout Request
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* History Tabs: Deposit History & Payout Requests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Recent Deposits from your Promotion Code</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {depositLogs.length} deposits recorded
                  </span>
                </div>

                {depositLogs.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                    <p className="text-sm text-slate-400">
                      No deposits made with your promo code yet.
                    </p>
                    <p className="text-xs text-slate-500">
                      Share your code <code>{currentInfluencer.promoCode}</code> with your audience
                      to start earning 20% on every deposit!
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-mono border-b border-white/10">
                        <tr>
                          <th className="p-3">DATE</th>
                          <th className="p-3">TRADER</th>
                          <th className="p-3">DEPOSIT</th>
                          <th className="p-3">BONUS</th>
                          <th className="p-3 text-emerald-400 font-bold">YOUR 20% COMMISSION</th>
                          <th className="p-3">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-slate-900/60">
                        {depositLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition">
                            <td className="p-3 font-mono text-slate-400">
                              {new Date(log.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="p-3 text-white font-medium">{log.traderName}</td>
                            <td className="p-3 font-mono text-white">
                              ${log.depositAmount.toFixed(2)}
                            </td>
                            <td className="p-3 text-amber-300 font-mono">
                              +{log.bonusPercent}% (+${log.bonusAmount.toFixed(2)})
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-400">
                              +${log.influencerCommission.toFixed(2)} USD
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payout Requests Section */}
              {withdrawals.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>Your Payout Requests</span>
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-mono border-b border-white/10">
                        <tr>
                          <th className="p-3">ID</th>
                          <th className="p-3">DATE</th>
                          <th className="p-3">AMOUNT</th>
                          <th className="p-3">BINANCE PAY ID</th>
                          <th className="p-3">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-slate-900/60">
                        {withdrawals.map((w) => (
                          <tr key={w.id} className="hover:bg-white/5 transition">
                            <td className="p-3 font-mono text-slate-400">{w.id}</td>
                            <td className="p-3 font-mono text-slate-400">
                              {new Date(w.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="p-3 font-mono font-bold text-white">
                              ${w.amount.toFixed(2)}
                            </td>
                            <td className="p-3 font-mono text-slate-300">{w.binanceId}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  w.status === 'APPROVED'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : w.status === 'REJECTED'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {w.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
