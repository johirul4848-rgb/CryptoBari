import React, { useState } from 'react';
import { X, Lock, Mail, User, Globe, Eye, EyeOff, ShieldCheck, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { sound } from '../../utils/audio';
import { auth, db } from '../../lib/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { name: string; email: string; country: string }) => void;
  initialMode?: 'login' | 'register';
}

const COUNTRIES = [
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currency: 'USD' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'USD' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'USD' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'USD' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'USD' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'USD' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', currency: 'USD' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'USD' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currency: 'USD' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: 'USD' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'USD' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'USD' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', currency: 'USD' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'USD' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'USD' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'register',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('BD');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      sound.playLose();
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      sound.playLose();
      return;
    }
    if (mode === 'register' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      sound.playLose();
      return;
    }
    if (mode === 'register' && !agreeTerms) {
      setErrorMessage('Please accept the trading terms & risk disclosure.');
      sound.playLose();
      return;
    }

    setIsLoading(true);
    sound.playClick();

    const countryObj = COUNTRIES.find((c) => c.code === selectedCountry);
    const countryStr = countryObj ? `${countryObj.flag} ${countryObj.name}` : 'Global Trader';

    try {
      if (mode === 'register') {
        // Firebase Authentication: Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // Update display name
        if (fullName.trim()) {
          try {
            await updateProfile(user, { displayName: fullName.trim() });
          } catch (profileErr) {
            console.warn('Could not update profile name:', profileErr);
          }
        }

        // Create user document in Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: fullName.trim() || user.email?.split('@')[0],
            country: countryStr,
            createdAt: Date.now(),
            role: user.email === 'Johirul4848@gmail.com' ? 'ADMIN' : 'TRADER',
            wallet: {
              demoBalance: 10000,
              liveBalance: 0,
              currency: 'USD'
            }
          }, { merge: true });
        } catch (dbErr) {
          console.warn('Firestore user doc init:', dbErr);
        }

        sound.playWin();
        onSuccess({
          name: fullName.trim() || user.email?.split('@')[0] || 'Trader',
          email: user.email || email.trim(),
          country: countryStr,
        });
        onClose();
      } else {
        // Firebase Authentication: Sign in with Email/Password
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        let userCountry = countryStr;
        let displayName = user.displayName || user.email?.split('@')[0] || 'Trader';

        try {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data?.country) userCountry = data.country;
            if (data?.displayName) displayName = data.displayName;
          }
        } catch (dbErr) {
          console.warn('Firestore fetch user doc error:', dbErr);
        }

        sound.playWin();
        onSuccess({
          name: displayName,
          email: user.email || email.trim(),
          country: userCountry,
        });
        onClose();
      }
    } catch (err: any) {
      console.error('Firebase Email Auth Error:', err);
      sound.playLose();
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists. Please switch to Sign In.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Invalid email or password. Please verify your credentials.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMessage('Please provide a valid email format.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please check network connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    sound.playClick();

    const provider = new GoogleAuthProvider();
    // Force Google Account Chooser UI so user can select their Google account
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const countryObj = COUNTRIES.find((c) => c.code === selectedCountry);
      const countryStr = countryObj ? `${countryObj.flag} ${countryObj.name}` : 'Global Trader';

      // Sync Firestore profile
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'Trader',
            photoURL: user.photoURL || null,
            country: countryStr,
            createdAt: Date.now(),
            role: user.email === 'Johirul4848@gmail.com' ? 'ADMIN' : 'TRADER',
            wallet: {
              demoBalance: 10000,
              liveBalance: 0,
              currency: 'USD'
            }
          }, { merge: true });
        }
      } catch (dbErr) {
        console.warn('Firestore Google auth sync:', dbErr);
      }

      sound.playWin();
      onSuccess({
        name: user.displayName || user.email?.split('@')[0] || 'Trader',
        email: user.email || 'google.trader@cryptobari.com',
        country: countryStr,
      });
      onClose();
    } catch (err: any) {
      console.error('Google Sign-in Error:', err);
      sound.playLose();
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage('The Google sign-in popup was blocked by your browser or sandbox iframe. Please allow popups or use Email & Password below.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setErrorMessage('A sign-in window is already open. Please complete or close it.');
      } else {
        setErrorMessage(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoAccess = () => {
    sound.playWin();
    onSuccess({
      name: 'Demo Trader',
      email: 'demo.trader@cryptobari.com',
      country: '🌍 Worldwide',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0f1422] border border-slate-700/80 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-400 to-sky-500 shrink-0" />

        {/* Modal Header */}
        <div className="p-4 md:p-5 pb-3 flex items-center justify-between border-b border-slate-800/80 bg-[#121828]/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              CB
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-100 tracking-tight">
                  CryptoBari Terminal
                </span>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                  Binance Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Official High-Yield Binary Broker</p>
            </div>
          </div>

          <button
            id="auth-modal-close-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 space-y-4">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#141b2b] rounded-xl border border-slate-800">
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                sound.playClick();
                setMode('register');
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                sound.playClick();
                setMode('login');
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Quick Google 1-Click Action */}
          <button
            id="google-auth-btn"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-[#182032] hover:bg-[#1e283d] text-slate-200 border border-slate-700/80 rounded-xl font-bold text-xs transition-all shadow-md active:scale-[0.99] cursor-pointer group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <div className="flex-1 h-px bg-slate-800" />
            <span>or continue with email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      id="register-fullname-input"
                      type="text"
                      placeholder="e.g. Johirul Islam"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#151c2c] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Country Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Residence Country
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <select
                      id="register-country-select"
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full bg-[#151c2c] border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer appearance-none"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-[#151c2c] text-slate-100">
                          {c.flag} {c.name} ({c.currency})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-xs">
                      ▼
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="auth-email-input"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#151c2c] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#151c2c] border border-slate-700/80 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms checkbox for register */}
            {mode === 'register' && (
              <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-400"
                />
                <span>
                  I confirm that I am 18+ years old and accept the{' '}
                  <span className="text-amber-400 hover:underline">User Agreement</span> and{' '}
                  <span className="text-amber-400 hover:underline">Risk Disclosure</span>.
                </span>
              </label>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.99] text-slate-950 font-black text-sm shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'register' ? 'Open Account & Trade' : 'Enter Trading Room'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Practice Shortcut */}
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <button
              id="quick-demo-access-btn"
              type="button"
              onClick={handleQuickDemoAccess}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1.5 mx-auto py-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Or Start Instantly with $10,000 Practice Demo</span>
            </button>
          </div>

          {/* Trust Highlights inside Modal */}
          <div className="p-3 bg-[#131926] border border-slate-800 rounded-xl space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong>Low Minimum Entry:</strong> Trade from just <strong>$0.50</strong> (50 cents)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong>Binance Cloud Data:</strong> 100% real-time synchronized candlestick charts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong>Instant Payouts:</strong> Automated Binance Pay & USDT TRC20 withdrawals
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Security Badge */}
        <div className="p-2.5 bg-[#0a0e16] border-t border-slate-800/80 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SSL 256-bit Encrypted • Authentic Binance Liquidity Partner</span>
        </div>
      </div>
    </div>
  );
};
