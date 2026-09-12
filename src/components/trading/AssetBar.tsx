import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MarketSymbol } from '../../types';
import { Plus, X, TrendingUp, TrendingDown, ChevronDown, Search, Star, Flame, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';
import { formatPriceByPrecision } from '../../services/binanceMarketData';
import { AssetIcon } from './AssetIcon';

interface AssetBarProps {
  activeSymbol: MarketSymbol;
  openTabs: MarketSymbol[];
  onSelectSymbol: (symbol: MarketSymbol) => void;
  onCloseTab: (symbolCode: string) => void;
  onOpenSelector: () => void;
  allSymbols?: MarketSymbol[];
}

export const AssetBar: React.FC<AssetBarProps> = ({
  activeSymbol,
  openTabs,
  onSelectSymbol,
  onCloseTab,
  onOpenSelector,
  allSymbols = [],
}) => {
  const [isQuickPickerOpen, setIsQuickPickerOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'high_payout' | 'majors' | 'memes'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsQuickPickerOpen(false);
      }
    };
    if (isQuickPickerOpen) {
      document.addEventListener('mousedown', handleDocClick);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [isQuickPickerOpen]);

  // Filtered symbols for the modern quick selector dropdown
  const quickFilteredSymbols = useMemo(() => {
    const source = allSymbols.length > 0 ? allSymbols : openTabs;
    let list = [...source];

    if (quickFilter === 'high_payout') {
      list = list.filter((s) => (s.payoutRate || 85) >= 90);
    } else if (quickFilter === 'majors') {
      list = list.filter((s) => ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'LTCUSDT', 'BCHUSDT', 'ETCUSDT', 'PAXGUSDT'].includes(s.symbol));
    } else if (quickFilter === 'memes') {
      list = list.filter((s) => ['DOGEUSDT', 'PEPEUSDT', 'SHIBUSDT', 'WIFUSDT', 'BONKUSDT', 'FLOKIUSDT'].includes(s.symbol));
    }

    if (quickSearch.trim()) {
      const q = quickSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.displayPair.toLowerCase().includes(q) ||
          s.baseAsset.toLowerCase().includes(q)
      );
    }

    // Sort by payout rate descending
    return list.sort((a, b) => (b.payoutRate || 0) - (a.payoutRate || 0));
  }, [allSymbols, openTabs, quickFilter, quickSearch]);

  const handlePickSymbol = (sym: MarketSymbol) => {
    sound.playClick();
    onSelectSymbol(sym);
    setIsQuickPickerOpen(false);
    setQuickSearch('');
  };

  return (
    <div
      ref={dropdownRef}
      className="relative z-40 bg-[#0c101a] border-b border-slate-800/80 px-2 py-1 select-none flex items-center justify-between gap-1.5 shrink-0"
    >
      {/* Left section: Fast Modern Pair Selector + Add Button + Open Tabs */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {/* Modern Quick Pair Select Button (Mobile & Desktop Friendly) */}
        <div className="relative shrink-0">
          <button
            id="open-quick-pair-picker-btn"
            onClick={() => {
              sound.playClick();
              setIsQuickPickerOpen(!isQuickPickerOpen);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black transition-all cursor-pointer border ${
              isQuickPickerOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-[#182030] hover:bg-[#1e283d] text-slate-100 border-slate-700/80'
            }`}
            title="Click to select from all pairs (highest return % first)"
          >
            <AssetIcon symbol={activeSymbol.symbol} size="sm" showFlag={true} />
            <span className="truncate max-w-[95px] sm:max-w-[130px] font-extrabold tracking-tight">
              {activeSymbol.displayPair}
            </span>
            <span
              className={`px-1 py-0.2 rounded text-[10px] font-black ${
                isQuickPickerOpen
                  ? 'bg-slate-950 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {activeSymbol.payoutRate}%
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                isQuickPickerOpen ? 'rotate-180 text-slate-950' : 'text-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Plus button to open full Asset Selector Modal */}
        <button
          id="open-asset-selector-btn"
          onClick={() => {
            sound.playClick();
            onOpenSelector();
          }}
          title="Add New Trading Pair (+)"
          className="flex items-center justify-center w-7 h-7 rounded bg-[#1e2738] hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-slate-700/80 transition-all shadow-sm shrink-0 cursor-pointer group active:scale-95"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
        </button>

        {/* Open Tabs list (Compact, Responsive, and Clean Horizontal Scroll) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {openTabs.map((tab) => {
            const isActive = tab.symbol === activeSymbol.symbol;
            const isUp = tab.priceChangePercent >= 0;

            return (
              <div
                key={tab.symbol}
                id={`asset-tab-${tab.symbol}`}
                onClick={() => {
                  sound.playClick();
                  if (isActive) {
                    // Clicking the active pair tab opens the all-pairs dropdown selector!
                    setIsQuickPickerOpen((prev) => !prev);
                  } else {
                    onSelectSymbol(tab);
                  }
                }}
                className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all shrink-0 border ${
                  isActive
                    ? 'bg-[#182234] text-white border-slate-700 shadow-sm'
                    : 'bg-[#121724]/70 text-slate-400 hover:text-slate-200 hover:bg-[#161d2d] border-transparent'
                }`}
                title={isActive ? "Click to change trading pair" : `Switch to ${tab.displayPair}`}
              >
                <span className="font-bold tracking-tight text-slate-200 text-xs">
                  {tab.displayPair.replace('USDT', '')}
                </span>

                <span className="px-1.5 py-0.2 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-black text-[10px] leading-none">
                  +{tab.payoutRate}%
                </span>

                {/* Close tab button */}
                {openTabs.length > 1 && (
                  <button
                    id={`close-tab-${tab.symbol}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      onCloseTab(tab.symbol);
                    }}
                    className="p-0.5 rounded-full text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Close Tab"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}

                {/* Active Tab bottom indicator bar */}
                {isActive && (
                  <div className="absolute bottom-0 left-1.5 right-1.5 h-[2px] bg-amber-400 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating All-Pairs Dropdown (Anchored Outside Tab Scroller to Prevent Overflow Clipping) */}
      {isQuickPickerOpen && (
        <>
          {/* Mobile backdrop to dismiss cleanly on touch */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
            onClick={() => setIsQuickPickerOpen(false)}
          />

          <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-x-auto sm:left-2 sm:top-full sm:mt-1.5 w-auto sm:w-88 max-h-[75vh] flex flex-col bg-[#0f1422]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.15)] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Header */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pairs (e.g. BTC, ETH, EUR)..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full bg-[#161c2b] border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Quick Filter Chips & High-Return Label */}
            <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-slate-800/80 text-[10px] font-bold">
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'All Crypto' },
                  { id: 'high_payout', label: '90%+ Return', icon: Sparkles },
                  { id: 'majors', label: 'Majors' },
                  { id: 'memes', label: 'Meme Coins' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => {
                      sound.playClick();
                      setQuickFilter(chip.id as typeof quickFilter);
                    }}
                    className={`px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                      quickFilter === chip.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-amber-400/90 font-mono font-bold hidden sm:inline">
                Highest Return First
              </span>
            </div>

            {/* Pair List - Sorted by Return % (PayoutRate Descending) */}
            <div className="flex-1 overflow-y-auto max-h-64 space-y-1 custom-scrollbar pr-1">
              {quickFilteredSymbols.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">No matching pairs found</div>
              ) : (
                quickFilteredSymbols.map((s) => {
                  const isSelected = s.symbol === activeSymbol.symbol;
                  const isUp = s.priceChangePercent >= 0;

                  return (
                    <div
                      key={s.symbol}
                      onClick={() => handlePickSymbol(s)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border border-amber-500/40 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AssetIcon symbol={s.symbol} size="sm" showFlag={true} />
                        <div className="flex flex-col truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-100 truncate">
                              {s.displayPair}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-black leading-none flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                              LIVE
                            </span>
                            {s.payoutRate >= 90 && (
                              <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black leading-none">
                                TOP
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            ${formatPriceByPrecision(s.price, s.pricePrecision || 2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono text-[10px] ${
                            isUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isUp ? `+${s.priceChangePercent.toFixed(1)}%` : `${s.priceChangePercent.toFixed(1)}%`}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-red-500/15 text-red-400 font-black text-xs font-mono border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.25)]">
                          +{s.payoutRate}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* View All Modal Footer Link */}
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-[10px] text-slate-400 font-medium">
                {quickFilteredSymbols.length} pairs available
              </span>
              <button
                onClick={() => {
                  setIsQuickPickerOpen(false);
                  onOpenSelector();
                }}
                className="font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1"
              >
                <span>Full Asset Market</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
