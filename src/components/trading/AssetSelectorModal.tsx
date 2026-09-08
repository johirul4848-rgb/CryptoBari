import React, { useState, useMemo } from 'react';
import { MarketSymbol } from '../../types';
import { Search, Star, X, TrendingUp, TrendingDown, Flame, ArrowUpDown } from 'lucide-react';
import { sound } from '../../utils/audio';
import { formatPriceByPrecision } from '../../services/binanceMarketData';

interface AssetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbols: MarketSymbol[];
  activeSymbol: MarketSymbol;
  onSelectSymbol: (symbol: MarketSymbol) => void;
  onToggleFavorite: (symbolCode: string) => void;
  favorites: string[];
}

export const AssetSelectorModal: React.FC<AssetSelectorModalProps> = ({
  isOpen,
  onClose,
  symbols,
  activeSymbol,
  onSelectSymbol,
  onToggleFavorite,
  favorites,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'favorites' | 'usdt' | 'gainers' | 'losers' | 'volume'>('all');
  const [sortBy, setSortBy] = useState<'payout' | 'volume' | 'change' | 'name'>('payout');

  const categories = [
    { id: 'all', label: 'All Assets' },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'usdt', label: 'USDT Pairs' },
    { id: 'gainers', label: 'Top Gainers' },
    { id: 'losers', label: 'Top Losers' },
    { id: 'volume', label: 'High Volume', icon: Flame },
  ];

  const filteredSymbols = useMemo(() => {
    let list = [...symbols];

    // Category filter
    if (activeCategory === 'favorites') {
      list = list.filter(s => favorites.includes(s.symbol));
    } else if (activeCategory === 'usdt') {
      list = list.filter(s => s.quoteAsset === 'USDT');
    } else if (activeCategory === 'gainers') {
      list = list.filter(s => s.priceChangePercent > 0).sort((a, b) => b.priceChangePercent - a.priceChangePercent);
    } else if (activeCategory === 'losers') {
      list = list.filter(s => s.priceChangePercent < 0).sort((a, b) => a.priceChangePercent - b.priceChangePercent);
    } else if (activeCategory === 'volume') {
      list = list.sort((a, b) => b.quoteVolume24h - a.quoteVolume24h);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s =>
        s.symbol.toLowerCase().includes(q) ||
        s.baseAsset.toLowerCase().includes(q) ||
        s.displayPair.toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortBy === 'payout') {
      list.sort((a, b) => b.payoutRate - a.payoutRate);
    } else if (sortBy === 'volume') {
      list.sort((a, b) => b.quoteVolume24h - a.quoteVolume24h);
    } else if (sortBy === 'change') {
      list.sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.displayPair.localeCompare(b.displayPair));
    }

    return list;
  }, [symbols, searchQuery, activeCategory, favorites, sortBy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#111724] border border-slate-700/80 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#151c2c]">
          <div>
            <h2 className="text-base font-extrabold text-slate-100 tracking-tight">Select Asset to Trade</h2>
            <p className="text-xs text-slate-400 mt-0.5">Live real-time streaming from Binance Spot</p>
          </div>

          <button
            id="close-asset-selector-modal"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="px-5 pt-3.5 pb-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              id="asset-search-input"
              type="text"
              autoFocus
              placeholder="Search assets by symbol (e.g. BTC, ETH, SOL, DOGE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#182234] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 px-5 py-2 overflow-x-auto no-scrollbar border-b border-slate-800/80 text-xs">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                id={`cat-btn-${cat.id}`}
                onClick={() => {
                  sound.playClick();
                  setActiveCategory(cat.id as typeof activeCategory);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-[#182133] text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort header */}
        <div className="flex items-center justify-between px-5 py-2 text-[11px] font-semibold text-slate-400 bg-slate-900/40 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <span>Asset / Symbol</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSortBy(sortBy === 'payout' ? 'volume' : 'payout')}
              className="flex items-center gap-1 hover:text-slate-200 cursor-pointer"
            >
              <span>Payout</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <span>24h Change</span>
            <span className="w-20 text-right">Price</span>
          </div>
        </div>

        {/* Assets List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar p-2">
          {filteredSymbols.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No trading pairs found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredSymbols.map(sym => {
              const isSelected = sym.symbol === activeSymbol.symbol;
              const isFav = favorites.includes(sym.symbol);
              const isUp = sym.priceChangePercent >= 0;

              return (
                <div
                  key={sym.symbol}
                  id={`select-symbol-${sym.symbol}`}
                  onClick={() => {
                    sound.playClick();
                    onSelectSymbol(sym);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/30'
                      : 'hover:bg-[#182133] border border-transparent'
                  }`}
                >
                  {/* Left: Star + Icon + Pair */}
                  <div className="flex items-center gap-3">
                    <button
                      id={`fav-toggle-${sym.symbol}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick();
                        onToggleFavorite(sym.symbol);
                      }}
                      className="p-1 text-slate-600 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-amber-400 shrink-0">
                      {sym.baseAsset.slice(0, 3)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-100">{sym.displayPair}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                          SPOT
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Vol: ${(sym.quoteVolume24h / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  </div>

                  {/* Right: Payout + Change + Price */}
                  <div className="flex items-center gap-6 text-right">
                    <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold text-xs">
                      {sym.payoutRate}%
                    </div>

                    <div className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{isUp ? `+${sym.priceChangePercent.toFixed(2)}%` : `${sym.priceChangePercent.toFixed(2)}%`}</span>
                    </div>

                    <div className="w-20 font-mono font-bold text-sm text-slate-100">
                      ${formatPriceByPrecision(sym.price, sym.pricePrecision || 2)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
