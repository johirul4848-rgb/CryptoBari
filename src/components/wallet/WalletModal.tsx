import React, { useState } from 'react';
import { UserWallet, Transaction } from '../../types';
import { X, ArrowDownLeft, Plus, RefreshCw, CheckCircle, Wallet, QrCode } from 'lucide-react';
import { sound } from '../../utils/audio';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  accountMode: 'DEMO' | 'LIVE';
  onResetDemo: () => void;
  onDeposit: (amount: number, method: string) => void;
  onWithdraw: (amount: number, method: string, address: string) => void;
  transactions: Transaction[];
  initialTab?: 'overview' | 'deposit' | 'withdraw' | 'transactions';
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  accountMode,
  onResetDemo,
  onDeposit,
  onWithdraw,
  transactions,
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'transactions'>(initialTab);
  const [depositAmount, setDepositAmount] = useState<number>(50);
  const [depositMethod, setDepositMethod] = useState<string>('USDT (TRC20)');
  const [binanceId, setBinanceId] = useState<string>('892348102');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50);
  const [withdrawMethod, setWithdrawMethod] = useState<string>('USDT (TRC20)');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;
    sound.playClick();
    onDeposit(depositAmount, depositMethod);
    
    // Also notify broker admin queue with Binance ID
    try {
      await fetch('/api/wallet/deposit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositAmount,
          method: depositMethod,
          userName: 'Johirul Islam',
          userEmail: 'johirul4848@gmail.com',
          binanceId: binanceId.trim() || `BN-${Math.floor(10000000 + Math.random() * 90000000)}`,
        }),
      });
    } catch {
      // ignore
    }

    setActionSuccess(`Deposit of $${depositAmount} via ${depositMethod} initiated! Registered in broker queue.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0 || !withdrawAddress) return;
    sound.playClick();
    onWithdraw(withdrawAmount, withdrawMethod, withdrawAddress);

    // Also notify broker admin queue
    try {
      await fetch('/api/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmount,
          method: withdrawMethod,
          address: withdrawAddress,
          userName: 'Johirul Islam',
          userEmail: 'johirul4848@gmail.com',
        }),
      });
    } catch {
      // ignore
    }

    setActionSuccess(`Withdrawal of $${withdrawAmount} submitted for Admin verification.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-[#111724] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#151c2c]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100">CryptoBari Financial Wallet</h2>
              <p className="text-xs text-slate-400">Manage demo practice balance and real fund transactions</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-[#121826]">
          {(['overview', 'deposit', 'withdraw', 'transactions'] as const).map(t => (
            <button
              key={t}
              onClick={() => {
                sound.playClick();
                setActiveTab(t);
              }}
              className={`pb-3 px-3 text-xs font-extrabold transition-all border-b-2 cursor-pointer capitalize ${
                activeTab === t
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Success Banner */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Demo Card */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-[#161f30] to-[#121724] border border-amber-500/30 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
                    <span>Practice Demo Wallet</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px]">RISK-FREE</span>
                  </div>
                  <div className="font-mono font-black text-2xl text-slate-100 mt-2">
                    ${wallet.demoBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Virtual funds for learning and strategy testing</div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Default: $10,000.00</span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        onResetDemo();
                        setActionSuccess('Demo balance restored to $10,000.00');
                        setTimeout(() => setActionSuccess(null), 3000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset $10k</span>
                    </button>
                  </div>
                </div>

                {/* Live Card */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-[#12231e] to-[#0f1722] border border-emerald-500/30 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase tracking-wider">
                    <span>Live Real Wallet</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[10px]">REAL MONEY</span>
                  </div>
                  <div className="font-mono font-black text-2xl text-slate-100 mt-2">
                    ${wallet.liveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Locked in active trades: ${wallet.lockedBalance.toFixed(2)}</div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveTab('deposit');
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Deposit</span>
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveTab('withdraw');
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Withdraw</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEPOSIT TAB */}
          {activeTab === 'deposit' && (
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['USDT (TRC20)', 'USDT (BEP20)', 'Bitcoin (BTC)', 'bKash / Nagad', 'Bank Card / UPI'].map(m => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setDepositMethod(m)}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left cursor-pointer ${
                        depositMethod === m
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Deposit Amount (USD)</label>
                <div className="flex items-center gap-2">
                  {[20, 50, 100, 250, 500].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setDepositAmount(amt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        depositAmount === amt
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  className="w-full mt-2 bg-[#182234] border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Binance ID / Pay UID</span>
                  <span className="text-[10px] text-amber-400 font-normal">Partner Verified</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 892348102"
                  value={binanceId}
                  onChange={(e) => setBinanceId(e.target.value)}
                  className="w-full bg-[#182234] border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Your Binance User ID (UID) will be linked with this transaction proof for admin approval.
                </p>
              </div>

              <div className="p-3 bg-[#151d2c] border border-slate-800 rounded-lg text-xs text-slate-300 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-100">Simulated Instant Gateway</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Test funds are securely credited to your live account.</div>
                </div>
                <QrCode className="w-8 h-8 text-amber-400" />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-lg shadow-lg cursor-pointer transition-colors"
              >
                Proceed to Deposit ${depositAmount}
              </button>
            </form>
          )}

          {/* WITHDRAW TAB */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Withdrawal Method</label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="w-full bg-[#182234] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option>USDT (TRC20)</option>
                  <option>USDT (BEP20)</option>
                  <option>Bitcoin (BTC)</option>
                  <option>Bank Wire Transfer</option>
                  <option>bKash / Nagad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Amount (USD)</label>
                <input
                  type="number"
                  min="20"
                  max={wallet.liveBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#182234] border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Available for withdrawal: ${wallet.liveBalance.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Destination Address / Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. TR7NHkorek8vWTVz5CWPaX88xN31... or Bank details"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full bg-[#182234] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={wallet.liveBalance < withdrawAmount || withdrawAmount <= 0}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm rounded-lg shadow-lg cursor-pointer transition-colors"
              >
                Submit Withdrawal Request
              </button>
            </form>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No transaction records found. Deposits and withdrawals will appear here.
                </div>
              ) : (
                transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-3 bg-[#151c2c] border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{tx.description}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{new Date(tx.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className={`font-bold ${tx.type === 'DEPOSIT' || tx.type === 'PAYOUT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'PAYOUT' ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
