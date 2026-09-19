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

  // Realistic countdown timer
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

  const progressPercent = Math.min(100, Math.max(10, Math.round(((120 - countdownSeconds) / 120) * 100)));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Soft dark backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Compact, responsive modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#111728] to-[#0a0f1d] border border-amber-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden text-slate-100 z-10 p-4 sm:p-5 flex flex-col font-sans my-auto"
        >
          {/* Top Bar: Compact Status Badge & Close Button */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/60 text-[10px] font-bold text-amber-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <span>Binance Pay Automated Node</span>
            </div>

            <button
              id="confirm-modal-close-btn"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Main Status & Short Reassuring Note */}
          <div className="text-center pt-3 pb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 shadow-md bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950">
              {isDeposit ? (
                <Zap className="w-5 h-5 fill-slate-950 stroke-slate-950" />
              ) : (
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
              {isDeposit ? 'Deposit Request Received' : 'Withdrawal Queued for Dispatch'}
            </h3>

            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-snug">
              {isDeposit
                ? 'Your request is submitted to Treasury. Please hold on a moment while Binance Pay matches the UID.'
                : 'Your payout is registered and being cleared by Treasury. Funds will transfer directly to your Binance Pay UID.'}
            </p>
          </div>

          {/* Compact Timer & Progression Bar */}
          <div className="my-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 text-amber-400" />
                Est. Verification Time
              </span>
              <span className="font-mono font-black text-amber-400">
                {formatTime(countdownSeconds)}
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 pt-0.5">
              <span className="text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Received
              </span>
              <span className="text-amber-400 animate-pulse">Auditing</span>
              <span>{isDeposit ? 'Balance Credit' : 'Payment Sent'}</span>
            </div>
          </div>

          {/* Compact Ticket Info Grid */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800/80 space-y-1.5 text-[11px] mb-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Reference:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-amber-400">{data.id}</span>
                <button
                  onClick={handleCopyId}
                  title="Copy Reference ID"
                  className="p-0.5 hover:text-white text-slate-400 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isDeposit ? 'Deposit Amount:' : 'Payout Amount:'}</span>
              <span className="font-mono font-bold text-white text-xs sm:text-sm">
                ${data.amount.toFixed(2)} USD
              </span>
            </div>

            {data.bonusAmount && data.bonusAmount > 0 ? (
              <div className="flex items-center justify-between text-emerald-400">
                <span>Trading Bonus:</span>
                <span className="font-mono font-bold">+${data.bonusAmount.toFixed(2)} USD (Trade Only)</span>
              </div>
            ) : null}

            {data.totalCredited && data.totalCredited > data.amount ? (
              <div className="flex items-center justify-between text-amber-300 font-semibold">
                <span>Total Trading Margin:</span>
                <span className="font-mono font-bold">${data.totalCredited.toFixed(2)} USD</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isDeposit ? 'Sender UID:' : 'Receiver UID:'}</span>
              <span className="font-mono text-slate-200">{data.binanceId}</span>
            </div>
          </div>

          {/* Compact Note & Action Button */}
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200/90 flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>
              {isDeposit
                ? 'Your Real Balance auto-credits in the background as soon as verified.'
                : 'Payout will be transmitted directly to your Binance Pay account.'}
            </span>
          </div>

          <button
            id="confirm-modal-ok-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-[#F0B90B] to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Back to Trading Terminal</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
