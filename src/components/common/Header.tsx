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

        {/* Deposit Button (Bright Green 3D) */}
        <button
          id="header-deposit-btn"
          onClick={() => {
            sound.playClick();
            onOpenDeposit();
          }}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer shrink-0"
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

          {/* 3D COLORFUL FUNCTION NAVIGATION DROPDOWN */}
          {isNavDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-h-[85vh] overflow-y-auto custom-scrollbar bg-[#0b101c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.95),0_0_30px_rgba(255,255,255,0.03)] p-3 z-50 animate-in fade-in slide-in-from-top-3 duration-200 select-none">
              {/* User Profile Mini Header */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#161f33] to-[#121929] border border-slate-700/80 shadow-inner mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-200 text-slate-950 flex items-center justify-center font-black shadow-md ring-2 ring-amber-400/40">
                    <User className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  </div>
                  <div className="truncate">
                    <div className="font-extrabold text-xs text-white truncate flex items-center gap-1.5">
                      <span>{userName}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] ${tierInfo.badgeClass}`}>
                        {tierInfo.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">UID: #79438 • Live: ${liveBalance.toFixed(2)}</div>
                  </div>
                </div>

                <button
                  id="dropdown-open-profile-btn"
                  onClick={() => {
                    sound.playClick();
                    setIsNavDropdownOpen(false);
                    onOpenProfile();
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded-lg border border-amber-500/40 transition-all cursor-pointer"
                >
                  Profile
                </button>
              </div>

              {/* Navigation Section Title */}
              <div className="text-[10px] uppercase font-black text-slate-400 px-1 mb-2 tracking-wider flex items-center justify-between">
                <span>Functions Menu</span>
                <span className="text-emerald-400 text-[9px] font-mono">Instant Access</span>
              </div>

              {/* 3D Colorful Exact Function Items */}
              <div className="space-y-1.5">
                {/* 1. Deposit */}
                <button
                  id="menu-func-deposit"
                  onClick={() => {
                    sound.playClick();
                    setIsNavDropdownOpen(false);
                    onOpenDeposit();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 to-teal-600/10 hover:from-emerald-500/30 hover:to-teal-600/20 text-white transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/25 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm">
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black text-emerald-400">Deposit</div>
                      <div className="text-[10px] text-slate-400">Add funds to Live Wallet</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-950 bg-emerald-400 px-2 py-0.5 rounded-md shadow">
                    Top Up
                  </span>
                </button>

                {/* 2. Withdrawal */}
                <button
                  id="menu-func-withdrawal"
                  onClick={() => {
                    sound.playClick();
                    setIsNavDropdownOpen(false);
                    onOpenWithdrawal();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-yellow-600/10 hover:from-amber-500/25 hover:to-yellow-600/20 text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                      <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black text-amber-300">Withdrawal</div>
                      <div className="text-[10px] text-slate-400">Binance Pay • Min $10 USD</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                    Payout
                  </span>
                </button>

                {/* 3. Trade Terminal */}
                <button
                  id="menu-func-trade"
                  onClick={() => {
                    sound.playClick();
                    if (onSelectTab) onSelectTab('trade');
                    setIsNavDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    currentTab === 'trade'
                      ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/15 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'bg-[#141b2a] hover:bg-cyan-500/10 border-slate-800 hover:border-cyan-500/30 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
                      <CandlestickChart className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Trade Terminal</div>
                      <div className="text-[10px] text-slate-400">Live candlestick charts</div>
                    </div>
                  </div>
                  {activeTradesCount > 0 ? (
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center animate-pulse">
                      {activeTradesCount}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/15 px-1.5 py-0.5 rounded">
                      Live
                    </span>
                  )}
                </button>

                {/* 4. Markets Watchlist */}
                <button
                  id="menu-func-markets"
                  onClick={() => {
                    sound.playClick();
                    if (onSelectTab) onSelectTab('markets');
                    setIsNavDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    currentTab === 'markets'
                      ? 'bg-gradient-to-r from-sky-500/25 to-blue-600/15 border-sky-400/60 shadow-[0_0_20px_rgba(14,165,233,0.3)]'
                      : 'bg-[#141b2a] hover:bg-sky-500/10 border-slate-800 hover:border-sky-500/30 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-sm">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Markets Watchlist</div>
                      <div className="text-[10px] text-slate-400">Binance Spot tickers</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/15 px-1.5 py-0.5 rounded">
                    Stream
                  </span>
                </button>

                {/* 5. Trading History */}
                <button
                  id="menu-func-history"
                  onClick={() => {
                    sound.playClick();
                    if (onSelectTab) onSelectTab('history');
                    setIsNavDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    currentTab === 'history'
                      ? 'bg-gradient-to-r from-purple-500/25 to-indigo-600/15 border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'bg-[#141b2a] hover:bg-purple-500/10 border-slate-800 hover:border-purple-500/30 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-sm">
                      <History className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Trading History</div>
                      <div className="text-[10px] text-slate-400">Settled orders & profits</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded">
                    History
                  </span>
                </button>

                {/* 6. Wallet Overview */}
                <button
                  id="menu-func-wallet"
                  onClick={() => {
                    sound.playClick();
                    if (onSelectTab) onSelectTab('wallet');
                    setIsNavDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    currentTab === 'wallet'
                      ? 'bg-gradient-to-r from-emerald-500/25 to-teal-600/15 border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'bg-[#141b2a] hover:bg-emerald-500/10 border-slate-800 hover:border-emerald-500/30 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Wallet & Balances</div>
                      <div className="text-[10px] text-slate-400">Live & Demo balances</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                    Wallet
                  </span>
                </button>

                {/* 7. Official Announcements & Notices */}
                <button
                  id="menu-func-notices"
                  onClick={() => {
                    sound.playClick();
                    setIsNavDropdownOpen(false);
                    onOpenNotifications();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 to-blue-600/10 hover:from-cyan-500/25 hover:to-blue-600/20 text-slate-200 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Announcements & Notices</div>
                      <div className="text-[10px] text-slate-400">Official broker updates & promos</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded">
                    Live
                  </span>
                </button>

                {/* 7. Support 24/7 */}
                <button
                  id="menu-func-support"
                  onClick={() => {
                    sound.playClick();
                    if (onSelectTab) onSelectTab('support');
                    setIsNavDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    currentTab === 'support'
                      ? 'bg-gradient-to-r from-teal-500/25 to-emerald-600/15 border-teal-400/60 shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                      : 'bg-[#141b2a] hover:bg-teal-500/10 border-slate-800 hover:border-teal-500/30 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-sm">
                      <LifeBuoy className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Support 24/7</div>
                      <div className="text-[10px] text-slate-400">Live chat & help desk</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-teal-400 bg-teal-500/15 px-1.5 py-0.5 rounded">
                    24/7
                  </span>
                </button>

                {/* 7. Sign Out */}
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
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-500/15 to-rose-600/10 hover:from-rose-500/25 hover:to-rose-600/20 text-rose-300 transition-all cursor-pointer mt-1"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-sm">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Sign Out</div>
                      <div className="text-[10px] text-rose-400/80">Exit trader session</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                    Exit
                  </span>
                </button>
              </div>

              {/* Bottom Quick Tools */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <button
                  onClick={() => {
                    sound.playClick();
                    onResetDemo();
                  }}
                  className="flex items-center gap-1 hover:text-amber-400 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Demo $10k</span>
                </button>

                <button
                  onClick={handleToggleSound}
                  className="flex items-center gap-1 hover:text-slate-200 cursor-pointer transition-colors"
                >
                  {isSoundOn ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{isSoundOn ? 'Sound On' : 'Muted'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
