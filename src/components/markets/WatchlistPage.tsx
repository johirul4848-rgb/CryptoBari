import React, { useState } from 'react';
import { MarketSymbol } from '../../types';
import { Search, TrendingUp, TrendingDown, Star, ArrowRight } from 'lucide-react';
import { sound } from '../../utils/audio';

interface WatchlistPageProps {
  symbols: MarketSymbol[];
  favorites: string[];
  onToggleFavorite: (symbol: string) => void;
  onTradePair: (symbol: MarketSymbol) => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  symbols,
  favorites,
  onToggleFavorite,
  onTradePair,
}) => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'favorites' | 'usdt'>('all');

  const list = symbols.filter(s => {
    if (tab === 'favorites' && !favorites.includes(s.symbol)) return false;
    if (tab === 'usdt' && s.quoteAsset !== 'USDT') return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.symbol.toLowerCase().includes(q) ||
        s.baseAsset.toLowerCase().includes(q) ||
        s.displayPair.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0c1018] text-slate-100 custom-scrollbar select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100">Binance Live Markets</h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time prices, 24-hour high/low, and binary options payout rates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search market pairs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#182234] border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {(['all', 'favorites', 'usdt'] as const).map(t => (
            <button
              key={t}
              onClick={() => {
                sound.playClick();
                setTab(t);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                tab === t ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-[#151c2c] text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'all' ? 'All Pairs' : t === 'favorites' ? '⭐ Favorites' : 'USDT Spot'}
            </button>
          ))}
        </div>

        {/* Markets Table */}
        <div className="bg-[#111624] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151c2c] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 w-10"></th>
                  <th className="px-4 py-3.5">Asset</th>
                  <th className="px-4 py-3.5 text-right">Price</th>
                  <th className="px-4 py-3.5 text-right">24h Change</th>
                  <th className="px-4 py-3.5 text-right">24h High</th>
                  <th className="px-4 py-3.5 text-right">24h Low</th>
                  <th className="px-4 py-3.5 text-right">24h Volume</th>
                  <th className="px-4 py-3.5 text-center">Payout</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {list.map(sym => {
                  const isUp = sym.priceChangePercent >= 0;
                  const isFav = favorites.includes(sym.symbol);

                  return (
                    <tr
                      key={sym.symbol}
                      className="hover:bg-[#161d2d] transition-colors group cursor-pointer"
                      onClick={() => {
                        sound.playClick();
                        onTradePair(sym);
                      }}
                    >
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            sound.playClick();
                            onToggleFavorite(sym.symbol);
                          }}
                          className="text-slate-600 hover:text-amber-400 cursor-pointer"
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>

                      <td className="px-4 py-3.5 font-sans font-extrabold text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-amber-400 border border-slate-700">
                            {sym.baseAsset.slice(0, 3)}
                          </div>
                          <div>
                            <div>{sym.displayPair}</div>
                            <div className="text-[10px] font-normal text-slate-400 font-mono">Binance Spot</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-slate-100">
                        ${sym.price.toLocaleString(undefined, {
                          minimumFractionDigits: sym.pricePrecision,
                          maximumFractionDigits: sym.pricePrecision,
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            isUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {isUp ? `+${sym.priceChangePercent.toFixed(2)}%` : `${sym.priceChangePercent.toFixed(2)}%`}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right text-slate-300">
                        ${sym.high24h.toLocaleString(undefined, { minimumFractionDigits: sym.pricePrecision })}
                      </td>

                      <td className="px-4 py-3.5 text-right text-slate-300">
                        ${sym.low24h.toLocaleString(undefined, { minimumFractionDigits: sym.pricePrecision })}
                      </td>

                      <td className="px-4 py-3.5 text-right text-slate-400 font-sans">
                        ${(sym.quoteVolume24h / 1000000).toFixed(2)}M
                      </td>

                      <td className="px-4 py-3.5 text-center font-sans">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black text-xs">
                          {sym.payoutRate}%
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playClick();
                            onTradePair(sym);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
                        >
                          <span>Trade</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
