import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowDownLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  Wallet,
  Sparkles,
  Zap,
  Check,
  Building2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { recordWithdrawalToFirebase } from '../../services/firebaseRequests';
import { TransactionWaitConfirmationModal, ConfirmationModalData } from './TransactionWaitConfirmationModal';

interface WithdrawalPageProps {
  onBack: () => void;
  onWithdrawSuccess: (amount: number, method: string, address: string) => void;
  liveBalance: number;
  userEmail?: string;
  userName?: string;
}

export const WithdrawalPage: React.FC<WithdrawalPageProps> = ({
  onBack,
  onWithdrawSuccess,
  liveBalance = 0,
  userEmail = 'johirul4848@gmail.com',
  userName = 'Johirul Islam',
}) => {
  const [receiverBinanceId, setReceiverBinanceId] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(() =>
    Math.max(10, Math.min(50, liveBalance))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submittedWithdrawal, setSubmittedWithdrawal] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pastWithdrawals, setPastWithdrawals] = useState<any[]>([]);
  const [confirmationModalData, setConfirmationModalData] = useState<ConfirmationModalData | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const MIN_WITHDRAWAL = 10.0;
  const isBalanceEligible = liveBalance >= MIN_WITHDRAWAL;

  useEffect(() => {
    // Fetch past withdrawals
    const fetchWithdrawals = () => {
      fetch('/api/admin/withdrawals')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPastWithdrawals(data.slice(0, 8));
          }
        })
        .catch(() => {});
    };

    fetchWithdrawals();
    window.addEventListener('cb_withdrawals_updated', fetchWithdrawals);
    return () => window.removeEventListener('cb_withdrawals_updated', fetchWithdrawals);
  }, []);

  const handleSetPercent = (pct: number) => {
    sound.playClick();
    if (liveBalance <= 0) return;
    const calculated = parseFloat((liveBalance * pct).toFixed(2));
    setWithdrawAmount(Math.max(0, calculated));
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isBalanceEligible) {
      setErrorMsg(
        `Insufficient account balance! Your live balance is $${liveBalance.toFixed(
          2
        )} USD. You need at least $${MIN_WITHDRAWAL.toFixed(2)} USD in your live account to request a payout.`
      );
      return;
    }

    if (withdrawAmount < MIN_WITHDRAWAL) {
      setErrorMsg(
        `Minimum withdrawal limit is $${MIN_WITHDRAWAL.toFixed(
          2
        )} USD. Please increase your withdrawal amount.`
      );
      return;
    }

    if (withdrawAmount > liveBalance) {
      setErrorMsg(
        `You cannot withdraw more than your available live balance ($${liveBalance.toFixed(2)} USD).`
      );
      return;
    }

    if (!receiverBinanceId.trim()) {
      setErrorMsg('Please enter your Receiver Binance ID / Pay UID.');
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    try {
      const res = await fetch('/api/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmount,
          method: 'Binance Pay',
          address: receiverBinanceId.trim(),
          receiverBinanceId: receiverBinanceId.trim(),
          binanceId: receiverBinanceId.trim(),
          currentLiveBalance: liveBalance,
          network: 'Binance Pay UID Transfer',
          userName,
          userEmail,
        }),
      });

      const data = await res.json();
      if (data.success && data.withdrawal) {
        sound.playWin();
        const record = data.withdrawal;
        setSubmittedWithdrawal(record);
        setPastWithdrawals((prev) => [record, ...prev]);

        // Record in Firebase Firestore
        recordWithdrawalToFirebase({
          id: record.id,
          amount: withdrawAmount,
          currency: 'USD',
          method: 'Binance Pay',
          address: receiverBinanceId.trim(),
          binanceId: receiverBinanceId.trim(),
          receiverBinanceId: receiverBinanceId.trim(),
          network: 'Binance Pay UID Transfer',
          userName,
          userEmail,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        }).catch((err) => console.warn('Firestore withdrawal write error:', err));

        // Open reassurance confirmation popup
        setConfirmationModalData({
          id: record.id,
          type: 'WITHDRAWAL',
          amount: withdrawAmount,
          binanceId: receiverBinanceId.trim(),
        });
        setIsConfirmationModalOpen(true);

        // Sync with shared storage for instant visibility in Admin Panel
        try {
          const raw = localStorage.getItem('cb_admin_shared_withdrawals');
          const existing = raw ? JSON.parse(raw) : [];
          const updated = [record, ...existing.filter((x: any) => x.id !== record.id)];
          localStorage.setItem('cb_admin_shared_withdrawals', JSON.stringify(updated));
          window.dispatchEvent(new Event('cb_withdrawals_updated'));
        } catch {
          // ignore
        }

        onWithdrawSuccess(withdrawAmount, 'Binance Pay', receiverBinanceId.trim());
      } else {
        setErrorMsg(data.error || 'Failed to submit withdrawal request.');
      }
    } catch {
      // Offline fallback
      sound.playWin();
      const mockRecord = {
        id: 'WTH-' + Math.floor(100000 + Math.random() * 900000),
        userName,
        userEmail,
        amount: withdrawAmount,
        currency: 'USD',
        method: 'Binance Pay',
        address: receiverBinanceId.trim(),
        receiverBinanceId: receiverBinanceId.trim(),
        binanceId: receiverBinanceId.trim(),
        network: 'Binance Pay UID Transfer',
        status: 'PENDING' as const,
        createdAt: Date.now(),
      };
      setSubmittedWithdrawal(mockRecord);
      setPastWithdrawals((prev) => [mockRecord, ...prev]);

      // Record fallback to Firebase Firestore
      recordWithdrawalToFirebase({
        id: mockRecord.id,
        amount: withdrawAmount,
        currency: 'USD',
        method: 'Binance Pay',
        address: receiverBinanceId.trim(),
        binanceId: receiverBinanceId.trim(),
        receiverBinanceId: receiverBinanceId.trim(),
        network: 'Binance Pay UID Transfer',
        userName,
        userEmail,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }).catch((err) => console.warn('Firestore fallback withdrawal write error:', err));

      // Open reassurance confirmation popup
      setConfirmationModalData({
        id: mockRecord.id,
        type: 'WITHDRAWAL',
        amount: withdrawAmount,
        binanceId: receiverBinanceId.trim(),
      });
      setIsConfirmationModalOpen(true);

      try {
        const raw = localStorage.getItem('cb_admin_shared_withdrawals');
        const existing = raw ? JSON.parse(raw) : [];
        const updated = [mockRecord, ...existing.filter((x: any) => x.id !== mockRecord.id)];
        localStorage.setItem('cb_admin_shared_withdrawals', JSON.stringify(updated));
        window.dispatchEvent(new Event('cb_withdrawals_updated'));
      } catch {
        // ignore
      }

      onWithdrawSuccess(withdrawAmount, 'Binance Pay', receiverBinanceId.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header Bar with Back Button */}
      <div className="sticky top-0 z-40 bg-[#0c101c]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl">
        <button
          id="withdrawal-back-top-btn"
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-[#F0B90B] to-yellow-200 text-slate-950 flex items-center justify-center font-black shadow-lg ring-2 ring-amber-400/30">
            <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-sm font-black text-white tracking-wide">Payout & Withdrawal</div>
            <div className="text-[10px] text-amber-400 font-medium">Binance Pay Direct Transfer</div>
          </div>
        </div>

        {/* Right Live Balance Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/70 to-[#0f1f18] border border-emerald-500/40 shadow-sm">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <div className="text-right">
            <div className="text-[9px] uppercase font-bold text-emerald-400/80">Available to Withdraw</div>
            <div className="text-xs font-black text-emerald-300 font-mono">
              ${liveBalance.toFixed(2)} USD
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Banner Hero Card */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#171a26] via-[#121622] to-[#0c0f18] border border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(240,185,11,0.08)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Instant Treasury Settlement • Zero Platform Fees</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Withdraw via <span className="text-[#F0B90B]">Binance Pay</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Receive earnings straight to your Binance Account by providing your Binance ID. All payouts undergo cryptographic security checks with automated execution.
              </p>
            </div>

            {/* Minimum Threshold Status Pill */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shrink-0 w-full sm:w-auto">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Min. Withdrawal</div>
                  <div className="text-lg font-black text-amber-400 font-mono">$10.00 USD</div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Eligibility</div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isBalanceEligible
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {isBalanceEligible ? 'Eligible' : 'Min $10 Req.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insufficient Balance Notice if < $10 */}
        {!isBalanceEligible && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/60 via-[#1f170b] to-[#120e07] border-2 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Minimum Live Account Balance Required: $10.00 USD
                </div>
                <div className="text-xs text-amber-200/80 mt-0.5">
                  Your current live balance is <span className="font-bold text-white font-mono">${liveBalance.toFixed(2)} USD</span>. A minimum balance of $10.00 is required before a payout request can be initiated.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onBack();
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md shrink-0"
            >
              Continue Trading
            </button>
          </div>
        )}

        {/* Submitted Confirmation Card */}
        {submittedWithdrawal && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-[#0e241b] to-[#0a1b14] border border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-base font-black text-white">Withdrawal Request Received!</div>
                  <div className="text-xs text-slate-300">
                    Ref ID: <span className="font-mono text-emerald-400 font-bold">{submittedWithdrawal.id}</span> • Payout: <span className="font-bold text-white">${submittedWithdrawal.amount.toFixed(2)} USD</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Sent to Binance ID: <span className="font-mono text-amber-400">{submittedWithdrawal.address}</span>. The treasury desk processes requests within minutes.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSubmittedWithdrawal(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition cursor-pointer shadow-lg"
              >
                Submit New Request
              </button>
            </div>
          </div>
        )}

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT FORM (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Method Box */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#121624] to-[#0d101a] border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F0B90B]/20 border border-[#F0B90B]/50 flex items-center justify-center">
                    <svg className="w-6 h-6 shrink-0" viewBox="0 0 32 32" fill="none">
                      <path d="M16 2L20.6 6.6L16 11.2L11.4 6.6L16 2Z" fill="#F0B90B" />
                      <path d="M25.4 11.4L30 16L25.4 20.6L20.8 16L25.4 11.4Z" fill="#F0B90B" />
                      <path d="M16 20.8L20.6 25.4L16 30L11.4 25.4L16 20.8Z" fill="#F0B90B" />
                      <path d="M6.6 11.4L11.2 16L6.6 20.6L2 16L6.6 11.4Z" fill="#F0B90B" />
                      <path d="M16 11.2L20.8 16L16 20.8L11.2 16L16 11.2Z" fill="#F0B90B" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">Withdrawal Method: Binance Pay</div>
                    <div className="text-xs text-slate-400">Direct UID Payout • Zero Gas Fee</div>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
                  Exclusive Method
                </span>
              </div>

              {/* Receiver Binance ID Field */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Receiver Binance ID (Pay UID)
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-medium">8-9 digit number</span>
                </div>
                <input
                  id="withdraw-receiver-binance-id-input"
                  type="text"
                  value={receiverBinanceId}
                  onChange={(e) => setReceiverBinanceId(e.target.value)}
                  placeholder="e.g. 794380283 (Your personal Binance ID)"
                  className="w-full px-4 py-3.5 bg-slate-900/90 border-2 border-slate-700 focus:border-amber-400 rounded-2xl text-white font-mono text-base outline-none transition-colors"
                />
                <p className="text-[11px] text-slate-400">
                  Open Binance App &gt; Profile &gt; find your numerical Binance ID. Payout will be sent directly here.
                </p>
              </div>

              {/* Amount to Withdraw */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Withdrawal Amount (USD)
                  </label>
                  <div className="text-xs text-slate-400">
                    Max: <span className="font-mono text-emerald-400 font-bold">${liveBalance.toFixed(2)}</span>
                  </div>
                </div>

                {/* Percentage Shortcuts */}
                <div className="grid grid-cols-4 gap-2">
                  {[0.25, 0.5, 0.75, 1.0].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => handleSetPercent(ratio)}
                      disabled={liveBalance <= 0}
                      className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-300 transition cursor-pointer disabled:opacity-40"
                    >
                      {ratio === 1.0 ? '100% (All)' : `${Math.round(ratio * 100)}%`}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-amber-400 font-mono">
                    $
                  </span>
                  <input
                    id="withdraw-amount-input"
                    type="number"
                    min="10"
                    step="any"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-16 py-3.5 bg-slate-900/90 border-2 border-slate-700 focus:border-amber-400 rounded-2xl text-white font-mono text-lg font-black outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 font-mono">
                    USD
                  </span>
                </div>

                {/* Summary Details */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Requested Amount:</span>
                    <span className="text-white font-mono font-bold">${withdrawAmount.toFixed(2)} USD</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Platform Commission:</span>
                    <span className="text-emerald-400 font-mono font-bold">0.00 USD (FREE)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 font-bold pt-1 border-t border-slate-800">
                    <span>Net Received to Binance:</span>
                    <span className="text-emerald-400 font-mono font-black text-sm">
                      ${withdrawAmount.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Confirm / Submit Button */}
              <button
                id="withdraw-submit-request-btn"
                type="button"
                onClick={handleSubmitWithdrawal}
                disabled={isSubmitting || !isBalanceEligible}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-[#F0B90B] to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm tracking-wide transition-all cursor-pointer shadow-[0_10px_30px_rgba(240,185,11,0.35)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting Withdrawal Request...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-5 h-5 stroke-[3]" />
                    <span>Proceed to Withdrawal (${withdrawAmount.toFixed(2)} USD)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: RULES & INSTRUCTIONS (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Rule Card */}
            <div className="p-6 rounded-3xl bg-[#0f1422] border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Withdrawal Rules & Guidelines</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-white">Minimum Withdrawal:</span> You must maintain a minimum of <span className="text-amber-400 font-bold">$10.00 USD</span> in your live balance to request a withdrawal.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-white">Correct Binance ID:</span> Double check your numerical Binance ID. We are not responsible for payouts sent to an incorrect UID entered by the user.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-white">Execution Speed:</span> Treasury executes transfers 24/7. Average turnaround is typically 5 to 15 minutes.
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Withdrawals History */}
            <div className="p-5 rounded-3xl bg-[#0e1320] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Recent Payouts History
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Treasury Live Sync</span>
              </div>

              {pastWithdrawals.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No withdrawal history recorded yet. Your requested payouts will appear here in real time.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {pastWithdrawals.map((wth) => (
                    <div key={wth.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white font-mono">{wth.id}</div>
                        <div className="text-[10px] text-slate-400">
                          To ID: {wth.address || wth.binanceId} • {new Date(wth.createdAt || Date.now()).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-rose-400 font-mono">-${wth.amount.toFixed(2)} USD</div>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            wth.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : wth.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400 animate-pulse'
                          }`}
                        >
                          {wth.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Back Button as requested */}
        <div className="pt-8 pb-12 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            id="withdrawal-back-bottom-btn"
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
            <span>Minimum Withdrawal Limit: $10.00 USD • CryptoBari Verified Treasury</span>
          </div>
        </div>
      </div>

      {/* Reassurance Confirmation Waiting Modal */}
      <TransactionWaitConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        data={confirmationModalData}
      />
    </div>
  );
};
