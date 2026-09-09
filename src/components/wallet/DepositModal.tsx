import React, { useState } from 'react';
import {
  X,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Smartphone,
  Info,
  Clock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { BinancePayQRCard } from './BinancePayQRCard';
import { Transaction } from '../../types';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: (amount: number, method: string, binanceId: string, txHash: string) => void;
  userEmail?: string;
  userName?: string;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onDepositSuccess,
  userEmail = 'johirul4848@gmail.com',
  userName = 'Johirul Islam',
}) => {
  const [depositAmount, setDepositAmount] = useState<number>(50);
  const [senderBinanceId, setSenderBinanceId] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [guideMode, setGuideMode] = useState<'id' | 'qr'>('id');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDeposit, setSubmittedDeposit] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickAmounts = [10, 25, 50, 100, 250, 500, 1000];

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (depositAmount <= 0) {
      setErrorMsg('Please enter a valid deposit amount.');
      return;
    }
    if (!senderBinanceId.trim()) {
      setErrorMsg('Please provide your sender Binance ID or Pay UID.');
      return;
    }
    if (!txHash.trim()) {
      setErrorMsg('Please provide the Binance Pay Transaction / Order ID proof.');
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    try {
      const res = await fetch('/api/wallet/deposit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositAmount,
          method: 'Binance Pay',
          binanceId: senderBinanceId.trim(),
          txHash: txHash.trim(),
          userName,
          userEmail,
        }),
      });

      const data = await res.json();
      if (data.success && data.deposit) {
        sound.playWin();
        setSubmittedDeposit(data.deposit);
        onDepositSuccess(depositAmount, 'Binance Pay', senderBinanceId.trim(), txHash.trim());
      } else {
        setErrorMsg(data.error || 'Failed to submit deposit request.');
      }
    } catch {
      // Offline / fallback simulation
      sound.playWin();
      const mockDeposit = {
        id: 'DEP-' + Math.floor(100000 + Math.random() * 900000),
        amount: depositAmount,
        currency: 'USD',
        method: 'Binance Pay',
        binanceId: senderBinanceId.trim(),
        txHash: txHash.trim(),
        status: 'PENDING',
        createdAt: Date.now(),
      };
      setSubmittedDeposit(mockDeposit);
      onDepositSuccess(depositAmount, 'Binance Pay', senderBinanceId.trim(), txHash.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedDeposit(null);
    setTxHash('');
    setSenderBinanceId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-[#0b101c] border border-amber-500/40 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(240,185,11,0.15)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#172033] via-[#131b2c] to-[#172033] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F0B90B] to-yellow-200 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white">Deposit to Live Trading Account</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F0B90B]/20 text-[#F0B90B] border border-[#F0B90B]/40">
                  Binance Pay Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instant credit upon blockchain verification • 0% Deposit Fee
              </p>
            </div>
          </div>

          <button
            id="deposit-modal-close-btn"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {submittedDeposit ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="py-8 px-4 text-center max-w-lg mx-auto space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">Deposit Request Submitted!</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Your deposit has been registered in the broker treasury queue with status{' '}
                  <span className="text-amber-400 font-bold">PENDING APPROVAL</span>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#121828] border border-slate-800 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Request ID:</span>
                  <span className="text-cyan-400 font-bold">{submittedDeposit.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Deposit Amount:</span>
                  <span className="text-emerald-400 font-bold text-sm">${submittedDeposit.amount.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Method:</span>
                  <span className="text-white font-bold">Binance Pay (Instant)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sender Binance ID:</span>
                  <span className="text-white font-bold">{submittedDeposit.binanceId}</span>
                </div>
                <div className="flex justify-between text-slate-400 truncate">
                  <span>Tx Hash / Proof:</span>
                  <span className="text-slate-300 truncate max-w-[180px]">{submittedDeposit.txHash}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2 text-left">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Admin will verify the transaction against Binance treasury. Once approved, the funds will immediately credit to your Live Wallet balance.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={handleResetForm}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition"
                >
                  Submit Another Deposit
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs cursor-pointer transition shadow-lg"
                >
                  Return to Trading
                </button>
              </div>
            </div>
          ) : (
            /* MAIN DEPOSIT WORKFLOW */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Official Binance Pay Card (Replicating User Image) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full">
                  <div className="mb-2 text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>Official Receiver Details</span>
                    <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified Partner</span>
                    </span>
                  </div>

                  {/* Binance Pay Card with Attached Image Recreation */}
                  <BinancePayQRCard
                    binanceId="794380283"
                    nickname="CryptoBari"
                    onCopySuccess={() => sound.playClick()}
                  />
                </div>
              </div>

              {/* Right Column: Direction Steps & Submission Form */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Step-by-Step Instructions Toggle (Binance ID vs QR Code) */}
                <div className="p-4 rounded-2xl bg-[#111728] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#F0B90B]" />
                      <span>How to Pay via Binance App</span>
                    </span>

                    {/* Guide Tabs */}
                    <div className="flex bg-[#0b0f19] p-1 rounded-xl border border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setGuideMode('id')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          guideMode === 'id'
                            ? 'bg-[#F0B90B] text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Option 1: Binance ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuideMode('qr')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          guideMode === 'qr'
                            ? 'bg-[#F0B90B] text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Option 2: Scan QR Code
                      </button>
                    </div>
                  </div>

                  {/* Direction Steps Content */}
                  {guideMode === 'id' ? (
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          1
                        </span>
                        <span>
                          Open the <strong>Binance App</strong> on your mobile phone.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          2
                        </span>
                        <span>
                          Go to <strong>Profile</strong> (top-left avatar) → Tap <strong>Pay</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          3
                        </span>
                        <span>
                          Tap <strong>Send</strong> → Choose the <strong>Binance ID</strong> option.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          4
                        </span>
                        <span>
                          Enter Receiver Binance ID: <strong className="text-amber-400 font-mono">794380283</strong>{' '}
                          (Nickname: <strong className="text-white">CryptoBari</strong>).
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          5
                        </span>
                        <span>
                          Enter amount in <strong>USDT</strong> and complete the transfer with your PIN.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          6
                        </span>
                        <span>
                          Copy the <strong>Transaction / Order ID</strong> and fill in the form below.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          1
                        </span>
                        <span>
                          Open the <strong>Binance App</strong> on your phone.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          2
                        </span>
                        <span>
                          Go to <strong>Profile</strong> or tap the <strong>Scan QR</strong> icon at the top-right corner.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          3
                        </span>
                        <span>
                          Scan the <strong>CryptoBari Binance Pay QR Code</strong> shown on the left.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          4
                        </span>
                        <span>
                          Enter the amount in <strong>USDT</strong> and authorize payment.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-[10px]">
                          5
                        </span>
                        <span>
                          Copy the <strong>Order ID / Tx Proof</strong> and submit the form below.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Deposit Verification Form */}
                <form
                  onSubmit={handleSubmitDeposit}
                  className="p-5 rounded-2xl bg-gradient-to-br from-[#12192d] to-[#0e1424] border border-cyan-500/30 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Submit Payment Proof & Confirm Deposit</span>
                    </h3>
                    <span className="text-[10px] text-cyan-400 font-mono">Instant Queue</span>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
                      {errorMsg}
                    </div>
                  )}

                  {/* Amount Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Deposit Amount (USD / USDT)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                      <input
                        type="number"
                        min="5"
                        max="50000"
                        step="1"
                        required
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2.5 bg-[#090d18] border border-slate-700 rounded-xl text-sm font-black text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Quick Amount Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {quickAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setDepositAmount(amt);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                            depositAmount === amt
                              ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                              : 'bg-[#151d30] text-slate-300 hover:bg-[#1b253d] border border-slate-700/60'
                          }`}
                        >
                          +${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sender Binance ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Your Binance ID (Pay UID)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 849204910"
                      value={senderBinanceId}
                      onChange={(e) => setSenderBinanceId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#090d18] border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Found in your Binance App → Profile → Pay UID / User ID.
                    </span>
                  </div>

                  {/* Transaction ID / Order ID Proof */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Binance Pay Order ID / Transaction Hash (Proof)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 294819402948201 or 0x48a9..."
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#090d18] border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      The transaction receipt ID generated after sending via Binance Pay.
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="submit-deposit-proof-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-[#F0B90B] via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black text-sm rounded-xl shadow-[0_0_25px_rgba(240,185,11,0.4)] transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Submitting to Treasury...</span>
                    ) : (
                      <>
                        <span>Confirm & Proceed to Deposit</span>
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
