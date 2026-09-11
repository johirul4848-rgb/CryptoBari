import React, { useState, useEffect } from 'react';
import {
  Users,
  Gift,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  DollarSign,
  QrCode,
  Award,
  Zap,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { sound } from '../../utils/audio';

export interface ReferredUser {
  id: string;
  name: string;
  joinedDate: string;
  totalTrades: number;
  totalVolume: number;
  commissionGenerated: number;
  status: 'Active' | 'Inactive';
  lastActivity: string;
}

export interface CommissionLog {
  id: string;
  timestamp: number;
  type: 'ACTIVATION_BONUS' | 'TRADE_LOSS_COMMISSION' | 'TRADE_WIN_DEDUCTION' | 'CONVERT_TO_LIVE';
  amount: number;
  description: string;
  traderName?: string;
}

interface ReferralPageProps {
  liveBalance: number;
  userName: string;
  userEmail: string;
  onBackToTrade?: () => void;
  onConvertToLive: (amount: number) => void;
}

const STORAGE_KEY_REFERRAL_DATA = 'cb_referral_system_v1';
const MIN_CONVERT_THRESHOLD = 50.0;

export const ReferralPage: React.FC<ReferralPageProps> = ({
  liveBalance,
  userName,
  userEmail,
  onBackToTrade,
  onConvertToLive,
}) => {
  // 1. Auto-generated Referral ID for this user (derived or generated & persisted without dashes, e.g. CB67022)
  const [myReferralCode, setMyReferralCode] = useState<string>(() => {
    const saved = localStorage.getItem('cb_my_referral_id');
    if (saved) {
      const clean = saved.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (clean !== saved) {
        localStorage.setItem('cb_my_referral_id', clean);
      }
      return clean;
    }
    const generated = `CB${Math.floor(10000 + Math.random() * 90000)}`;
    localStorage.setItem('cb_my_referral_id', generated);
    return generated;
  });

  // 2. Referral state (commission balance, activated sponsor code, referrals list, logs)
  const [commissionBalance, setCommissionBalance] = useState<number>(0.0);
  const [totalEarned, setTotalEarned] = useState<number>(0.0);
  const [convertedTotal, setConvertedTotal] = useState<number>(0.0);
  const [activatedSponsorCode, setActivatedSponsorCode] = useState<string | null>(null);
  const [sponsorInput, setSponsorInput] = useState<string>('');
  const [sponsorError, setSponsorError] = useState<string>('');
  const [sponsorSuccess, setSponsorSuccess] = useState<string>('');

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [convertSuccessMsg, setConvertSuccessMsg] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Seeded default referred users if not yet initialized
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([
    {
      id: 'ref-1',
      name: 'trader_hasan99',
      joinedDate: '2026-08-28',
      totalTrades: 42,
      totalVolume: 520,
      commissionGenerated: 18.5,
      status: 'Active',
      lastActivity: '12 mins ago',
    },
    {
      id: 'ref-2',
      name: 'crypto_kamrul',
      joinedDate: '2026-09-02',
      totalTrades: 31,
      totalVolume: 390,
      commissionGenerated: 14.2,
      status: 'Active',
      lastActivity: '45 mins ago',
    },
    {
      id: 'ref-3',
      name: 'tanvir_scalper',
      joinedDate: '2026-09-05',
      totalTrades: 19,
      totalVolume: 240,
      commissionGenerated: 9.8,
      status: 'Active',
      lastActivity: '3 hours ago',
    },
  ]);

  const [commissionLogs, setCommissionLogs] = useState<CommissionLog[]>([
    {
      id: 'log-1',
      timestamp: Date.now() - 1000 * 60 * 12,
      type: 'TRADE_LOSS_COMMISSION',
      amount: 4.0,
      description: '+$4.00 commission (20% of $20 trade loss by trader_hasan99)',
      traderName: 'trader_hasan99',
    },
    {
      id: 'log-2',
      timestamp: Date.now() - 1000 * 60 * 45,
      type: 'TRADE_LOSS_COMMISSION',
      amount: 2.0,
      description: '+$2.00 commission (20% of $10 trade loss by crypto_kamrul)',
      traderName: 'crypto_kamrul',
    },
    {
      id: 'log-3',
      timestamp: Date.now() - 1000 * 60 * 180,
      type: 'TRADE_WIN_DEDUCTION',
      amount: -1.6,
      description: '-$1.60 offset (20% of $8 profit win by tanvir_scalper)',
      traderName: 'tanvir_scalper',
    },
  ]);

  // Load persisted referral state
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY_REFERRAL_DATA);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (typeof parsed.commissionBalance === 'number') setCommissionBalance(parsed.commissionBalance);
        if (typeof parsed.totalEarned === 'number') setTotalEarned(parsed.totalEarned);
        if (typeof parsed.convertedTotal === 'number') setConvertedTotal(parsed.convertedTotal);
        if (parsed.activatedSponsorCode) setActivatedSponsorCode(parsed.activatedSponsorCode);
        if (Array.isArray(parsed.referredUsers) && parsed.referredUsers.length > 0) {
          setReferredUsers(parsed.referredUsers);
        }
        if (Array.isArray(parsed.commissionLogs)) {
          setCommissionLogs(parsed.commissionLogs);
        }
      } else {
        // Initial setup: initial total earned calculation from seeded referrals
        const initialBalance = 18.5 + 14.2 + 9.8; // $42.50
        setCommissionBalance(initialBalance);
        setTotalEarned(initialBalance);
      }
    } catch (e) {
      console.error('Failed to load referral data', e);
    }
  }, []);

  // Save state helper
  const saveState = (
    bal: number,
    tot: number,
    conv: number,
    sponsor: string | null,
    users: ReferredUser[],
    logs: CommissionLog[]
  ) => {
    try {
      localStorage.setItem(
        STORAGE_KEY_REFERRAL_DATA,
        JSON.stringify({
          commissionBalance: bal,
          totalEarned: tot,
          convertedTotal: conv,
          activatedSponsorCode: sponsor,
          referredUsers: users,
          commissionLogs: logs,
        })
      );
    } catch (e) {
      console.warn('Failed to save referral data', e);
    }
  };

  // Copy referral code handler
  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(myReferralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy referral link handler
  const handleCopyLink = () => {
    sound.playClick();
    const link = `https://cryptobari.com/register?ref=${myReferralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Activate Sponsor Referral Code (One-time only)
  const handleActivateSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    setSponsorError('');
    setSponsorSuccess('');

    if (activatedSponsorCode) {
      setSponsorError(`You have already activated sponsor code: ${activatedSponsorCode}. Only 1 code can be activated per account.`);
      return;
    }

    const code = sponsorInput.trim().toUpperCase();
    if (!code) {
      setSponsorError('Please enter a valid Referral Code.');
      return;
    }

    if (code === myReferralCode.toUpperCase()) {
      setSponsorError('You cannot activate your own Referral Code.');
      return;
    }

    if (code.length < 4) {
      setSponsorError('Invalid Referral Code format. Must be at least 4 characters.');
      return;
    }

    // Award instant $10 bonus to referral commission balance!
    sound.playWin();
    const bonusAmount = 10.0;
    const newBal = Number((commissionBalance + bonusAmount).toFixed(2));
    const newTot = Number((totalEarned + bonusAmount).toFixed(2));
    const newLog: CommissionLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      type: 'ACTIVATION_BONUS',
      amount: bonusAmount,
      description: `+$10.00 Instant Welcome Bonus for activating sponsor code ${code}`,
      traderName: code,
    };
    const updatedLogs = [newLog, ...commissionLogs];

    setCommissionBalance(newBal);
    setTotalEarned(newTot);
    setActivatedSponsorCode(code);
    setSponsorSuccess(`🎉 Referral Code ${code} activated successfully! $10.00 bonus has been instantly added to your Referral Commission.`);
    setSponsorInput('');

    saveState(newBal, newTot, convertedTotal, code, referredUsers, updatedLogs);
  };

  // Convert to Live Balance (Min $50 required)
  const handleConvertCommission = () => {
    if (commissionBalance < MIN_CONVERT_THRESHOLD) {
      sound.playLose();
      return;
    }

    setIsConverting(true);
    sound.playWin();

    const transferAmount = commissionBalance;
    const newBal = 0.0;
    const newConv = Number((convertedTotal + transferAmount).toFixed(2));
    const newLog: CommissionLog = {
      id: `log-conv-${Date.now()}`,
      timestamp: Date.now(),
      type: 'CONVERT_TO_LIVE',
      amount: -transferAmount,
      description: `Sent $${transferAmount.toFixed(2)} to Live Real Balance (Transferred successfully)`,
    };
    const updatedLogs = [newLog, ...commissionLogs];

    setTimeout(() => {
      setCommissionBalance(newBal);
      setConvertedTotal(newConv);
      setCommissionLogs(updatedLogs);
      onConvertToLive(transferAmount);
      setIsConverting(false);
      setConvertSuccessMsg(`✅ Successfully transferred $${transferAmount.toFixed(2)} to your Live Real Balance!`);
      saveState(newBal, totalEarned, newConv, activatedSponsorCode, referredUsers, updatedLogs);

      setTimeout(() => setConvertSuccessMsg(''), 6000);
    }, 600);
  };

  // Simulation helpers for testing the 20% Loss & Win calculation
  const handleSimulateTradeLoss = () => {
    sound.playWin();
    const tradeInvestment = 20.0;
    const commissionDelta = Number((tradeInvestment * 0.20).toFixed(2)); // +$4.00 (20%)
    const newBal = Number((commissionBalance + commissionDelta).toFixed(2));
    const newTot = Number((totalEarned + commissionDelta).toFixed(2));

    const updatedUsers = referredUsers.map((u, i) =>
      i === 0
        ? {
            ...u,
            totalTrades: u.totalTrades + 1,
            totalVolume: u.totalVolume + tradeInvestment,
            commissionGenerated: Number((u.commissionGenerated + commissionDelta).toFixed(2)),
            lastActivity: 'Just now',
          }
        : u
    );

    const newLog: CommissionLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      type: 'TRADE_LOSS_COMMISSION',
      amount: commissionDelta,
      description: `+$${commissionDelta.toFixed(2)} commission (20% of $${tradeInvestment} trade loss by ${referredUsers[0].name})`,
      traderName: referredUsers[0].name,
    };
    const updatedLogs = [newLog, ...commissionLogs];

    setCommissionBalance(newBal);
    setTotalEarned(newTot);
    setReferredUsers(updatedUsers);
    setCommissionLogs(updatedLogs);
    saveState(newBal, newTot, convertedTotal, activatedSponsorCode, updatedUsers, updatedLogs);
  };

  const handleSimulateTradeWin = () => {
    sound.playClick();
    const tradeProfit = 15.0;
    const deductAmount = Number((tradeProfit * 0.20).toFixed(2)); // -$3.00 (20%)
    const newBal = Math.max(0, Number((commissionBalance - deductAmount).toFixed(2)));

    const updatedUsers = referredUsers.map((u, i) =>
      i === 0
        ? {
            ...u,
            totalTrades: u.totalTrades + 1,
            totalVolume: u.totalVolume + tradeProfit,
            lastActivity: 'Just now',
          }
        : u
    );

    const newLog: CommissionLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      type: 'TRADE_WIN_DEDUCTION',
      amount: -deductAmount,
      description: `-$${deductAmount.toFixed(2)} commission offset (20% of $${tradeProfit} trade win profit by ${referredUsers[0].name})`,
      traderName: referredUsers[0].name,
    };
    const updatedLogs = [newLog, ...commissionLogs];

    setCommissionBalance(newBal);
    setReferredUsers(updatedUsers);
    setCommissionLogs(updatedLogs);
    saveState(newBal, totalEarned, convertedTotal, activatedSponsorCode, updatedUsers, updatedLogs);
  };

  const progressPercent = Math.min(100, Math.round((commissionBalance / MIN_CONVERT_THRESHOLD) * 100));
  const canConvert = commissionBalance >= MIN_CONVERT_THRESHOLD;

  return (
    <div className="flex-1 overflow-y-auto bg-[#080d1a] text-slate-100 p-3 sm:p-6 md:p-8 select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#12192c] via-[#17223b] to-[#0f172a] border border-amber-500/30 p-4 sm:p-6 md:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] font-black border border-amber-500/40 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Official 20% Referral Program
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-black border border-emerald-500/40">
                  Instant $10 Bonus
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                Referral Partner Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                Invite fellow traders to CryptoBari. Earn an automatic{' '}
                <strong className="text-emerald-400 font-bold">20% commission</strong> on their trade losses,
                and convert your commission directly to your real Live Trading Balance once you reach $50!
              </p>
            </div>

            {onBackToTrade && (
              <button
                id="referral-back-to-trade-btn"
                onClick={() => {
                  sound.playClick();
                  onBackToTrade();
                }}
                className="self-start md:self-center px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-2 shadow-sm shrink-0"
              >
                <span>Back to Trading Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Success Alert for Conversion */}
        {convertSuccessMsg && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{convertSuccessMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROW 1: COMMISSION BALANCE & CONVERSION (MIN $50) + YOUR REFERRAL ID       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Commission Balance & 1-Click Convert to Live Balance (Spans 2 cols) */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-b from-[#131b2e] to-[#0d1424] border border-slate-700/80 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
                    <DollarSign className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                      Referral Commission Balance
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      Real-time withdrawable commission
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${
                    canConvert
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                      : 'bg-amber-500/15 text-amber-300 border-amber-400/30'
                  }`}
                >
                  {canConvert ? 'READY TO CONVERT' : `NEED $${(MIN_CONVERT_THRESHOLD - commissionBalance).toFixed(2)} MORE`}
                </span>
              </div>

              {/* Big Vibrant Balance */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]">
                  ${commissionBalance.toFixed(2)}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-400 font-mono">USD</span>
              </div>

              {/* Progress Bar towards $50.00 Conversion */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">
                    Progress to Live Conversion (Min $50.00)
                  </span>
                  <span className="text-amber-400 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      canConvert
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>$0.00</span>
                  <span>Target: $50.00 USD</span>
                </div>
              </div>
            </div>

            {/* Action Bar: Convert Button */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Converted funds are credited instantly into your <strong>Live Trading Balance</strong>.
                </span>
              </div>

              <button
                id="referral-convert-live-btn"
                disabled={!canConvert || isConverting}
                onClick={handleConvertCommission}
                className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                  canConvert
                    ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-[0_6px_20px_rgba(16,185,129,0.4)] active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                }`}
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Converting to Live Balance...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 stroke-[2.5]" />
                    <span>Send ${commissionBalance.toFixed(2)} to Live Balance</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Your Auto-Generated Referral ID & 1-Click Share Card */}
          <div className="rounded-2xl bg-gradient-to-b from-[#161f34] to-[#0f172a] border border-amber-500/30 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                  <Award className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                    Your Auto Referral ID
                  </h3>
                  <span className="text-[10px] text-slate-400">Permanently assigned to your account</span>
                </div>
              </div>

              {/* Big Display of Auto-Generated Referral ID */}
              <div className="p-3.5 rounded-xl bg-[#0b101c] border border-amber-500/40 shadow-inner flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Unique Referral Code</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-amber-300 tracking-wider">
                    {myReferralCode}
                  </span>
                </div>

                <button
                  id="referral-copy-code-btn"
                  onClick={handleCopyCode}
                  className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                  title="Copy Referral ID"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Share link input */}
              <div className="mt-3">
                <span className="text-[10px] text-slate-400 font-mono block mb-1">Invitation Link</span>
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0b101c] border border-slate-800 text-[11px] font-mono text-slate-300">
                  <span className="truncate flex-1 pl-1">
                    https://cryptobari.com/register?ref={myReferralCode}
                  </span>
                  <button
                    id="referral-copy-link-btn"
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[10px] font-bold cursor-pointer transition-colors shrink-0"
                  >
                    {copiedLink ? 'Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-[#0d1322]">
                <span className="text-[10px] text-slate-400 block">Total Referrals</span>
                <span className="text-sm font-black text-white">{referredUsers.length} Traders</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0d1322]">
                <span className="text-[10px] text-slate-400 block">Total Converted</span>
                <span className="text-sm font-black text-emerald-400">${convertedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW 2: ACTIVATE SPONSOR REFERRAL CODE ($10 BONUS) + HOW IT WORKS          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card: Activate Someone Else's Referral Code (One-time only & $10 bonus) */}
          <div className="rounded-2xl bg-gradient-to-b from-[#131b2e] to-[#0c1220] border border-slate-700/80 p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-sm">
                  <Gift className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                    Activate Sponsor Referral Code
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Get an instant <strong>$10.00</strong> bonus added to your commission
                  </span>
                </div>
              </div>

              {activatedSponsorCode ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Code Fixed
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                  1-Time Use
                </span>
              )}
            </div>

            {activatedSponsorCode ? (
              // Already Activated State (Fixed & permanent)
              <div className="p-4 rounded-xl bg-[#090e1a] border border-emerald-500/40 mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">Active Sponsor Code:</span>
                  <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {activatedSponsorCode}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  ✓ Your account is permanently locked to this sponsor. As per official rules, referral codes can only be activated once and cannot be altered.
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>$10.00 Welcome Bonus has been credited to your commission balance!</span>
                </div>
              </div>
            ) : (
              // Active Input Form
              <form onSubmit={handleActivateSponsor} className="mt-3 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 mb-1.5 block">
                    Enter Friend's / Sponsor's Referral Code
                  </label>
                  <div className="flex flex-col gap-2.5">
                    <input
                      id="referral-sponsor-input"
                      type="text"
                      value={sponsorInput}
                      onChange={(e) => {
                        setSponsorInput(e.target.value.toUpperCase().replace(/[^A-Za-z0-9]/g, ''));
                        setSponsorError('');
                      }}
                      placeholder="e.g. CB67022, CB99201"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b101c] border border-slate-700 focus:border-amber-400 text-white font-mono font-bold text-sm tracking-wider uppercase placeholder:text-slate-600 focus:outline-none transition-colors"
                    />
                    <button
                      id="referral-activate-submit-btn"
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-98 text-slate-950 font-black text-xs sm:text-sm cursor-pointer transition-all shadow-[0_4px_16px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2"
                    >
                      <Gift className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                      <span>Activate & Claim $10 Bonus</span>
                    </button>
                  </div>
                </div>

                {sponsorError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{sponsorError}</span>
                  </div>
                )}

                {sponsorSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{sponsorSuccess}</span>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-[#0b101c]/80 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                  💡 <strong>Important Policy:</strong> You can only bind and activate ONE referral code per account. Once submitted, it is permanently fixed and cannot be replaced or transferred.
                </div>
              </form>
            )}
          </div>

          {/* Card: 20% Referral Commission Rules (Explicitly as requested) */}
          <div className="rounded-2xl bg-gradient-to-b from-[#131b2e] to-[#0c1220] border border-slate-700/80 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                    How 20% Commission Works
                  </h3>
                  <span className="text-[10px] text-slate-400">Fully transparent broker partnership</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="p-2.5 rounded-xl bg-[#090e1a] border border-slate-800 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-white">Trader Loss → You Get +20% Commission</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      When a referred trader loses a $10 trade, you automatically receive <strong>+$2.00 (20%)</strong> credited directly into your commission balance.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#090e1a] border border-slate-800 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-white">Trader Win → 20% Pool Deduction</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      When a referred trader wins a trade profit, 20% of the profit is deducted from your commission balance (cannot drop below $0.00).
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#090e1a] border border-slate-800 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-white">$50 Minimum Transfer Threshold</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Once your accumulated commission reaches $50.00, hit "Send to Live Balance" to convert it into real funds for live trading or withdrawal!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Simulation Controls */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono">Test Simulator:</span>
              <div className="flex gap-2">
                <button
                  id="referral-simulate-loss-btn"
                  onClick={handleSimulateTradeLoss}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-[10px] transition-colors border border-emerald-500/40 cursor-pointer"
                  title="Simulate $20 loss trade by referred trader (+20% = +$4.00 commission)"
                >
                  + Simulate $20 Loss (+20%)
                </button>
                <button
                  id="referral-simulate-win-btn"
                  onClick={handleSimulateTradeWin}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-[10px] transition-colors border border-rose-500/40 cursor-pointer"
                  title="Simulate $15 win profit by referred trader (-20% = -$3.00 deduction)"
                >
                  - Simulate $15 Win (-20%)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW 3: REFERRED USERS LIST TABLE                                         */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-gradient-to-b from-[#131b2e] to-[#0c1220] border border-slate-700/80 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-sm">
                <Users className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider">
                  Referred Traders Network ({referredUsers.length})
                </h3>
                <span className="text-[10px] text-slate-400">Traders registered using your Referral Code</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">Total Commission Generated:</span>
              <span className="text-xs font-black font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                +${referredUsers.reduce((sum, u) => sum + u.commissionGenerated, 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
                  <th className="py-2.5 px-3">Trader UID / Username</th>
                  <th className="py-2.5 px-3">Join Date</th>
                  <th className="py-2.5 px-3">Total Trades</th>
                  <th className="py-2.5 px-3">Trade Volume</th>
                  <th className="py-2.5 px-3">Net Commission</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {referredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-2 font-sans">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-amber-400 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">{user.joinedDate}</td>
                    <td className="py-3 px-3 text-slate-300">{user.totalTrades} Trades</td>
                    <td className="py-3 px-3 text-slate-300">${user.totalVolume.toFixed(2)}</td>
                    <td className="py-3 px-3 text-emerald-400 font-black">
                      +${user.commissionGenerated.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW 4: RECENT COMMISSION ACTIVITY LOGS                                   */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-gradient-to-b from-[#131b2e] to-[#0c1220] border border-slate-700/80 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-sm">
                <Clock className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider">
                  Live Referral Transaction History
                </h3>
                <span className="text-[10px] text-slate-400">Automatic credit & deduction log</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {commissionLogs.slice(0, 6).map((log) => {
              const isPositive = log.amount > 0;
              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#090e1a] border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        log.type === 'ACTIVATION_BONUS'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : log.type === 'CONVERT_TO_LIVE'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : isPositive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {log.type === 'ACTIVATION_BONUS' ? (
                        <Gift className="w-3.5 h-3.5" />
                      ) : log.type === 'CONVERT_TO_LIVE' ? (
                        <Zap className="w-3.5 h-3.5" />
                      ) : isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">{log.description}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`font-mono font-black text-sm shrink-0 ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? `+$${log.amount.toFixed(2)}` : `-$${Math.abs(log.amount).toFixed(2)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
