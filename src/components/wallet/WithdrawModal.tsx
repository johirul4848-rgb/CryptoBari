import React, { useState } from 'react';
import {
  X,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Clock,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { getTraderTier } from '../../utils/tier';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveBalance: number;
  onWithdrawSuccess: (amount: number, method: string, address: string) => void;
  userEmail?: string;
  userName?: string;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  liveBalance,
  onWithdrawSuccess,
  userEmail = 'johirul4848@gmail.com',
  userName = 'Johirul Islam',
}) => {
  const [receiverBinanceId, setReceiverBinanceId] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(() => Math.max(10, Math.min(50, liveBalance)));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedWithdrawal, setSubmittedWithdrawal] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const tierInfo = getTraderTier(liveBalance);
  const MIN_WITHDRAWAL = 10.0;
  const isBalanceEligible = liveBalance >= MIN_WITHDRAWAL;

  const handleSetPercent = (pct: number) => {
    sound.playClick();
    if (liveBalance <= 0) return;
    const calculated = Math.floor(liveBalance * pct);
    setWithdrawAmount(Math.max(0, calculated));
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isBalanceEligible) {
      setErrorMsg(`Your live account balance ($${liveBalance.toFixed(2)}) is below the minimum required withdrawal balance of $10.00.`);
      return;
    }

    if (withdrawAmount < MIN_WITHDRAWAL) {
      setErrorMsg(`Minimum withdrawal request is $${MIN_WITHDRAWAL.toFixed(2)} USD. Withdrawals below $10.00 are not permitted.`);
      return;
    }

    if (withdrawAmount > liveBalance) {
      setErrorMsg(`Insufficient funds. Your available live balance is $${liveBalance.toFixed(2)}.`);
      return;
    }

    if (!receiverBinanceId.trim()) {
      setErrorMsg('Please enter your Receiver Binance ID (Pay UID).');
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
          network: 'Binance Pay UID Transfer',
          currentLiveBalance: liveBalance,
          userName,
          userEmail,
        }),
      });

      const data = await res.json();
      if (data.success && data.withdrawal) {
        sound.playWin();
        const record = data.withdrawal;
        setSubmittedWithdrawal(record);
        try {
          const raw = localStorage.getItem('cb_admin_shared_withdrawals');
          const existing = raw ? JSON.parse(raw) : [];
          const updated = [record, ...existing.filter((x: any) => x.id !== record.id)];
          localStorage.setItem('cb_admin_shared_withdrawals', JSON.stringify(updated));
        } catch {
          // ignore
        }
        onWithdrawSuccess(withdrawAmount, 'Binance Pay', receiverBinanceId.trim());
        window.dispatchEvent(new CustomEvent('cb_withdrawals_updated'));
      } else {
        setErrorMsg(data.error || 'Withdrawal submission failed.');
      }
    } catch {
      // Offline fallback
      sound.playWin();
      const mockWithdrawal = {
        id: 'WTH-' + Math.floor(10000 + Math.random() * 90000),
        userId: 'usr_johirul',
        userName,
        userEmail,
        amount: withdrawAmount,
        currency: 'USD',
        method: 'Binance Pay',
        address: receiverBinanceId.trim(),
        receiverBinanceId: receiverBinanceId.trim(),
        binanceId: receiverBinanceId.trim(),
        network: 'Binance Pay UID Transfer',
        status: 'PENDING',
        createdAt: Date.now(),
      };
      try {
        const raw = localStorage.getItem('cb_admin_shared_withdrawals');
        const existing = raw ? JSON.parse(raw) : [];
        const updated = [mockWithdrawal, ...existing.filter((x: any) => x.id !== mockWithdrawal.id)];
        localStorage.setItem('cb_admin_shared_withdrawals', JSON.stringify(updated));
      } catch {
        // ignore
      }
      setSubmittedWithdrawal(mockWithdrawal);
      onWithdrawSuccess(withdrawAmount, 'Binance Pay', receiverBinanceId.trim());
      window.dispatchEvent(new CustomEvent('cb_withdrawals_updated'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedWithdrawal(null);
    setReceiverBinanceId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-[#0b101c] border border-blue-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(59,130,246,0.15)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#172033] via-[#131b2c] to-[#172033] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">
              <ArrowUpRight className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white">Withdrawal from Live Account</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/40">
                  Binance Pay Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct payout to your Binance account • Minimum $10.00 USD
              </p>
            </div>
          </div>

          <button
            id="withdraw-modal-close-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {submittedWithdrawal ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="py-8 px-4 text-center max-w-lg mx-auto space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">Withdrawal Request Dispatched!</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Your payout has been submitted to the Admin treasury with status{' '}
                  <span className="text-amber-400 font-bold">PENDING AUTHORIZATION</span>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#121828] border border-slate-800 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Payout Ticket:</span>
                  <span className="text-cyan-400 font-bold">{submittedWithdrawal.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Requested Amount:</span>
                  <span className="text-white font-bold text-sm">${submittedWithdrawal.amount.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payout Method:</span>
                  <span className="text-amber-400 font-bold">Binance Pay (Internal Transfer)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Receiver Binance ID:</span>
                  <span className="text-cyan-400 font-bold">{submittedWithdrawal.address}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Processing Fee:</span>
                  <span className="text-emerald-400 font-bold">$0.00 (Zero Fee)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex items-start gap-2 text-left">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Admin will approve and execute the Binance Pay transfer. Payouts are usually processed within 5–30 minutes.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={handleResetForm}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition"
                >
                  Submit Another Request
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs cursor-pointer transition shadow-lg"
                >
                  Return to Trading
                </button>
              </div>
            </div>
          ) : (
            /* MAIN WITHDRAWAL FORM */
            <div className="space-y-5">
              {/* Live Balance Card with Dynamic Tier & Rules */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c33] to-[#0d1424] border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-blue-400" />
                    <span>Available Live Balance</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                    ${liveBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>Trader Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${tierInfo.badgeClass}`}>
                      {tierInfo.label}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#090d18] border border-slate-700/80 text-xs space-y-1 sm:text-right">
                  <div className="text-slate-400">Withdrawal Gateway</div>
                  <div className="font-extrabold text-[#F0B90B] flex items-center sm:justify-end gap-1">
                    <span>Binance Pay (Instant)</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-bold">Minimum: $10.00 USD</div>
                </div>
              </div>

              {/* Ineligibility Warning if Balance < $10 */}
              {!isBalanceEligible && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3 animate-in shake duration-300">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-sm text-rose-200">
                      Insufficient Balance for Withdrawal
                    </div>
                    <p className="mt-1 leading-relaxed">
                      Your current Live Balance is{' '}
                      <strong className="font-mono text-white">${liveBalance.toFixed(2)}</strong>. The minimum withdrawal threshold is{' '}
                      <strong className="font-mono text-white">$10.00 USD</strong>. A live balance of at least $10.00 is required to request a withdrawal. Please place winning trades or deposit to meet the requirement.
                    </p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
                {/* Withdrawal Method (Fixed to Binance) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Withdrawal Payment Method
                  </label>
                  <div className="p-3 rounded-xl bg-[#101626] border border-amber-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#F0B90B]/20 text-[#F0B90B] flex items-center justify-center font-black text-xs border border-[#F0B90B]/40">
                        B
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-white">Binance Pay (USDT)</div>
                        <div className="text-[10px] text-slate-400">Direct credit to your Binance account</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      0% Fee
                    </span>
                  </div>
                </div>

                {/* Receiver Binance ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Receiver Binance ID (Pay UID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your Binance ID (e.g. 794380283)"
                    value={receiverBinanceId}
                    onChange={(e) => setReceiverBinanceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#090d18] border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Double check your Binance ID. Payouts will be sent directly to this Binance account.
                  </span>
                </div>

                {/* Withdrawal Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Withdrawal Amount (USD)
                    </label>
                    <span className="text-[10px] text-amber-400 font-bold">
                      Min: $10.00 • Max: ${liveBalance.toFixed(2)}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="10"
                      max={liveBalance}
                      step="1"
                      required
                      value={withdrawAmount || ''}
                      onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                      disabled={!isBalanceEligible}
                      className="w-full pl-8 pr-4 py-2.5 bg-[#090d18] border border-slate-700 rounded-xl text-sm font-black text-white font-mono focus:outline-none focus:border-blue-400 disabled:opacity-50"
                    />
                  </div>

                  {/* Percentage Quick Selectors */}
                  {isBalanceEligible && (
                    <div className="flex gap-2 mt-2">
                      {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleSetPercent(pct)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold font-mono bg-[#141b2a] hover:bg-blue-600/20 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                        >
                          {pct === 1.0 ? '100% (Max)' : `${pct * 100}%`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary Box */}
                <div className="p-3.5 rounded-2xl bg-[#0e1424] border border-slate-800 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Withdrawal Amount:</span>
                    <span className="text-white font-bold">${withdrawAmount.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Broker Commission:</span>
                    <span className="text-emerald-400 font-bold">$0.00 (Free)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Remaining Live Balance:</span>
                    <span className="text-blue-300 font-bold">
                      ${Math.max(0, liveBalance - withdrawAmount).toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  id="submit-withdrawal-request-btn"
                  type="submit"
                  disabled={!isBalanceEligible || isSubmitting || withdrawAmount < 10}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-[0_0_25px_rgba(59,130,246,0.4)] transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Submitting Request...</span>
                  ) : !isBalanceEligible ? (
                    <span>Minimum $10 Balance Required</span>
                  ) : (
                    <>
                      <span>Submit Binance Withdrawal Request</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
