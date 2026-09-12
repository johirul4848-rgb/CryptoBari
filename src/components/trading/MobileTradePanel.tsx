import React, { useState, useEffect } from 'react';
import { MarketSymbol, Trade } from '../../types';
import { Minus, Plus, ArrowUp, ArrowDown, Clock, DollarSign } from 'lucide-react';
import { sound } from '../../utils/audio';

interface MobileTradePanelProps {
  symbol: MarketSymbol;
  currentPrice: number;
  availableBalance: number;
  accountMode: 'DEMO' | 'LIVE';
  activeTrades: Trade[];
  isPlacingTrade: boolean;
  onPlaceTrade: (params: {
    direction: 'UP' | 'DOWN';
    investment: number;
    durationSeconds: number;
  }) => void;
}

export const MobileTradePanel: React.FC<MobileTradePanelProps> = ({
  symbol,
  availableBalance,
  accountMode,
  isPlacingTrade,
  onPlaceTrade,
}) => {
  const [timeMode, setTimeMode] = useState<'DURATION' | 'RUNNING_CANDLE'>('DURATION');
  const [durationSeconds, setDurationSeconds] = useState<number>(60);
  const [investment, setInvestment] = useState<number>(10);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(Date.now());

  // Real-time second ticker for candle rules
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date(currentTimeTick);
  const currentSeconds = now.getSeconds();
  const secondsRemainingInMinute = 60 - currentSeconds;
  const canTradeCurrentCandle = secondsRemainingInMinute >= 30;
  const effectiveExpirySecs = canTradeCurrentCandle
    ? secondsRemainingInMinute
    : secondsRemainingInMinute + 60;

  const payoutRate = symbol.payoutRate || 85;
  const potentialProfit = (investment * payoutRate) / 100;
  const potentialReturn = investment + potentialProfit;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStepDuration = (direction: 'up' | 'down') => {
    sound.playClick();
    setDurationSeconds((prev) => {
      if (direction === 'down') {
        if (prev <= 15) return Math.max(5, prev - 5);
        if (prev <= 60) return Math.max(15, prev - 15);
        if (prev <= 180) return Math.max(60, prev - 30);
        return Math.max(60, prev - 60);
      } else {
        if (prev < 15) return 15;
        if (prev < 60) return prev + 15;
        if (prev < 180) return prev + 30;
        return Math.min(3600, prev + 60);
      }
    });
  };

  const handleExecuteTrade = (direction: 'UP' | 'DOWN') => {
    setErrorMsg(null);
    if (investment > availableBalance) {
      setErrorMsg(`Insufficient ${accountMode.toLowerCase()} balance`);
      sound.playLoss();
      return;
    }

    const tradeDuration = timeMode === 'RUNNING_CANDLE' ? effectiveExpirySecs : durationSeconds;

    sound.playTradePlaced(direction);
    onPlaceTrade({
      direction,
      investment,
      durationSeconds: tradeDuration,
    });
  };

  return (
    <div className="lg:hidden w-full bg-[#0d121c] border-t border-slate-800/90 p-3 select-none shrink-0 z-20">
      {/* Controls row: Expiry and Investment side by side */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Expiry Selector Card */}
        <div className="bg-[#151b29] p-2 rounded-xl border border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
            <span className="flex items-center gap-1 uppercase">
              <Clock className="w-3 h-3 text-sky-400" />
              {timeMode === 'DURATION' ? 'Time' : 'Running'}
            </span>
            <button
              onClick={() => {
                sound.playClick();
                setTimeMode(timeMode === 'DURATION' ? 'RUNNING_CANDLE' : 'DURATION');
              }}
              className="text-[9px] font-extrabold text-sky-400 hover:text-sky-300 uppercase underline cursor-pointer"
            >
              {timeMode === 'DURATION' ? 'Switch Candle' : 'Switch Time'}
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-900/90 rounded-lg border border-slate-800 p-0.5">
            <button
              id="mobile-time-minus"
              onClick={() => handleStepDuration('down')}
              disabled={timeMode === 'RUNNING_CANDLE'}
              className={`w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-200 cursor-pointer ${
                timeMode === 'RUNNING_CANDLE' ? 'opacity-40 cursor-not-allowed' : 'active:bg-slate-700'
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-xs text-slate-100">
              {timeMode === 'DURATION' ? formatTime(durationSeconds) : formatTime(effectiveExpirySecs)}
            </span>
            <button
              id="mobile-time-plus"
              onClick={() => handleStepDuration('up')}
              disabled={timeMode === 'RUNNING_CANDLE'}
              className={`w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-200 cursor-pointer ${
                timeMode === 'RUNNING_CANDLE' ? 'opacity-40 cursor-not-allowed' : 'active:bg-slate-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Running Candle Subtext (ONLY in running candle mode) */}
          {timeMode === 'RUNNING_CANDLE' ? (
            <div className="text-[8px] font-semibold text-amber-400 mt-1 text-center truncate">
              {canTradeCurrentCandle
                ? `Current: ${secondsRemainingInMinute}s left`
                : `Next: ${effectiveExpirySecs}s (<30s)`}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 mt-1">
              {[15, 30, 60, 120].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    sound.playClick();
                    setDurationSeconds(s);
                  }}
                  className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold ${
                    durationSeconds === s
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s >= 60 ? `${s / 60}m` : `${s}s`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Investment Selector Card */}
        <div className="bg-[#151b29] p-2 rounded-xl border border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
            <span className="flex items-center gap-1 uppercase">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              Investment
            </span>
            <span className="text-emerald-400 font-mono text-[10px] font-black">${investment}</span>
          </div>

          <div className="flex items-center justify-between bg-slate-900/90 rounded-lg border border-slate-800 p-0.5">
            <button
              id="mobile-invest-minus"
              onClick={() => {
                sound.playClick();
                setInvestment(prev => Math.max(1, prev - 5));
              }}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-200 active:bg-slate-700 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-xs text-slate-100">
              ${investment}
            </span>
            <button
              id="mobile-invest-plus"
              onClick={() => {
                sound.playClick();
                setInvestment(prev => prev + 5);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-200 active:bg-slate-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[8px] font-semibold text-slate-400 mt-1 text-center">
            Return: <strong className="text-red-400 font-mono font-bold">${potentialReturn.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Payout & Info Bar */}
      <div className="flex items-center justify-between text-[11px] px-1 mb-2 text-slate-300">
        <span className="text-slate-400 font-semibold">
          Return: <span className="text-red-400 font-black px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 shadow-xs">+{payoutRate}%</span>
        </span>
        <span className="text-slate-300 font-semibold">
          Your Payout: <span className="font-mono font-black text-red-400">+${potentialProfit.toFixed(2)}</span>
        </span>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="mb-2 p-1.5 bg-rose-500/20 border border-rose-500/40 rounded text-rose-300 text-xs text-center font-bold">
          {errorMsg}
        </div>
      )}

      {/* Touch-Friendly Large UP / DOWN Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          id="mobile-trade-up-btn"
          disabled={isPlacingTrade || availableBalance < investment}
          onClick={() => handleExecuteTrade('UP')}
          className="h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 active:scale-95 text-white font-extrabold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>UP</span>
          <ArrowUp className="w-5 h-5 stroke-[3]" />
        </button>

        <button
          id="mobile-trade-down-btn"
          disabled={isPlacingTrade || availableBalance < investment}
          onClick={() => handleExecuteTrade('DOWN')}
          className="h-12 bg-gradient-to-r from-rose-600 to-rose-500 active:scale-95 text-white font-extrabold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>DOWN</span>
          <ArrowDown className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
