import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Globe,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Gift,
  Zap,
  Award,
} from 'lucide-react';
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
import { referralService } from '../../services/referralService';

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
  const [sponsorCodeInput, setSponsorCodeInput] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('BD');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sponsorNotice, setSponsorNotice] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSponsorNotice('');

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

        // Check if referral sponsor code was supplied
        let sponsorActivated = null;
        if (sponsorCodeInput.trim()) {
          const res = referralService.activateSponsor(sponsorCodeInput.trim(), fullName.trim());
          if (res.success) {
            sponsorActivated = sponsorCodeInput.trim().toUpperCase();
            setSponsorNotice(`🎉 $10.00 Welcome Bonus credited from sponsor code ${sponsorActivated}!`);
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
            referredBy: sponsorActivated,
            wallet: {
              demoBalance: 10000,
              liveBalance: 0,
              currency: 'USD',
            },
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
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const countryObj = COUNTRIES.find((c) => c.code === selectedCountry);
      const countryStr = countryObj ? `${countryObj.flag} ${countryObj.name}` : 'Global Trader';

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
              currency: 'USD',
            },
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
        setErrorMessage('The Google sign-in popup was blocked. Please allow popups or use Email & Password below.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in was cancelled. Please try again.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl select-none animate-in fade-in duration-200">
      {/* 3D Glassmorphism Container with White Glass & Prismatic Highlights */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0a101d]/85 backdrop-blur-3xl border border-white/30 shadow-[0_30px_100px_rgba(0,0,0,0.9),0_0_60px_rgba(255,255,255,0.12),inset_0_1.5px_2px_rgba(255,255,255,0.6)] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Iridescent Top Accent & Ambient Refractive Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-emerald-400 via-sky-400 to-amber-300 shrink-0" />

        {/* Live Binance Ticker Header with 3D Trading Badges */}
        <div className="p-4 sm:p-5 pb-3 border-b border-white/15 bg-white/[0.04] flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            {/* 3D Golden Logo Badge with Specular Glow */}
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-100 flex items-center justify-center text-slate-950 font-black shadow-[0_4px_20px_rgba(245,158,11,0.5),inset_0_1.5px_2px_rgba(255,255,255,0.9)] ring-2 ring-amber-400/50 text-lg">
              CB
              {/* Mini pulse ring */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg text-white tracking-tight drop-shadow-sm">
                  CryptoBari Terminal
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Binance L2 Live
                </span>
              </div>

              {/* 3D Floating Trading Tokens Strip */}
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-amber-400/40 shadow-sm text-white">
                  <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-400 font-black text-[10px] flex items-center justify-center">₿</span>
                  <span className="font-bold">BTC</span>
                  <span className="text-amber-300 font-extrabold">$79.0k</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-sky-400/40 shadow-sm text-white">
                  <span className="w-4 h-4 rounded-full bg-sky-400/20 text-sky-400 font-black text-[10px] flex items-center justify-center">Ξ</span>
                  <span className="font-bold">ETH</span>
                  <span className="text-sky-300 font-extrabold">$2.6k</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-purple-400/40 shadow-sm text-white">
                  <span className="w-4 h-4 rounded-full bg-purple-400/20 text-purple-400 font-black text-[10px] flex items-center justify-center">◎</span>
                  <span className="font-bold">SOL</span>
                  <span className="text-purple-300 font-extrabold">$103</span>
                </div>
                <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.08] backdrop-blur-md border border-emerald-400/40 shadow-sm text-white">
                  <span className="w-4 h-4 rounded-full bg-emerald-400/20 text-emerald-400 font-black text-[10px] flex items-center justify-center">₮</span>
                  <span className="font-bold">USDT</span>
                </div>
              </div>
            </div>
          </div>

          <button
            id="auth-modal-close-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Form Body with Frosted White Glass Styling */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
          {/* Modern 3D White Glass Segmented Control */}
          <div className="grid grid-cols-2 p-1.5 bg-white/[0.08] backdrop-blur-xl rounded-2xl border border-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]">
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                sound.playClick();
                setMode('register');
                setErrorMessage('');
              }}
              className={`py-2.5 px-3 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-[0_6px_20px_rgba(245,158,11,0.5),inset_0_1px_2px_rgba(255,255,255,0.8)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Account</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-slate-950/25 rounded-md font-mono font-black border border-slate-950/10">
                +$10 Bonus
              </span>
            </button>
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                sound.playClick();
                setMode('login');
                setErrorMessage('');
              }}
              className={`py-2.5 px-3 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-[0_6px_20px_rgba(245,158,11,0.5),inset_0_1px_2px_rgba(255,255,255,0.8)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>

          {/* Quick Google 1-Click Action in Frosted White Glass */}
          <button
            id="google-auth-btn"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white/[0.1] hover:bg-white/[0.18] text-white border border-white/25 hover:border-white/40 rounded-xl font-bold text-xs transition-all shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-[0.99] cursor-pointer group"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
          <div className="flex items-center gap-3 text-slate-300 text-[11px] font-mono">
            <div className="flex-1 h-px bg-white/15" />
            <span>or use email credentials</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/25 border border-rose-500/50 text-rose-200 text-xs font-medium flex items-center gap-2 shadow-md">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {sponsorNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/25 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2 shadow-md">
              <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{sponsorNotice}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-200 uppercase tracking-wider mb-1">
                    Trader Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-300" />
                    <input
                      id="register-fullname-input"
                      type="text"
                      placeholder="e.g. Johirul Islam"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.16] border border-white/25 focus:border-amber-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all font-sans shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]"
                    />
                  </div>
                </div>

                {/* Country Selection */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-200 uppercase tracking-wider mb-1">
                    Country of Residence
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3.5 top-3 text-slate-300" />
                    <select
                      id="register-country-select"
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full bg-[#111728] border border-white/25 focus:border-amber-400 rounded-xl pl-10 pr-8 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors cursor-pointer appearance-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-[#111728] text-white">
                          {c.flag} {c.name} ({c.currency})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400 text-xs">
                      ▼
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-200 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-300" />
                <input
                  id="auth-email-input"
                  type="email"
                  placeholder="trader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.16] border border-white/25 focus:border-amber-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all font-sans shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-200 uppercase tracking-wider mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-300" />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.16] border border-white/25 focus:border-amber-300 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all font-sans shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Optional Sponsor Referral Code in 3D White Glass Card */}
            {mode === 'register' && (
              <div className="p-3.5 rounded-2xl bg-white/[0.07] backdrop-blur-md border border-amber-400/50 shadow-[0_4px_16px_rgba(245,158,11,0.15)]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-extrabold text-amber-300 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>Sponsor Referral Code (Optional)</span>
                  </label>
                  <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                    +$10 Bonus
                  </span>
                </div>
                <input
                  id="register-referral-code-input"
                  type="text"
                  placeholder="e.g. CB67022 (Get $10 bonus)"
                  value={sponsorCodeInput}
                  onChange={(e) => setSponsorCodeInput(e.target.value.toUpperCase().replace(/[^A-Za-z0-9]/g, ''))}
                  className="w-full bg-white/[0.08] border border-amber-400/60 focus:border-amber-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-200 placeholder-slate-400 uppercase tracking-wider focus:outline-none shadow-inner"
                />
                <p className="text-[10px] text-slate-300 mt-1.5">
                  Activate sponsor code to get an instant <strong className="text-amber-300">$10.00</strong> added to your referral balance!
                </p>
              </div>
            )}

            {/* Terms checkbox */}
            {mode === 'register' && (
              <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-800 border-white/30 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span>
                  I certify that I am 18+ years old and accept the{' '}
                  <span className="text-amber-400 hover:underline">Financial Agreement</span> and{' '}
                  <span className="text-amber-400 hover:underline">Risk Disclosure</span>.
                </span>
              </label>
            )}

            {/* High-Conversion 3D Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 active:scale-[0.99] text-slate-950 font-black text-sm shadow-[0_8px_30px_rgba(245,158,11,0.5),inset_0_1px_2px_rgba(255,255,255,0.8)] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 group transform-gpu hover:scale-[1.01]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{mode === 'register' ? 'Create Real Account & Start Trading' : 'Sign In to Trading Terminal'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3] transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Practice Shortcut */}
          <div className="pt-2 border-t border-white/15 text-center">
            <button
              id="quick-demo-access-btn"
              type="button"
              onClick={handleQuickDemoAccess}
              className="text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-2 mx-auto py-1 cursor-pointer transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Or Explore Instantly with <strong>$10,000 Demo Practice</strong></span>
            </button>
          </div>

          {/* 3D White Glass Trust Badges Strip with Trading Symbols */}
          <div className="p-3.5 bg-white/[0.06] backdrop-blur-md border border-white/20 rounded-2xl space-y-2 text-[11px] text-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-400 font-black text-[10px] flex items-center justify-center">₿</span>
              <span>
                <strong>Micro-Lot Trading:</strong> Trade with as little as <strong>$0.50 (50¢)</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-400/20 text-emerald-400 font-black text-[10px] flex items-center justify-center">₮</span>
              <span>
                <strong>Referral Partner 20%:</strong> Auto 20% on referred losses, 20% deduction on wins
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-sky-400/20 text-sky-400 font-black text-[10px] flex items-center justify-center">Ξ</span>
              <span>
                <strong>Instant Binance Pay:</strong> Zero deposit & withdrawal processing fees
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Security Badge */}
        <div className="p-3 bg-black/50 border-t border-white/15 text-center text-[10px] text-slate-300 flex items-center justify-center gap-2 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SSL 256-Bit Financial Encryption • 100% Direct Binance WebSocket Liquidity</span>
        </div>
      </div>
    </div>
  );
};
