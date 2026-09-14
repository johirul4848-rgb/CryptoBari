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
  Tag,
  Gift,
  BadgePercent,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { BinancePayQRCard } from './BinancePayQRCard';
import { Transaction } from '../../types';
import { influencerService } from '../../services/influencerService';

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
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [activePromoCode, setActivePromoCode] = useState<string>('');
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);
  const [promoErrorMsg, setPromoErrorMsg] = useState<string | null>(null);
  const [guideMode, setGuideMode] = useState<'id' | 'qr'>('id');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submittedDeposit, setSubmittedDeposit] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle promo code activation
  const handleActivatePromo = (codeToActivate?: string) => {
    sound.playClick();
    const targetCode = (codeToActivate || promoCodeInput).trim().toUpperCase();
    if (!targetCode) {
      setPromoErrorMsg('Please enter or select a promo code to activate.');
      setPromoSuccessMsg(null);
      return;
    }

    const validation = influencerService.validatePromoCode(targetCode);
    if (validation.valid) {
      sound.playWin();
      setActivePromoCode(validation.code);
      setPromoCodeInput(validation.code);
      setPromoSuccessMsg(validation.message);
      setPromoErrorMsg(null);
    } else {
      setPromoErrorMsg(validation.message);
      setPromoSuccessMsg(null);
    }
  };

  // Handle removing promo code
  const handleDeactivatePromo = () => {
    sound.playClick();
    setActivePromoCode('');
    setPromoCodeInput('');
    setPromoSuccessMsg(null);
    setPromoErrorMsg(null);
  };

  // Bonus calculation:
  // $30-$49: 30%, $50-$69: 40%, $70+: 60%
  const cleanPromo = activePromoCode.trim().toUpperCase();
  const hasPromo = cleanPromo.length > 0;
  let bonusPercent = 0;
  if (hasPromo && depositAmount >= 30) {
    if (depositAmount >= 70) {
      bonusPercent = 60;
    } else if (depositAmount >= 50) {
      bonusPercent = 40;
    } else {
      bonusPercent = 30;
    }
  }
  const bonusAmount = hasPromo && bonusPercent > 0 ? parseFloat((depositAmount * (bonusPercent / 100)).toFixed(2)) : 0;
  const totalCredited = parseFloat((depositAmount + bonusAmount).toFixed(2));

  if (!isOpen) return null;

  const quickAmounts = [5, 10, 25, 50, 100, 250, 500, 1000];

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (depositAmount < 5) {
      setErrorMsg('Minimum deposit amount is $5.00 USD. You can deposit at least $5.');
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
          promoCode: cleanPromo || undefined,
          userName,
          userEmail,
        }),
      });

      const data = await res.json();
      if (data.success && data.deposit) {
        sound.playWin();
        setSubmittedDeposit(data.deposit);
        if (cleanPromo) {
          influencerService.processDepositWithPromo({
            depositId: data.deposit.id,
            traderName: userName,
            traderEmail: userEmail,
            depositAmount,
            promoCode: cleanPromo,
          });
        }
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
        promoCode: cleanPromo || undefined,
        bonusPercent: bonusPercent > 0 ? bonusPercent : undefined,
        bonusAmount: bonusAmount > 0 ? bonusAmount : undefined,
        totalCredited,
        status: 'PENDING',
        createdAt: Date.now(),
      };
      setSubmittedDeposit(mockDeposit);
      if (cleanPromo) {
        influencerService.processDepositWithPromo({
          depositId: mockDeposit.id,
          traderName: userName,
          traderEmail: userEmail,
          depositAmount,
          promoCode: cleanPromo,
        });
      }
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Deposit Amount (USD / USDT)
                      </label>
                      <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                        <span>Min Deposit: $5.00 USD (at least $5)</span>
                      </span>
                    </div>
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
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1 ${
                            depositAmount === amt
                              ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                              : 'bg-[#151d30] text-slate-300 hover:bg-[#1b253d] border border-slate-700/60'
                          }`}
                        >
                          <span>+${amt}</span>
                          {amt === 5 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                              Min $5
                            </span>
                          )}
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
                      value={senderBinanceId}
                      onChange={(e) => setSenderBinanceId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#090d18] border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Transaction ID / Order ID Proof */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Binance Pay Order ID / Transaction Hash (Proof)
                    </label>
                    <input
                      type="text"
                      required
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#090d18] border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* ========================================================= */}
                  {/* PROMOTION CODE & ACTIVE OFFERS ACTIVATION ENGINE */}
                  {/* ========================================================= */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#161c2e] to-[#101626] border border-amber-500/35 shadow-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black text-white tracking-wide">
                          Promotion Code & Trading Bonus Offer
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                        Up to +60% Bonus
                      </span>
                    </div>

                    {/* Active Code Status Header if Applied */}
                    {hasPromo ? (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 to-[#0e221b] border border-emerald-500/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-xs">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-white font-mono tracking-wider">
                                {cleanPromo}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500 text-slate-950 uppercase">
                                Offer Active
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-300">
                              Tiered Promotional Bonus enabled on this deposit!
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleDeactivatePromo}
                          className="px-2.5 py-1 text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-rose-500/30 transition cursor-pointer"
                        >
                          Remove Offer
                        </button>
                      </div>
                    ) : (
                      /* Promo Code Input & Activate Function */
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={promoCodeInput}
                              onChange={(e) => {
                                setPromoCodeInput(e.target.value.toUpperCase());
                                setPromoErrorMsg(null);
                              }}
                              className="w-full pl-9 pr-3 py-2.5 bg-[#090d18] border border-amber-500/40 rounded-xl text-xs font-mono font-black text-amber-300 tracking-wider uppercase focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleActivatePromo()}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs cursor-pointer transition shadow-md flex items-center gap-1.5 shrink-0 active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Activate Offer</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {promoSuccessMsg && (
                      <div className="text-[11px] text-emerald-400 bg-emerald-500/15 p-2 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        <span>{promoSuccessMsg}</span>
                      </div>
                    )}
                    {promoErrorMsg && (
                      <div className="text-[11px] text-rose-400 bg-rose-500/15 p-2 rounded-lg border border-rose-500/30 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span>{promoErrorMsg}</span>
                      </div>
                    )}

                    {/* Dynamic Bonus Preview & Threshold Calculator */}
                    {hasPromo && (
                      <div className="pt-2 border-t border-slate-800">
                        {depositAmount < 30 ? (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                            <div className="text-[11px] text-amber-300 flex items-start gap-1.5">
                              <Info className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                              <span>
                                Code <strong>{cleanPromo}</strong> is active! Deposit at least <strong>$30.00 USD</strong> to unlock your promotional trading bonus.
                              </span>
                            </div>
                            {/* Quick Select Buttons to reach bonus threshold */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  sound.playClick();
                                  setDepositAmount(30);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[10px] font-bold border border-amber-500/40 transition cursor-pointer"
                              >
                                Set $30 (+30% Bonus)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  sound.playClick();
                                  setDepositAmount(50);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[10px] font-bold border border-amber-500/40 transition cursor-pointer"
                              >
                                Set $50 (+40% Bonus)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  sound.playClick();
                                  setDepositAmount(70);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[10px] font-bold border border-amber-500/40 transition cursor-pointer"
                              >
                                Set $70 (+60% Max Bonus)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 p-3 rounded-xl bg-gradient-to-br from-emerald-950/60 to-[#0e1d17] border border-emerald-500/40 text-xs">
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-slate-300">Base Deposit Amount:</span>
                              <span className="text-white font-bold">${depositAmount.toFixed(2)} USD</span>
                            </div>
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-emerald-400 font-bold">Promo Bonus Unlocked (+{bonusPercent}%):</span>
                              <span className="text-emerald-400 font-bold text-sm">+${bonusAmount.toFixed(2)} USD</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-emerald-500/20 pt-1 font-mono font-black">
                              <span className="text-white">Credited to Live Account Balance:</span>
                              <span className="text-amber-400 text-base">${totalCredited.toFixed(2)} USD</span>
                            </div>
                            <div className="text-[10px] text-slate-400 leading-tight pt-1">
                              * Bonus dollars are credited for trading only. Profits generated above bonus are 100% withdrawable real money.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
