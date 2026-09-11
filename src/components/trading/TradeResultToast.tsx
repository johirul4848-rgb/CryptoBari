import React, { useEffect, useRef } from 'react';
import { Trade } from '../../types';
import { X } from 'lucide-react';
import { AssetIcon } from './AssetIcon';

interface TradeResultToastProps {
  trade: Trade;
  onDismiss: () => void;
}

export const TradeResultToast: React.FC<TradeResultToastProps> = ({ trade, onDismiss }) => {
  const isWin = trade.result === 'WIN';
  const isTie = trade.result === 'TIE';

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Automatically dismiss after exactly 2 seconds without cross button click
  // The empty dependency array guarantees that parent re-renders do not cancel the timer!
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismissRef.current();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const formatDuration = (secs?: number) => {
    if (!secs) return '01:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const cleanPairName = trade.displayPair.replace(/\s*\(OTC\)/gi, '');
  const formattedDuration = formatDuration(trade.durationSeconds);

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 select-none">
      <div className="w-64 bg-[#161c28]/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* 2-second auto-dismiss visual progress bar */}
        <div
          className={`absolute bottom-0 left-0 h-1 transition-all duration-[2000ms] ease-linear w-full ${
            isWin ? 'bg-emerald-400' : isTie ? 'bg-amber-400' : 'bg-rose-500'
          }`}
          style={{
            animation: 'shrinkWidth 2s linear forwards',
          }}
        />

        {/* Top line: Coin + Flag, Name · Duration, Close Button */}
        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <AssetIcon symbol={trade.symbol} size="sm" showFlag={true} />
            <span className="font-bold text-xs text-slate-100 truncate max-w-[130px]">
              {cleanPairName}
            </span>
            <span className="text-[11px] text-slate-400 shrink-0 font-mono">· {formattedDuration}</span>
          </div>

          <button
            id="close-result-toast-btn"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-100 p-0.5 rounded cursor-pointer transition-colors"
            title="Dismiss now"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Payout Result: Red for loss (0.00 $), Green for win (+1.92 $) */}
        <div className="mt-2 flex items-baseline justify-between">
          <span
            className={`font-mono font-black text-2xl tracking-tight ${
              isWin
                ? 'text-emerald-400'
                : isTie
                ? 'text-amber-400'
                : 'text-rose-500'
            }`}
          >
            {isWin ? (
              `+${(trade.investment + (trade.profit || 0)).toFixed(2)} $`
            ) : isTie ? (
              `${trade.investment.toFixed(2)} $`
            ) : (
              '0.00 $'
            )}
          </span>

          <span
            className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
              isWin
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isTie
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isWin ? 'PROFIT' : isTie ? 'TIE' : 'LOST'}
          </span>
        </div>
      </div>
    </div>
  );
};
