import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, KeyRound, Key, AlertCircle, ArrowRight, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';
import { sound } from '../../utils/audio';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminData: { role: string; name: string; email: string }) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [accessPin, setAccessPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth/verify-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage,
          accessCode,
          password,
          accessPin,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        sound.playLoss();
        setError(data.message || 'Security verification failed. Access Denied.');
        setIsLoading(false);
        return;
      }

      // Success for current stage
      sound.playClick();

      if (stage === 1) {
        setStage(2);
      } else if (stage === 2) {
        setStage(3);
      } else if (stage === 3) {
        // Complete Verification
        sound.playWin();
        localStorage.setItem('cryptobari_admin_token', data.adminToken);
        localStorage.setItem('cryptobari_admin_active', 'true');
        onSuccess(data.admin || { role: 'SUPER_ADMIN', name: 'Jahid Chowdhury', email: 'johirul4848@gmail.com' });
        handleReset();
      }
    } catch {
      sound.playLoss();
      setError('Connection to security server failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStage(1);
    setAccessCode('');
    setPassword('');
    setAccessPin('');
    setShowPassword(false);
    setShowPin(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#141926] to-[#0b0f19] border border-cyan-500/40 rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(6,182,212,0.25)] text-slate-100 overflow-hidden"
        >
          {/* Subtle Cyber Grid Accents */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            id="admin-auth-close-btn"
            onClick={handleReset}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center">
              <div className="w-full h-full bg-[#0d121f] rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white tracking-wide">Broker Master Admin</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  Stage {stage} of 3
                </span>
              </div>
              <p className="text-xs text-slate-400">Cryptographic multi-stage authentication</p>
            </div>
          </div>

          {/* Stage Progress Bar */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${stage >= 1 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : 'bg-slate-800'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${stage >= 2 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : 'bg-slate-800'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${stage >= 3 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-slate-800'}`} />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleStageSubmit} className="space-y-4">
            {stage === 1 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  Stage 1: Primary Access Code
                </label>
                <div className="relative">
                  <input
                    id="admin-access-code-input"
                    type="password"
                    required
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Enter security access code..."
                    className="w-full px-4 py-3 bg-[#0d121f] border border-slate-700/80 rounded-xl text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Protected by server environment verification.
                </p>
              </div>
            )}

            {stage === 2 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Stage 2: Master Admin Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter master password..."
                    className="w-full px-4 py-3 pr-11 bg-[#0d121f] border border-slate-700/80 rounded-xl text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Second-factor credential check against encrypted vault.
                </p>
              </div>
            )}

            {stage === 3 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  Stage 3: Master Access PIN Number
                </label>
                <div className="relative">
                  <input
                    id="admin-access-pin-input"
                    type={showPin ? 'text' : 'password'}
                    required
                    value={accessPin}
                    onChange={(e) => setAccessPin(e.target.value)}
                    placeholder="Enter 6-digit access PIN..."
                    className="w-full px-4 py-3 pr-11 bg-[#0d121f] border border-slate-700/80 rounded-xl text-white font-mono tracking-widest text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Final cryptographic PIN authorization for master broker operations.
                </p>
              </div>
            )}

            <button
              id="admin-verify-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 mt-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-[0_8px_25px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{stage === 3 ? 'Authorize & Open Master Admin' : `Verify Stage ${stage} & Proceed`}</span>
                  {stage === 3 ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>

          {/* Security Disclaimer */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>256-Bit SSL Secured</span>
            <span>Broker Ops Vault</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
