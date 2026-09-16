import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  X,
  ArrowRight,
  Lock,
  Database,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { sound } from '../../utils/audio';

export interface ConfirmationModalData {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  binanceId: string;
  txHash?: string;
  bonusAmount?: number;
  totalCredited?: number;
  promoCode?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: ConfirmationModalData | null;
}

export const TransactionWaitConfirmationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copied, setCopied] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(120);

  // Countdown timer for realistic broker validation wait
  useEffect(() => {
    if (!isOpen) {
      setCountdownSeconds(120);
      return;
    }
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const isDeposit = data.type === 'DEPOSIT';

  const handleCopyId = () => {
    sound.playClick();
    navigator.clipboard.writeText(data.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.min(100, Math.max(8, Math.round(((120 - countdownSeconds) / 120) * 100)));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4">
        {/* Backdrop with soft blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#111728] via-[#0d1322] to-[#090d18] border-2 border-amber-500/40 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(240,185,11,0.18)] overflow-hidden text-slate-100 z-10 flex flex-col font-sans"
        >
          {/* Subtle gold/emerald ambient light blur */}
          <div
            className={`absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-36 rounded-full blur-3xl pointer-events-none ${
              isDeposit ? 'bg-amber-500/20' : 'bg-emerald-500/20'
            }`}
          />

          {/* Top Bar with Status Tag & Close */}
          <div className="px-5 pt-4 pb-2 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-bold text-amber-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Binance Pay Automated Treasury</span>
            </div>

            <button
              id="confirm-modal-close-btn"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Animated Center Radar & Header */}
          <div className="px-5 pt-2 pb-3 text-center flex flex-col items-center relative z-10">
            {/* Pulsing circular icon badge */}
            <div className="relative mb-3.5">
              <div
                className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                  isDeposit ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center relative shadow-lg ${
                  isDeposit
                    ? 'bg-gradient-to-tr from-amber-600 via-[#F0B90B] to-yellow-300 text-slate-950 shadow-amber-500/25 ring-4 ring-amber-500/20'
                    : 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-300 text-slate-950 shadow-emerald-500/25 ring-4 ring-emerald-500/20'
                }`}
              >
                {isDeposit ? (
                  <Zap className="w-8 h-8 fill-slate-950 stroke-slate-950 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
                )}
              </div>
            </div>

            {/* Title & Manipulated / Persuasive Text */}
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5 justify-center">
              {isDeposit ? 'Deposit Processing • Please Hold On' : 'Withdrawal Queued • Security Clearance'}
            </h3>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed px-1">
              {isDeposit ? (
                <>
                  Your deposit request of{' '}
                  <span className="font-bold text-amber-400 font-mono">
                    ${data.amount.toFixed(2)} USD
                  </span>{' '}
                  has been received and securely submitted to our automated Treasury validation node.
                  Please wait a short moment while our system matches your Binance Pay ID with the blockchain ledger.
                </>
              ) : (
                <>
                  Your payout request of{' '}
                  <span className="font-bold text-emerald-400 font-mono">
                    ${data.amount.toFixed(2)} USD
                  </span>{' '}
                  is registered in the high-priority dispatch queue. Escrow protocol is actively auditing
                  the transfer to Binance ID{' '}
                  <span className="font-mono font-bold text-amber-300">{data.binanceId}</span>.
                </>
              )}
            </p>

            {/* Estimated Wait Time & Mini Progress Bar */}
            <div className="w-full mt-4 p-3 rounded-2xl bg-[#090e1a]/90 border border-slate-800/90 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Estimated Verification Window
                </span>
                <span className="font-mono font-black text-amber-400 tracking-wider">
                  {formatTime(countdownSeconds)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${
                    isDeposit
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Step progression indicators */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[9px] font-bold text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Submitted</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-amber-400 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Node Auditing</span>
                </div>
                <div className="text-slate-500">
                  <span>{isDeposit ? 'Balance Credit' : 'Dispatch Pay'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Ticket Box */}
          <div className="px-5 pb-3">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reference ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-400">{data.id}</span>
                  <button
                    onClick={handleCopyId}
                    title="Copy Reference ID"
                    className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">{isDeposit ? 'Deposit Amount:' : 'Payout Amount:'}</span>
                <span className="font-mono font-black text-white text-sm">
                  ${data.amount.toFixed(2)} USD
                </span>
              </div>

              {data.bonusAmount && data.bonusAmount > 0 ? (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Promo Bonus (+20%):</span>
                  <span className="font-mono font-bold">+${data.bonusAmount.toFixed(2)} USD</span>
                </div>
              ) : null}

              {data.totalCredited && data.totalCredited > data.amount ? (
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>Total Crediting:</span>
                  <span className="font-mono font-black">${data.totalCredited.toFixed(2)} USD</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  {isDeposit ? 'Sender Binance ID:' : 'Destination Binance ID:'}
                </span>
                <span className="font-mono text-slate-200 font-semibold">{data.binanceId}</span>
              </div>

              {/* Firestore Cloud Ledger Badge */}
              <div className="pt-2 mt-1 border-t border-slate-800/70 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Database className="w-3 h-3" />
                  <span>Recorded in Firebase Firestore Ledger</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
                  SECURE
                </span>
              </div>
            </div>
          </div>

          {/* Reassuring Notification & Action Buttons */}
          <div className="px-5 pb-5 pt-1 space-y-2.5">
            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200/90 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                {isDeposit
                  ? 'Feel free to return to the trading terminal. Your Live Balance updates automatically in the background upon confirmation.'
                  : 'Payout will be transmitted straight to your Binance ID. You will receive an instant notification in your Binance App.'}
              </span>
            </div>

            <button
              id="confirm-modal-ok-btn"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-[#F0B90B] to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide transition-all shadow-[0_4px_20px_rgba(240,185,11,0.3)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Understood, Return to Trading Terminal</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
