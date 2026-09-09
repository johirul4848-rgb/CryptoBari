import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { Trade, DrawingToolItem } from '../../types';
import {
  Clock,
  ArrowUp,
  ArrowDown,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Percent,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface TradeMarkersOverlayProps {
  chart: IChartApi | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: ISeriesApi<any> | null;
  activeTrades: Trade[];
  drawingTools?: DrawingToolItem[];
  currentPrice: number;
  timeframeSeconds?: number;
  onDeleteDrawingTool?: (id: string) => void;
  onUpdateDrawingTool?: (id: string, updates: Partial<DrawingToolItem>) => void;
}

interface FibonacciLevelRender {
  ratio: number;
  label: string;
  price: number;
  y: number;
  isGolden?: boolean;
}

interface FibonacciRenderItem {
  id: string;
  highPrice: number;
  lowPrice: number;
  color: string;
  levels: FibonacciLevelRender[];
  topY: number;
  bottomY: number;
  goldenTopY: number;
  goldenBottomY: number;
}

export const TradeMarkersOverlay: React.FC<TradeMarkersOverlayProps> = ({
  chart,
  series,
  activeTrades,
  drawingTools = [],
  currentPrice,
  timeframeSeconds = 60,
  onDeleteDrawingTool,
  onUpdateDrawingTool,
}) => {
  const [, setTick] = useState(0);
  const draggingToolRef = useRef<{ id: string; startY: number; startPrice: number } | null>(null);

  // Re-render periodically for running trade timers & candle countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 1000);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Compute live coordinates
  const computePositions = useCallback(() => {
    if (!chart || !series) {
      return {
        candleX: null,
        candleY: null,
        chartWidth: 0,
        candleCountdown: '',
        trades: [],
        toolPositions: [],
        fibonacciTools: [],
      };
    }

    try {
      const chartElement = chart.chartElement?.();
      const chartWidth = chartElement?.clientWidth || 800;

      // 1. Compute Running Candle Coordinates
      const now = Date.now();
      const currentSeconds = Math.floor(now / 1000);
      const candleStartTime = Math.floor(currentSeconds / timeframeSeconds) * timeframeSeconds;
      const candleEndTime = candleStartTime + timeframeSeconds;
      const secondsLeft = Math.max(0, candleEndTime - currentSeconds);

      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      const candleCountdown = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

      let candleX: number | null = null;
      let candleY: number | null = null;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const xCoord = chart.timeScale().timeToCoordinate(candleStartTime as any);
        if (xCoord !== null && !isNaN(xCoord)) {
          candleX = xCoord;
        }
      } catch {}

      if (currentPrice && series) {
        try {
          const yCoord = series.priceToCoordinate(currentPrice);
          if (yCoord !== null && !isNaN(yCoord)) {
            candleY = yCoord;
          }
        } catch {}
      }

      // 2. Compute Drawing Tools Coordinates (Horizontal lines)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolPositions: any[] = [];
      const fibonacciTools: FibonacciRenderItem[] = [];

      for (const tool of drawingTools) {
        try {
          if (tool.type === 'fibonacci') {
            const high = tool.highPrice ?? Number((tool.price * 1.006).toFixed(4));
            const low = tool.lowPrice ?? Number((tool.price * 0.994).toFixed(4));
            const diff = high - low;

            const ratios = [
              { ratio: 0.0, label: '0.0% (High)' },
              { ratio: 0.236, label: '23.6%' },
              { ratio: 0.382, label: '38.2%' },
              { ratio: 0.5, label: '50.0%' },
              { ratio: 0.618, label: '61.8% (Golden Pocket)', isGolden: true },
              { ratio: 0.786, label: '78.6%' },
              { ratio: 1.0, label: '100.0% (Low)' },
            ];

            const levelRenders: FibonacciLevelRender[] = [];
            for (const r of ratios) {
              const lvlPrice = high - diff * r.ratio;
              const y = series.priceToCoordinate(lvlPrice);
              if (y !== null && !isNaN(y)) {
                levelRenders.push({
                  ratio: r.ratio,
                  label: r.label,
                  price: Number(lvlPrice.toFixed(4)),
                  y,
                  isGolden: r.isGolden,
                });
              }
            }

            if (levelRenders.length >= 2) {
              const topLvl = levelRenders[0];
              const btmLvl = levelRenders[levelRenders.length - 1];
              const lvl50 = levelRenders.find((l) => l.ratio === 0.5) || topLvl;
              const lvl618 = levelRenders.find((l) => l.ratio === 0.618) || btmLvl;

              fibonacciTools.push({
                id: tool.id,
                highPrice: high,
                lowPrice: low,
                color: tool.color || '#38bdf8',
                levels: levelRenders,
                topY: Math.min(topLvl.y, btmLvl.y),
                bottomY: Math.max(topLvl.y, btmLvl.y),
                goldenTopY: Math.min(lvl50.y, lvl618.y),
                goldenBottomY: Math.max(lvl50.y, lvl618.y),
              });
            }
          } else {
            const y = series.priceToCoordinate(tool.price);
            if (y !== null && !isNaN(y)) {
              toolPositions.push({
                id: tool.id,
                y,
                price: tool.price,
                color: tool.color,
                label: tool.label,
              });
            }
          }
        } catch {}
      }

      // 3. Active Trades
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tradeMarkers: any[] = [];

      for (const trade of activeTrades) {
        try {
          const timeLeftMs = trade.expiryTimestamp - now;
          if (timeLeftMs <= 0 || trade.status === 'SETTLED') {
            continue;
          }

          const y = series.priceToCoordinate(trade.entryPrice);
          if (y === null || isNaN(y)) continue;

          const tradeStartSec = Math.floor(trade.createdAt / 1000);
          const tradeBarTime = Math.floor(tradeStartSec / timeframeSeconds) * timeframeSeconds;
          const tradeExpirySec = Math.floor(trade.expiryTimestamp / 1000);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let startX: number | null = chart.timeScale().timeToCoordinate(tradeBarTime as any) as any;
          if (startX === null || isNaN(startX)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            startX = chart.timeScale().timeToCoordinate(tradeStartSec as any) as any;
          }

          // If coordinate still not directly available from time scale (e.g. recent trade on active bar)
          if (startX === null || isNaN(startX)) {
            if (candleX !== null) {
              const barsAgo = Math.max(0, Math.floor((now - trade.createdAt) / (timeframeSeconds * 1000)));
              startX = Math.max(30, (candleX as number) - barsAgo * 16);
            } else {
              startX = 120;
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let endX: number | null = chart.timeScale().timeToCoordinate(tradeExpirySec as any) as any;
          if (endX === null || isNaN(endX)) {
            const totalDurationSec = Math.max(1, (trade.expiryTimestamp - trade.createdAt) / 1000);
            const durationBars = Math.max(1, totalDurationSec / timeframeSeconds);
            endX = (startX as number) + Math.max(90, durationBars * 18);
          }

          const totalSeconds = Math.max(1, Math.ceil(timeLeftMs / 1000));
          const tMins = Math.floor(totalSeconds / 60);
          const tSecs = totalSeconds % 60;
          const countdown = `${tMins < 10 ? '0' : ''}${tMins}:${tSecs < 10 ? '0' : ''}${tSecs}`;

          tradeMarkers.push({
            id: trade.id,
            entryPrice: trade.entryPrice,
            direction: trade.direction,
            investment: trade.investment,
            countdown,
            y,
            startX,
            endX,
          });
        } catch {}
      }

      return {
        candleX,
        candleY,
        chartWidth,
        candleCountdown,
        trades: tradeMarkers,
        toolPositions,
        fibonacciTools,
      };
    } catch {
      return {
        candleX: null,
        candleY: null,
        chartWidth: 0,
        candleCountdown: '',
        trades: [],
        toolPositions: [],
        fibonacciTools: [],
      };
    }
  }, [chart, series, currentPrice, timeframeSeconds, drawingTools, activeTrades]);

  const positions = computePositions();

  // Unified Mouse & Touch Dragging logic
  const handleStartDrag = useCallback(
    (id: string, currentP: number, clientY: number) => {
      draggingToolRef.current = { id, startY: clientY, startPrice: currentP };

      const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!draggingToolRef.current || !series || !chart) return;
        try {
          const chartElement = chart.chartElement?.();
          if (!chartElement) return;
          const rect = chartElement.getBoundingClientRect();
          const pageY = 'touches' in e ? e.touches[0].clientY : e.clientY;
          const localY = pageY - rect.top;

          const newPrice = series.coordinateToPrice(localY);
          if (newPrice !== null && !isNaN(newPrice) && newPrice > 0) {
            onUpdateDrawingTool?.(draggingToolRef.current.id, {
              price: Number(newPrice.toFixed(4)),
            });
          }
        } catch {}
      };

      const handleEnd = () => {
        draggingToolRef.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    },
    [chart, series, onUpdateDrawingTool]
  );

  const { candleX, candleY, chartWidth, candleCountdown, trades, toolPositions, fibonacciTools } =
    positions;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* ========================================================================= */}
      {/* 1. RUNNING CANDLE HORIZONTAL LINE + COUNTDOWN BADGE BESIDE CANDLE         */}
      {/* ========================================================================= */}
      {candleY !== null && (
        <div
          className="absolute left-0 right-0 pointer-events-none transition-all duration-75 select-none"
          style={{ top: `${candleY}px` }}
        >
          {/* Subtle horizontal dashed guide */}
          <div className="w-full border-t border-amber-500/30 border-dashed" />

          {/* Candle Countdown Badge: positioned to the side of the candle so the forming candle is 100% visible */}
          <div
            className="absolute -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#090e18]/95 border border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.35)] backdrop-blur-md transition-all"
            style={{
              left:
                candleX !== null && candleX < chartWidth - 110
                  ? `${candleX + 22}px`
                  : `${Math.max(10, chartWidth - 95)}px`,
            }}
          >
            <Clock className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
            <span className="font-mono font-black text-xs tracking-wider text-amber-300">
              {candleCountdown}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FIBONACCI RETRACEMENT TOOL RENDERING ("fibola retchment tools")        */}
      {/* ========================================================================= */}
      {fibonacciTools.map((fib) => (
        <div key={fib.id} className="absolute inset-0 pointer-events-none select-none">
          {/* Golden Pocket Fill between 50% and 61.8% */}
          {fib.goldenBottomY > fib.goldenTopY && (
            <div
              className="absolute left-0 right-0 bg-amber-500/10 border-y border-amber-500/30 backdrop-blur-[1px] pointer-events-none"
              style={{
                top: `${fib.goldenTopY}px`,
                height: `${fib.goldenBottomY - fib.goldenTopY}px`,
              }}
            />
          )}

          {/* Fibonacci Levels Lines & Badges */}
          {fib.levels.map((lvl) => (
            <div
              key={lvl.ratio}
              className="absolute left-0 right-0 pointer-events-auto"
              style={{ top: `${lvl.y}px`, transform: 'translateY(-50%)' }}
            >
              {/* Level Line */}
              <div
                className={`w-full border-t ${
                  lvl.isGolden
                    ? 'border-amber-400/80 border-solid shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    : 'border-sky-400/50 border-dashed'
                }`}
              />

              {/* Level Badge Tag */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 right-16 sm:right-24 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1.5 border shadow-md ${
                  lvl.isGolden
                    ? 'bg-amber-500/90 text-slate-950 border-amber-300 font-black'
                    : 'bg-[#0d1322]/90 text-sky-300 border-sky-500/30'
                }`}
              >
                <span>{lvl.label}</span>
                <span className="opacity-90">${lvl.price}</span>
              </div>
            </div>
          ))}

          {/* Fibonacci Floating Control Badge (Nudge & Delete [X]) */}
          <div
            className="absolute left-4 sm:left-8 pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0b0f19]/95 border border-sky-500/50 shadow-2xl backdrop-blur-md"
            style={{ top: `${fib.topY}px`, transform: 'translateY(-50%)' }}
          >
            <Percent className="w-3 h-3 text-sky-400" />
            <span className="text-[10px] font-black text-sky-200">FIB RETRACE</span>

            {/* Delete Fibonacci cross [X] */}
            <button
              id={`delete-fib-${fib.id}`}
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                onDeleteDrawingTool?.(fib.id);
              }}
              title="Remove Fibonacci Retracement"
              className="p-1 ml-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE MANUALLY MOVABLE HORIZONTAL LINES WITH CROSS DELETE [X]     */}
      {/* ========================================================================= */}
      {toolPositions.map((tool) => (
        <div
          key={tool.id}
          className="absolute left-0 right-0 pointer-events-auto select-none group"
          style={{ top: `${tool.y}px`, transform: 'translateY(-50%)' }}
        >
          {/* Draggable Line Hitbox */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              handleStartDrag(tool.id, tool.price, e.clientY);
            }}
            onTouchStart={(e) => {
              handleStartDrag(tool.id, tool.price, e.touches[0].clientY);
            }}
            className="w-full h-5 -my-2.5 flex items-center cursor-ns-resize"
          >
            <div
              className="w-full border-t-2 border-dashed transition-all"
              style={{
                borderColor: tool.color,
                boxShadow: `0 0 10px ${tool.color}66`,
              }}
            />
          </div>

          {/* On-Chart Control Pill (Drag Handle + Price + Nudge + Cross Delete) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d1322]/95 border shadow-2xl backdrop-blur-md"
            style={{ borderColor: `${tool.color}aa` }}
          >
            {/* Drag Handle */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                handleStartDrag(tool.id, tool.price, e.clientY);
              }}
              onTouchStart={(e) => {
                handleStartDrag(tool.id, tool.price, e.touches[0].clientY);
              }}
              className="flex items-center gap-1 text-[11px] font-black cursor-ns-resize text-slate-200 active:text-amber-400"
              title="Click and drag to move line up/down"
            >
              <GripVertical className="w-3.5 h-3.5 opacity-70" />
              <span className="font-mono font-bold" style={{ color: tool.color }}>
                ${tool.price}
              </span>
            </div>

            {/* Quick Nudge Buttons */}
            <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5 ml-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  const step = tool.price * 0.0005;
                  onUpdateDrawingTool?.(tool.id, {
                    price: Number((tool.price + step).toFixed(4)),
                  });
                }}
                title="Nudge Up"
                className="p-0.5 hover:bg-white/10 rounded text-slate-300 hover:text-white cursor-pointer"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  const step = tool.price * 0.0005;
                  onUpdateDrawingTool?.(tool.id, {
                    price: Number((tool.price - step).toFixed(4)),
                  });
                }}
                title="Nudge Down"
                className="p-0.5 hover:bg-white/10 rounded text-slate-300 hover:text-white cursor-pointer"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Cross Function (X) to delete this horizontal line */}
            <button
              id={`cross-delete-${tool.id}`}
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                onDeleteDrawingTool?.(tool.id);
              }}
              title="Delete this horizontal line"
              className="p-0.5 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400 cursor-pointer transition-colors border-l border-white/10 pl-1 ml-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* ========================================================================= */}
      {/* 4. ACTIVE TRADE PLACEMENT MARKERS (EXACT CANDLE ENTRY + TRADE COUNTDOWN) */}
      {/* ========================================================================= */}
      {trades.map((trade) => {
        const isUp = trade.direction === 'UP';
        const badgeBg = isUp
          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-400/80 shadow-[0_4px_16px_rgba(16,185,129,0.4)]'
          : 'bg-gradient-to-r from-rose-600 to-rose-500 border-rose-400/80 shadow-[0_4px_16px_rgba(244,63,94,0.4)]';
        const lineColor = isUp ? '#10b981' : '#f43f5e';
        const lineWidth = Math.max(50, trade.endX - trade.startX);

        return (
          <div
            key={trade.id}
            className="absolute pointer-events-none select-none transition-all duration-75"
            style={{
              top: `${trade.y}px`,
              left: 0,
              right: 0,
            }}
          >
            {/* 1. Horizontal Strike Line starting exactly at the trade entry candle */}
            <div
              className="absolute h-[2px] -translate-y-1/2 rounded-full"
              style={{
                left: `${trade.startX}px`,
                width: `${lineWidth}px`,
                backgroundColor: lineColor,
                boxShadow: `0 0 8px ${lineColor}88`,
              }}
            />

            {/* 2. Dotted continuation extending forward to right edge for clear price visual */}
            <div
              className="absolute h-[1px] border-b border-dashed -translate-y-1/2 opacity-40"
              style={{
                left: `${trade.startX + lineWidth}px`,
                right: '40px',
                borderColor: lineColor,
              }}
            />

            {/* 3. Trade Entry Candle Marker Dot */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full border-2 border-slate-950 -translate-x-1/2 -translate-y-1/2 shadow-lg flex items-center justify-center z-10"
              style={{
                left: `${trade.startX}px`,
                top: '0px',
                backgroundColor: lineColor,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>

            {/* 4. Trade Details & Countdown Badge sitting beside the trade line */}
            <div
              className={`absolute -translate-y-full flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white border backdrop-blur-md z-20 ${badgeBg}`}
              style={{
                left: `${trade.startX + 12}px`,
                top: '-3px',
              }}
            >
              <div className="w-4 h-4 rounded-full bg-black/25 flex items-center justify-center">
                {isUp ? (
                  <ArrowUp className="w-2.5 h-2.5 text-white stroke-[3]" />
                ) : (
                  <ArrowDown className="w-2.5 h-2.5 text-white stroke-[3]" />
                )}
              </div>

              <span className="font-mono font-black text-xs">${trade.investment}</span>

              {/* Trade Expiry Countdown Timer */}
              <div className="flex items-center gap-1 bg-black/35 px-2 py-0.5 rounded-full font-mono font-black text-[11px] text-white">
                <Clock className="w-2.5 h-2.5 text-amber-300" />
                <span>{trade.countdown}</span>
              </div>
            </div>

            {/* 5. Expiry Point Target Marker */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
              style={{ left: `${trade.endX}px`, top: '0px' }}
            >
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: lineColor }}
              />
              <span className="text-[9px] font-mono font-black text-slate-200 bg-slate-900/90 px-1 py-0.2 rounded border border-slate-700 mt-1 whitespace-nowrap shadow-xs">
                EXP
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
