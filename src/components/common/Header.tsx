import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { ConnectionStatus, AccountMode } from '../../types';
import {
  Bell,
  Volume2,
  VolumeX,
  ChevronDown,
  RefreshCw,
  Plus,
  ArrowDownLeft,
  ShieldCheck,
  User,
  Menu,
  X,
  CandlestickChart,
  BarChart3,
  History,
  Wallet,
  LifeBuoy,
  Home,
  LogOut,
  Sparkles,
  Zap,
  Users,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { getTraderTier } from '../../utils/tier';
import { NavTab } from './Sidebar';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  accountMode: AccountMode;
  onToggleAccountMode: (mode: AccountMode) => void;
  demoBalance: number;
  liveBalance: number;
  onResetDemo: () => void;
  onOpenDeposit: () => void;
  onOpenWithdrawal: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  unreadNotificationsCount: number;
  currentTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  activeTradesCount?: number;
  onLogout?: () => void;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  accountMode,
  onToggleAccountMode,
  demoBalance,
  liveBalance,
  onResetDemo,
  onOpenDeposit,
  onOpenWithdrawal,
  onOpenNotifications,
  onOpenProfile,
  unreadNotificationsCount,
  currentTab = 'trade',
  onSelectTab,
  activeTradesCount = 0,
  onLogout,
  userName = 'Johirul Islam',
}) => {
  const [isSoundOn, setIsSoundOn] = useState(sound.isEnabled());
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [utcTime, setUtcTime] = useState('');

  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);

  const tierInfo = getTraderTier(liveBalance);

  // Auto-close dropdowns when user clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (navDropdownRef.current && !navDropdownRef.current.contains(target)) {
        setIsNavDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(target)) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const newVal = sound.toggleSound();
    setIsSoundOn(newVal);
  };

  const currentBalance = accountMode === 'DEMO' ? demoBalance : liveBalance;

  return (
    <header className="h-12 md:h-14 bg-[#0a0e17] border-b border-slate-800/80 px-2 sm:px-4 flex items-center justify-between shrink-0 select-none z-40 relative">
      {/* Left: Brand Logo & Binance Live Status */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div
          onClick={() => {
            sound.playClick();
            if (onSelectTab) onSelectTab('landing');
          }}
          className="cursor-pointer transition-transform hover:scale-105"
          title="Go to Homepage"
        >
          <Logo />
        </div>

        {/* Binance Spot Connection Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#121827] border border-slate-800 text-[10px] font-mono">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'LIVE'
                ? 'bg-emerald-400 animate-pulse'
                : connectionStatus === 'RECONNECTING'
                ? 'bg-amber-400 animate-ping'
                : 'bg-rose-400'
            }`}
          />
          <span
            className={
              connectionStatus === 'LIVE'
                ? 'text-emerald-400 font-bold'
                : connectionStatus === 'RECONNECTING'
                ? 'text-amber-400 font-bold'
                : 'text-rose-400 font-bold'
            }
          >
            {connectionStatus === 'LIVE' ? 'BINANCE LIVE' : connectionStatus}
          </span>
        </div>
      </div>

      {/* Right: Smart 3D Balance Selector + Deposit + Notifications + 3D Colorful Nav Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* ======================================================== */}
        {/* 1. SMART 3D BALANCE SELECTION (DEMO vs REAL) */}
        {/* ======================================================== */}
        <div className="relative" ref={accountDropdownRef}>
          <button
            id="smart-account-selector-btn"
            onClick={() => {
              sound.playClick();
              setIsAccountDropdownOpen(!isAccountDropdownOpen);
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all cursor-pointer border shadow-md active:scale-98 ${
              accountMode === 'LIVE'
                ? 'bg-gradient-to-r from-emerald-950/70 via-[#10221c] to-[#0c1814] border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] text-slate-100'
                : 'bg-gradient-to-r from-amber-950/60 via-[#221c12] to-[#1a150c] border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-slate-100'
            }`}
            title="Click to switch Demo & Real accounts"
          >
            {/* Mode Dot & Icon */}
            <div className="relative flex items-center justify-center">
              <span
                className={`w-2.5 h-2.5 rounded-full ring-2 ${
                  accountMode === 'LIVE'
                    ? 'bg-emerald-400 ring-emerald-500/40 animate-pulse'
                    : 'bg-amber-400 ring-amber-500/40'
                }`}
              />
            </div>

            {/* Balance Text */}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span
                  className={`text-[9px] font-black uppercase tracking-wider ${
                    accountMode === 'LIVE' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {accountMode === 'LIVE' ? 'REAL LIVE' : 'DEMO'}
                </span>
                <span className="text-[8px] text-slate-400 hidden xs:inline">• USD</span>
              </div>
              <span className="text-xs sm:text-sm font-black font-mono tracking-tight text-white leading-none">
                ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isAccountDropdownOpen
                  ? 'rotate-180 text-amber-400'
                  : 'text-slate-400'
              }`}
            />
          </button>

          {/* 3D Smart Balance Selector Dropdown */}
          {isAccountDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#0c1220]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_25px_rgba(255,255,255,0.03)] p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 select-none">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <span>Select Trading Balance</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  Instant Switch
                </span>
              </div>

              {/* DEMO ACCOUNT CARD (3D Amber) */}
              <div
                id="select-demo-account-card"
                onClick={() => {
                  sound.playClick();
                  onToggleAccountMode('DEMO');
                  setIsAccountDropdownOpen(false);
                }}
                className={`p-3 rounded-xl cursor-pointer transition-all border mb-2 relative overflow-hidden group ${
                  accountMode === 'DEMO'
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                    : 'bg-[#131929] hover:bg-[#182033] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs border border-amber-500/40 shadow-sm">
                      D
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <span>Demo Account</span>
                        {accountMode === 'DEMO' && (
                          <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">Practice risk-free</div>
                    </div>
                  </div>

                  {/* Reset Demo Button */}
                  <button
                    id="reset-demo-balance-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playWin();
                      onResetDemo();
                    }}
                    title="Reset to $10,000"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2 text-base sm:text-lg font-black font-mono text-amber-400">
                  ${demoBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* REAL LIVE ACCOUNT CARD (3D Emerald) */}
              <div
                id="select-real-account-card"
                onClick={() => {
                  sound.playClick();
                  onToggleAccountMode('LIVE');
                  setIsAccountDropdownOpen(false);
                }}
                className={`p-3 rounded-xl cursor-pointer transition-all border relative overflow-hidden group ${
                  accountMode === 'LIVE'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                    : 'bg-[#131929] hover:bg-[#182033] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/40 shadow-sm">
                      $
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <span>Real Account</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {accountMode === 'LIVE' && (
                          <span className="text-[9px] font-black bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">Binance Pay & Crypto</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      setIsAccountDropdownOpen(false);
                      onOpenDeposit();
                    }}
                    className="px-2 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-[10px] transition-colors border border-emerald-500/40 cursor-pointer"
                  >
                    Deposit +
                  </button>
                </div>

                <div className="mt-2 text-base sm:text-lg font-black font-mono text-emerald-400">
                  ${liveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Quick info note */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Min Trade: <strong>$0.50</strong></span>
                <span>Max Payout: <strong>98%</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell (Notice) */}
        <button
          id="header-notifications-btn"
          onClick={() => {
            sound.playClick();
            onOpenNotifications();
          }}
          className="relative p-1.5 sm:p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Announcements & Notices"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Deposit Button (Hidden on Mobile, Visible on Tablet & Desktop) */}
        <button
          id="header-deposit-btn"
          onClick={() => {
            sound.playClick();
            onOpenDeposit();
          }}
          className="hidden sm:flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer shrink-0"
          title="Instant Deposit via Binance Pay"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
          <span>Deposit</span>
        </button>

        {/* ========================================================================= */}
        {/* CORNER: 3D COLORFUL FUNCTION MENU DROPDOWN (MOBILE & WEB USER-FRIENDLY)  */}
        {/* ========================================================================= */}
        <div className="relative shrink-0" ref={navDropdownRef}>
          <button
            id="header-navigation-menu-bar-btn"
            onClick={() => {
              sound.playClick();
              setIsNavDropdownOpen(!isNavDropdownOpen);
            }}
            className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer border shadow-md active:scale-95 ${
              isNavDropdownOpen
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] font-black'
                : 'bg-gradient-to-r from-[#172034] via-[#1c273e] to-[#151f33] text-slate-100 border-slate-700/80 hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}
            title="All Functions Navigation Dropdown"
          >
            <Menu className="w-4 h-4 stroke-[2.5] text-amber-400" />
            <span className="font-extrabold text-xs tracking-wide">Menu</span>

            {/* Active trades badge */}
            {activeTradesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-sm">
                {activeTradesCount}
              </span>
            )}
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                isNavDropdownOpen ? 'rotate-180 text-slate-950' : 'text-slate-400'
              }`}
            />
          </button>

          {/* 3D COLORFUL FUNCTION NAVIGATION (FULL DISPLAY ON MOBILE, FLOATING DROPDOWN ON DESKTOP) */}
          {/* ========================================================================= */}
          {/* RIGHT SIDEBAR FUNCTION DRAWER WITH BLANK BODY BACKDROP OVERLAY             */}
          {/* ========================================================================= */}
          {isNavDropdownOpen && (
            <>
              {/* Full-Screen Blank Body Backdrop: Dims & Blurs Website, Click to Clear */}
              <div
                id="function-menu-backdrop"
                onClick={() => {
                  sound.playClick();
                  setIsNavDropdownOpen(false);
                }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md transition-all duration-300 cursor-pointer animate-in fade-in"
                title="Click anywhere on the blank body to close and return to website"
              />

              {/* Right Side Bar Function Drawer */}
              <aside
                id="function-menu-right-sidebar"
                className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] md:w-[470px] max-w-full bg-[#080d19] border-l border-white/10 shadow-[-25px_0_75px_rgba(0,0,0,0.95)] flex flex-col animate-in slide-in-from-right duration-300 select-none overflow-hidden"
              >
                {/* Drawer Top Navigation Bar */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#0c1220]/90 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Logo size="sm" />
                    <div>
                      <div className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                        <span>Platform Menu</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">CryptoBari Financial Terminal</div>
                    </div>
                  </div>

                  {/* Back to Website / Clear Button */}
                  <button
                    id="drawer-back-to-website-btn"
                    onClick={() => {
                      sound.playClick();
                      setIsNavDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-black transition-all cursor-pointer active:scale-95 shadow-md group"
                    title="Close Menu and Return to Website"
                  >
                    <span>Back / Clear</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>

                {/* Trader Profile Banner */}
                <div className="p-3.5 mx-4 mt-4 rounded-2xl bg-gradient-to-br from-[#151e33] to-[#0e1526] border border-slate-700/80 shadow-inner shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-lg ring-2 ring-amber-400/40 shrink-0">
                      <User className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                    </div>
                    <div className="truncate">
                      <div className="font-black text-sm text-white truncate flex items-center gap-2">
                        <span>{userName}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${tierInfo.badgeClass}`}>
                          {tierInfo.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-mono mt-0.5 flex items-center gap-2">
                        <span>UID: #79438</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-emerald-400 font-bold">Live: ${liveBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    id="dropdown-open-profile-btn"
                    onClick={() => {
                      sound.playClick();
                      setIsNavDropdownOpen(false);
                      onOpenProfile();
                    }}
                    className="px-3.5 py-1.5 text-xs font-black bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded-xl border border-amber-500/40 transition-all cursor-pointer shrink-0 shadow-sm active:scale-95"
                  >
                    Profile
                  </button>
                </div>

                {/* Scrollable Function Cards List (Smart Horizontal Gradient Styling) */}
                <div className="flex-1 p-4 space-y-2.5 overflow-y-auto custom-scrollbar">
                  {/* 1. Trade Terminal */}
                  <button
                    id="menu-func-trade"
                    onClick={() => {
                      sound.playClick();
                      if (onSelectTab) onSelectTab('trade');
                      setIsNavDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#f43f5e] via-[#e11d48] to-[#9333ea] text-white shadow-[0_6px_20px_rgba(244,63,94,0.35)] hover:shadow-[0_10px_28px_rgba(244,63,94,0.5)] hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                        <CandlestickChart className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white tracking-wide drop-shadow-sm flex items-center gap-1.5">
                          <span>Trade Terminal</span>
                          {currentTab === 'trade' && (
                            <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#fff] animate-pulse" />
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-white/90 mt-0.5">
                          Live & Practice Binary Trading
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeTradesCount > 0 ? (
                        <span className="w-6 h-6 rounded-full bg-white text-rose-600 font-black text-xs flex items-center justify-center shadow-md animate-pulse">
                          {activeTradesCount}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 text-white font-black text-[10px] tracking-wider uppercase shadow-sm">
                          Terminal
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                  </button>

                  {/* 2. Referral Program (HOT 20% Commission + $10 Bonus) */}
                  <button
                    id="menu-func-referral"
                    onClick={() => {
                      sound.playClick();
                      if (onSelectTab) onSelectTab('referral');
                      setIsNavDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#c2410c] text-white shadow-[0_6px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_10px_28px_rgba(245,158,11,0.5)] hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                        <Users className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white tracking-wide drop-shadow-sm flex items-center gap-1.5">
                          <span>Referral Partner</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-700 font-black text-[9px] tracking-wide shadow-sm">
                            HOT 20%
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-white/90 mt-0.5">
                          Earn 20% Commission • $10 Bonus
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 text-white font-black text-[10px] tracking-wider uppercase shadow-sm">
                        Earn
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                  </button>

                  {/* 3. Instant Deposit */}
                  <button
                    id="menu-func-deposit"
                    onClick={() => {
                      sound.playClick();
                      onOpenDeposit();
                      setIsNavDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#10b981] via-[#059669] to-[#0f766e] text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_10px_28px_rgba(16,185,129,0.5)] hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white tracking-wide drop-shadow-sm">
                          Instant Deposit
                        </div>
                        <div className="text-[11px] font-semibold text-white/90 mt-0.5">
                          Binance Pay • Bkash • Nagad • 0% Fee
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 text-white font-black text-[10px] tracking-wider uppercase shadow-sm">
                        Top Up
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                  </button>

                  {/* 4. Fast Withdrawal */}
                  <button
                    id="menu-func-withdrawal"
                    onClick={() => {
                      sound.playClick();
                      onOpenWithdrawal();
                      setIsNavDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#06b6d4] via-[#0284c7] to-[#2563eb] text-white shadow-[0_6px_20px_rgba(6,182,212,0.35)] hover:shadow-[0_10px_28px_rgba(6,182,212,0.5)] hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                        <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white tracking-wide drop-shadow-sm">
                          Fast Withdrawal
                        </div>
                        <div className="text-[11px] font-semibold text-white/90 mt-0.5">
                          Instant Payouts • Min $10 USD
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 text-white font-black text-[10px] tracking-wider uppercase shadow-sm">
                        Payout
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                  </button>

                  {/* 5. Markets Watchlist */}
                  <button
                    id="menu-func-markets"
                    onClick={() => {
                      sound.playClick();
                      if (onSelectTab) onSelectTab('markets');
                      setIsNavDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#4f46e5] text-white shadow-[0_6px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_10px_28px_rgba(139,92,246,0.5)] hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                        <BarChart3 className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white tracking-wide drop-shadow-sm">
                          Markets Watchlist
                        </div>
                        <div className="text-[11px] font-semibold text-white/90 mt-0.5">
                          100% Live Binance Spot Crypto
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 text-white font-black text-[10px] tracking-wider uppercase shadow-sm">
                        Stream
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                  </button>

                  {/* 6. Trading History */}
                  <button
                    id="menu-func-history"
                    onClick={() => {
                      sound.playClick();
                      if (onSelectTab) onSelectTab('history');
                      setIsNavDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] text-white shadow-[0_6px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_10px_28px_rgba(59,130,246,0.5)] hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                        <History className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white tracking-wide drop-shadow-sm">
                          Trading History
                        </div>
                        <div className="text-[11px] font-semibold text-white/90 mt-0.5">
                          Past Orders, Win Rates & Analytics
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 text-white font-black text-[10px] tracking-wider uppercase shadow-sm">
                        Records
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                  </button>

                  {/* 7. Wallet & Balances */}
                  <button
                    id="menu-func-wallet"
                    onClick={() => {
                      sound.playClick();
                      if (onSelectTab) onSelectTab('wallet');
                      setIsNavDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#14b8a6] via-[#0d9488] to-[#0369a1] text-white shadow-[0_6px_20px_rgba(20,184,166,0.35)] hover:shadow-[0_10px_28px_rgba(20,184,166,0.5)] hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                        <Wallet className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white tracking-wide drop-shadow-sm">
                          Wallet & Balances
                        </div>
                        <div className="text-[11px] font-semibold text-white/90 mt-0.5">
                          Live: ${liveBalance.toFixed(2)} • Demo: ${demoBalance.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 text-white font-black text-[10px] tracking-wider uppercase shadow-sm">
                        Wallet
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                  </button>

                  {/* 8. Announcements & Notices */}
                  <button
                    id="menu-func-notices"
                    onClick={() => {
                      sound.playClick();
                      onOpenNotifications();
                      setIsNavDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#fb923c] via-[#f97316] to-[#dc2626] text-white shadow-[0_6px_20px_rgba(251,146,60,0.35)] hover:shadow-[0_10px_28px_rgba(251,146,60,0.5)] hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                        <Bell className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white tracking-wide drop-shadow-sm flex items-center gap-1.5">
                          <span>Official Notices</span>
                          {unreadNotificationsCount > 0 && (
                            <span className="px-1.5 py-0.2 bg-white text-orange-600 rounded-full font-black text-[10px]">
                              {unreadNotificationsCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-white/90 mt-0.5">
                          Platform News, Promos & Security
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 text-white font-black text-[10px] tracking-wider uppercase shadow-sm">
                        News
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                  </button>

                  {/* 9. 24/7 Live Support */}
                  <button
                    id="menu-func-support"
                    onClick={() => {
                      sound.playClick();
                      if (onSelectTab) onSelectTab('support');
                      setIsNavDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#d946ef] via-[#c026d3] to-[#9333ea] text-white shadow-[0_6px_20px_rgba(217,70,239,0.35)] hover:shadow-[0_10px_28px_rgba(217,70,239,0.5)] hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                        <LifeBuoy className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white tracking-wide drop-shadow-sm">
                          24/7 Live Support
                        </div>
                        <div className="text-[11px] font-semibold text-white/90 mt-0.5">
                          Customer Care • Help Desk • FAQ
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 text-white font-black text-[10px] tracking-wider uppercase shadow-sm">
                        Online
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                  </button>

                  {/* 10. Sign Out */}
                  <button
                    id="menu-func-logout"
                    onClick={() => {
                      sound.playLose();
                      setIsNavDropdownOpen(false);
                      if (onLogout) {
                        onLogout();
                      } else if (onSelectTab) {
                        onSelectTab('landing');
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-[#1c1424] to-[#121018] hover:border-rose-500/70 text-rose-300 transition-all cursor-pointer mt-2 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-sm shrink-0">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black text-white">Sign Out</div>
                        <div className="text-[11px] text-rose-400/80 font-medium">Exit trader session safely</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-rose-300 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-xl uppercase tracking-wider">
                      Exit
                    </span>
                  </button>
                </div>

                {/* Bottom Drawer Quick Actions & Status */}
                <div className="p-4 border-t border-white/10 bg-[#0c1220]/90 shrink-0">
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        onResetDemo();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-white/5 hover:border-amber-500/30 cursor-pointer transition-all active:scale-95 font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Demo $10k</span>
                    </button>

                    <button
                      onClick={handleToggleSound}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 cursor-pointer transition-all active:scale-95 font-bold"
                    >
                      {isSoundOn ? (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{isSoundOn ? 'Sound On' : 'Muted'}</span>
                    </button>
                  </div>

                  <div className="text-center text-[10px] text-slate-500 font-mono">
                    256-Bit SSL Encrypted Financial Trading • CryptoBari v2.4
                  </div>
                </div>
              </aside>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
