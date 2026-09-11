import React, { useState, useEffect, useMemo } from 'react';
import { MarketSymbol, Trade } from '../../types';
import { Minus, Plus, ArrowUp, ArrowDown, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { sound } from '../../utils/audio';
import { AssetIcon } from './AssetIcon';

interface TradePanelProps {
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
  allTrades?: Trade[];
}

export const TradePanel: React.FC<TradePanelProps> = ({
  symbol,
  currentPrice,
  availableBalance,
  accountMode,
  activeTrades,
  isPlacingTrade,
  onPlaceTrade,
  allTrades = [],
}) => {
  // Time mode: 'DURATION' (user sets duration like 1m, 30s, 5m) or 'RUNNING_CANDLE' (live candle countdown with 30s rule)
  const [timeMode, setTimeMode] = useState<'DURATION' | 'RUNNING_CANDLE'>('DURATION');
  const [durationSeconds, setDurationSeconds] = useState<number>(60);
  const [investment, setInvestment] = useState<number>(1);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(Date.now());

  // Keep a 1-second interval for live countdown updates & candle countdown calculations
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 30-Second Rule Calculation for Running Candle:
  // If current candle has >= 30 seconds left: trade expires at current candle close.
  // If current candle has < 30 seconds left: trade expires at NEXT candle close!
  const candleRuleInfo = useMemo(() => {
    const now = new Date(currentTimeTick);
    const currentSeconds = now.getSeconds();
    const secondsRemainingInMinute = 60 - currentSeconds;
    const canTradeCurrentCandle = secondsRemainingInMinute >= 30;
    const effectiveExpirySecs = canTradeCurrentCandle
      ? secondsRemainingInMinute
      : secondsRemainingInMinute + 60;

    return {
      secondsRemainingInMinute,
      canTradeCurrentCandle,
      effectiveExpirySecs,
    };
  }, [currentTimeTick]);

  // Calculations
  const payoutRate = symbol.payoutRate || 92;
  const potentialProfit = (investment * payoutRate) / 100;
  const potentialReturn = investment + potentialProfit;

  // Step Time in Duration Mode:
  // Supports less than 1m (5s, 15s, 30s, 45s), exactly 1m (60s), and more than 1m (2m, 3m, 5m, etc.)
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

  // Step Investment
  const handleStepInvestment = (delta: number) => {
    sound.playClick();
    setInvestment((prev) => Math.max(1, Math.min(Math.floor(availableBalance) || 10000, prev + delta)));
  };

  // Calculate actual duration seconds based on selected mode
  const getCalculatedDuration = (): number => {
    if (timeMode === 'DURATION') {
      return durationSeconds;
    } else {
      // Running candle mode with 30s rule
      return candleRuleInfo.effectiveExpirySecs;
    }
  };

  const handleExecuteTrade = (direction: 'UP' | 'DOWN') => {
    if (investment > availableBalance) {
      sound.playLoss();
      return;
    }
    sound.playTradePlaced(direction);
    const duration = getCalculatedDuration();
    onPlaceTrade({
      direction,
      investment,
      durationSeconds: duration,
    });
  };

  // Format today's date banner e.g. "6 SEPTEMBER"
  const todayBanner = useMemo(() => {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    return `${day} ${month}`;
  }, []);

  // Display label for pair
  const cleanPairName = symbol.displayPair.replace(/\s*\(OTC\)/gi, '').replace(/\/OTC/gi, '').trim();

  return (
    <div className="w-full lg:w-72 xl:w-76 flex flex-col bg-[#161a25] border-l border-slate-800/80 select-none shrink-0 h-full overflow-hidden text-slate-200 text-xs">
      {/* 1. TOP ASSET HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-[#191e2b]">
        <div className="flex items-center gap-2">
          <AssetIcon symbol={symbol.symbol} size="md" showFlag={true} />
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-100 leading-tight">
              {cleanPairName}
            </span>
          </div>
        </div>

        {/* Payout % */}
        <span className="text-base font-extrabold text-slate-300">
          {payoutRate}%
        </span>
      </div>

      {/* 2. TIME & INVESTMENT FORM CONTAINER */}
      <div className="px-4 py-2 space-y-3">
        {/* TIME INPUT CARD */}
        <div className="relative pt-1">
          <div className="relative bg-[#1c2230] border border-slate-700/60 rounded-lg p-2.5">
            {/* Top Floating Label */}
            <span className="absolute -top-2 left-3 bg-[#161a25] px-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {timeMode === 'DURATION' ? 'Time' : 'Running Candle'}
            </span>

            {/* Stepper Row */}
            <div className="flex items-center justify-between mt-1">
              <button
                id="trade-time-minus"
                onClick={() => handleStepDuration('down')}
                disabled={timeMode === 'RUNNING_CANDLE'}
                className={`w-7 h-7 rounded-full bg-[#272f42] text-slate-300 flex items-center justify-center font-bold text-sm transition-all ${
                  timeMode === 'RUNNING_CANDLE'
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[#323c54] cursor-pointer active:scale-95'
                }`}
                title="Decrease trade duration"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="text-center font-mono font-black text-lg text-slate-100 flex flex-col items-center">
                {timeMode === 'DURATION' ? (
                  <span>{formatTime(durationSeconds)}</span>
                ) : (
                  <span>{formatTime(candleRuleInfo.effectiveExpirySecs)}</span>
                )}
              </div>

              <button
                id="trade-time-plus"
                onClick={() => handleStepDuration('up')}
                disabled={timeMode === 'RUNNING_CANDLE'}
                className={`w-7 h-7 rounded-full bg-[#272f42] text-slate-300 flex items-center justify-center font-bold text-sm transition-all ${
                  timeMode === 'RUNNING_CANDLE'
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[#323c54] cursor-pointer active:scale-95'
                }`}
                title="Increase trade duration"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Duration Preset Chips (1m, less or more) */}
            {timeMode === 'DURATION' && (
              <div className="grid grid-cols-6 gap-1 mt-2 pt-1 border-t border-slate-700/50">
                {[
                  { label: '5s', secs: 5 },
                  { label: '15s', secs: 15 },
                  { label: '30s', secs: 30 },
                  { label: '1m', secs: 60 },
                  { label: '2m', secs: 120 },
                  { label: '5m', secs: 300 },
                ].map((preset) => (
                  <button
                    key={preset.secs}
                    onClick={() => {
                      sound.playClick();
                      setDurationSeconds(preset.secs);
                    }}
                    className={`py-0.5 rounded text-[10px] font-mono font-extrabold cursor-pointer transition-colors text-center ${
                      durationSeconds === preset.secs
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'bg-black/30 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            {/* SWITCH TIME LINK */}
            <div className="flex flex-col items-center mt-1.5">
              <button
                id="switch-time-mode-btn"
                onClick={() => {
                  sound.playClick();
                  setTimeMode(timeMode === 'DURATION' ? 'RUNNING_CANDLE' : 'DURATION');
                }}
                className="text-[10px] font-extrabold text-sky-400 hover:text-sky-300 uppercase tracking-wider cursor-pointer mt-0.5"
              >
                {timeMode === 'DURATION' ? 'Switch to Running Candle' : 'Switch to Time'}
              </button>

              {/* ONLY shown when in RUNNING_CANDLE mode (never in Time mode) */}
              {timeMode === 'RUNNING_CANDLE' && (
                <span className="text-[9px] text-amber-400 font-semibold mt-1 text-center bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {candleRuleInfo.canTradeCurrentCandle
                    ? `Current candle: ${candleRuleInfo.secondsRemainingInMinute}s left (>30s)`
                    : `Next candle: ${candleRuleInfo.effectiveExpirySecs}s left (<30s rule)`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* INVESTMENT INPUT CARD */}
        <div className="relative pt-1">
          <div className="relative bg-[#1c2230] border border-slate-700/60 rounded-lg p-2.5">
            {/* Top Label */}
            <span className="absolute -top-2 left-3 bg-[#161a25] px-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Investment
            </span>

            {/* Stepper Row */}
            <div className="flex items-center justify-between mt-1">
              <button
                id="trade-inv-minus"
                onClick={() => handleStepInvestment(-1)}
                className="w-7 h-7 rounded-full bg-[#272f42] hover:bg-[#323c54] text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer active:scale-95 transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="text-center font-mono font-black text-lg text-slate-100 flex items-center justify-center gap-1">
                <input
                  type="number"
                  min="1"
                  max={Math.floor(availableBalance) || 10000}
                  value={investment}
                  onChange={(e) => setInvestment(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 bg-transparent text-center focus:outline-none text-slate-100 font-mono font-black"
                />
                <span>$</span>
              </div>

              <button
                id="trade-inv-plus"
                onClick={() => handleStepInvestment(1)}
                className="w-7 h-7 rounded-full bg-[#272f42] hover:bg-[#323c54] text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* SWITCH LINK */}
            <div className="flex justify-center mt-1">
              <button
                id="switch-inv-btn"
                onClick={() => {
                  sound.playClick();
                  // Cycle quick amounts 1, 5, 10, 25, 50, 100
                  const presets = [1, 5, 10, 25, 50, 100];
                  const currentIndex = presets.indexOf(investment);
                  const nextVal = presets[(currentIndex + 1) % presets.length];
                  setInvestment(nextVal);
                }}
                className="text-[10px] font-extrabold text-sky-400 hover:text-sky-300 uppercase tracking-wider cursor-pointer mt-0.5"
              >
                Switch
              </button>
            </div>
          </div>
        </div>

        {/* PAYOUT ROW WITH DOTTED LEADER LINE */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
          <span className="font-semibold text-slate-400 shrink-0">Payout</span>
          <div className="flex-1 mx-2 border-b border-dotted border-slate-700/80" />
          <span className="font-mono font-black text-sm text-slate-100 shrink-0">
            {potentialReturn.toFixed(2)} $
          </span>
        </div>

        {/* QUOTEX UP & DOWN BUTTONS */}
        <div className="grid grid-cols-1 gap-2 pt-1">
          {/* UP Button (Quotex Emerald Green) */}
          <button
            id="quotex-up-btn"
            disabled={isPlacingTrade || availableBalance < investment}
            onClick={() => handleExecuteTrade('UP')}
            className="group relative flex items-center justify-between px-4 py-3 bg-[#00c278] hover:bg-[#00d885] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-lg shadow-[0_4px_14px_rgba(0,194,120,0.3)] transition-all cursor-pointer active:scale-[0.98]"
          >
            <span className="text-base font-black tracking-wide">Up</span>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shadow-sm">
              <ArrowUp className="w-4 h-4 text-white stroke-[3]" />
            </div>
          </button>

          {/* DOWN Button (Quotex Vibrant Red) */}
          <button
            id="quotex-down-btn"
            disabled={isPlacingTrade || availableBalance < investment}
            onClick={() => handleExecuteTrade('DOWN')}
            className="group relative flex items-center justify-between px-4 py-3 bg-[#f6465d] hover:bg-[#ff526a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-lg shadow-[0_4px_14px_rgba(246,70,93,0.3)] transition-all cursor-pointer active:scale-[0.98]"
          >
            <span className="text-base font-black tracking-wide">Down</span>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shadow-sm">
              <ArrowDown className="w-4 h-4 text-white stroke-[3]" />
            </div>
          </button>
        </div>
      </div>

      {/* 4. QUOTEX BOTTOM TRADES LIST */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800/80 mt-2 bg-[#141822]">
        {/* Tab Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-[#161a25]">
          <div className="font-bold text-xs text-sky-400 flex items-center gap-1.5">
            <span>Active & Recent Trades</span>
          </div>
          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded-full font-bold">
            {activeTrades.length} Active
          </span>
        </div>

        {/* Date Grouping Header (e.g. 6 SEPTEMBER 8) */}
        <div className="flex items-center justify-center gap-2 py-1.5 bg-[#121620] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/40">
          <span>{todayBanner}</span>
          <span className="w-4 h-4 rounded-full bg-slate-700/80 text-slate-300 flex items-center justify-center text-[9px] font-black">
            {activeTrades.length + (allTrades?.length || 0)}
          </span>
        </div>

        {/* Trades Scrollable List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
          {/* Active Trades First */}
          {activeTrades.map((trade) => {
            const isUp = trade.direction === 'UP';
            const timeLeftMs = Math.max(0, trade.expiryTimestamp - currentTimeTick);
            const timeLeftSecs = Math.ceil(timeLeftMs / 1000);
            const isExpanded = expandedTradeId === trade.id;
            const diff = currentPrice - trade.entryPrice;
            const isWinning = isUp ? diff > 0 : diff < 0;

            return (
              <div
                key={trade.id}
                className="bg-[#191f2c] hover:bg-[#1f2637] border border-slate-700/40 rounded p-2 transition-all cursor-pointer"
                onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    )}
                    <AssetIcon symbol={trade.symbol} size="sm" showFlag={true} />
                    <span className="font-bold text-slate-200 text-[11px]">
                      {trade.displayPair.replace(/\s*\(OTC\)/gi, '')}
                    </span>
                  </div>

                  {/* Countdown Timer */}
                  <span className="font-mono font-bold text-sky-400 text-[11px]">
                    {formatTime(timeLeftSecs)}
                  </span>
                </div>

                {/* Bottom Row: Direction + Investment and Result */}
                <div className="flex items-center justify-between mt-1 text-[11px] font-mono pl-4">
                  <div className="flex items-center gap-1 font-bold">
                    <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                      {isUp ? '↑' : '↓'} {trade.investment} $
                    </span>
                  </div>

                  <span
                    className={`font-black ${
                      isWinning ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isWinning ? `+${((trade.investment * trade.payoutRate) / 100).toFixed(2)} $` : '0.00 $'}
                  </span>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-2 pt-1.5 border-t border-slate-700/60 text-[10px] font-mono text-slate-400 grid grid-cols-2 gap-1">
                    <div>Entry: {trade.entryPrice.toFixed(2)}</div>
                    <div>Current: {currentPrice.toFixed(2)}</div>
                    <div>Payout: {trade.payoutRate}%</div>
                    <div>ID: #{trade.id.slice(-4)}</div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Recently Settled Trades */}
          {allTrades
            .filter((t) => t.status === 'SETTLED')
            .slice(0, 10)
            .map((trade) => {
              const isUp = trade.direction === 'UP';
              const isWin = trade.result === 'WIN';
              const isExpanded = expandedTradeId === trade.id;

              return (
                <div
                  key={trade.id}
                  className="bg-[#171b26] hover:bg-[#1c2230] border border-slate-800/60 rounded p-2 transition-all cursor-pointer opacity-85 hover:opacity-100"
                  onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      )}
                      <AssetIcon symbol={trade.symbol} size="sm" showFlag={true} />
                      <span className="font-semibold text-slate-300 text-[11px]">
                        {trade.displayPair.replace(/\s*\(OTC\)/gi, '')}
                      </span>
                    </div>

                    <span className="font-mono text-slate-400 text-[10px]">
                      {formatTime(trade.durationSeconds || 60)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[11px] font-mono pl-4">
                    <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                      {isUp ? '↑' : '↓'} {trade.investment} $
                    </span>

                    <span
                      className={`font-black ${
                        isWin ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isWin
                        ? `+${(trade.investment + (trade.profit || 0)).toFixed(2)} $`
                        : '0.00 $'}
                    </span>
                  </div>
                </div>
              );
            })}

          {activeTrades.length === 0 && allTrades.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-[11px]">
              No trades placed yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
