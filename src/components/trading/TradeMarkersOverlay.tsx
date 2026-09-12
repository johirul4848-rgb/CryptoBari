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
  Copy,
  Palette,
  Box,
  Spline,
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
  onDuplicateDrawingTool?: (id: string) => void;
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

const PRESET_TOOL_COLORS = [
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#38bdf8', // Sky
  '#eab308', // Gold
  '#ffffff', // White
];

export const TradeMarkersOverlay: React.FC<TradeMarkersOverlayProps> = ({
  chart,
  series,
  activeTrades,
  drawingTools = [],
  currentPrice,
  timeframeSeconds = 60,
  onDeleteDrawingTool,
  onDuplicateDrawingTool,
  onUpdateDrawingTool,
}) => {
  const [, setTick] = useState(0);
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);
  const draggingToolRef = useRef<{ id: string; startY: number; startPrice: number } | null>(null);

  // Re-render periodically for running trade timers & candle countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 1000);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Immediate re-computation on chart zoom / pan / scroll
  useEffect(() => {
    if (!chart) return;
    const handleRangeChange = () => setTick((t) => (t + 1) % 1000);
    try {
      chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);
    } catch {}
    return () => {
      try {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      } catch {}
    };
  }, [chart]);

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
        zoneBoxes: [],
        channels: [],
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

      // 2. Compute Drawing Tools Coordinates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolPositions: any[] = [];
      const fibonacciTools: FibonacciRenderItem[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zoneBoxes: any[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const channels: any[] = [];

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
          } else if (tool.type === 'zone_box') {
            const p1 = tool.price;
            const p2 = tool.price2 || Number((tool.price * 0.994).toFixed(4));
            const y1 = series.priceToCoordinate(p1);
            const y2 = series.priceToCoordinate(p2);
            if (y1 !== null && y2 !== null && !isNaN(y1) && !isNaN(y2)) {
              zoneBoxes.push({
                id: tool.id,
                priceTop: Math.max(p1, p2),
                priceBtm: Math.min(p1, p2),
                topY: Math.min(y1, y2),
                bottomY: Math.max(y1, y2),
                height: Math.abs(y1 - y2),
                color: tool.color || '#10b981',
                label: tool.label || 'S/R Zone Box',
              });
            }
          } else if (tool.type === 'channel') {
            const width = tool.channelWidth || tool.price * 0.003;
            const midY = series.priceToCoordinate(tool.price);
            const topY = series.priceToCoordinate(tool.price + width);
            const btmY = series.priceToCoordinate(tool.price - width);
            if (midY !== null && topY !== null && btmY !== null && !isNaN(midY)) {
              channels.push({
                id: tool.id,
                price: tool.price,
                width,
                midY,
                topY,
                btmY,
                color: tool.color || '#38bdf8',
                label: tool.label || 'Parallel Channel',
              });
            }
          } else {
            // Horizontal line / ray / trendline
            const y = series.priceToCoordinate(tool.price);
            if (y !== null && !isNaN(y)) {
              toolPositions.push({
                id: tool.id,
                y,
                price: tool.price,
                color: tool.color,
                label: tool.label,
                type: tool.type,
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

          const remSeconds = Math.max(0, Math.ceil(timeLeftMs / 1000));
          const remMins = Math.floor(remSeconds / 60);
          const remSecs = remSeconds % 60;
          const countdown = `${remMins}:${remSecs < 10 ? '0' : ''}${remSecs}`;

          tradeMarkers.push({
            id: trade.id,
            direction: trade.direction,
            entryPrice: trade.entryPrice,
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
        zoneBoxes,
        channels,
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
        zoneBoxes: [],
        channels: [],
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

  const {
    candleX,
    candleY,
    chartWidth,
    candleCountdown,
    trades,
    toolPositions,
    fibonacciTools,
    zoneBoxes,
    channels,
  } = positions;

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

          {/* Candle Countdown Badge */}
          <div
            className="absolute -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#090e18]/95 border border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.35)] backdrop-blur-md transition-all"
            style={{
              left:
                candleX !== null
                  ? `${Math.min(Math.max(candleX + 24, 20), chartWidth - 110)}px`
                  : '30px',
            }}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-mono font-black text-xs text-amber-300 tracking-wider">
              {candleCountdown}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FIBONACCI RETRACEMENT BANDS WITH DOUBLE, COLOR & CROSS (X)             */}
      {/* ========================================================================= */}
      {fibonacciTools.map((fib) => (
        <div key={fib.id} className="absolute inset-0 pointer-events-none select-none">
          {/* Golden Pocket Shading (0.5 to 0.618) */}
          <div
            className="absolute left-0 right-0 bg-amber-500/15 border-y border-amber-500/40 pointer-events-none transition-all"
            style={{
              top: `${fib.goldenTopY}px`,
              height: `${Math.max(4, fib.goldenBottomY - fib.goldenTopY)}px`,
            }}
          />

          {/* Fibonacci Lines */}
          {fib.levels.map((lvl) => (
            <div
              key={`${fib.id}-${lvl.ratio}`}
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: `${lvl.y}px` }}
            >
              <div
                className={`w-full border-t transition-all ${
                  lvl.isGolden
                    ? 'border-amber-400 border-solid opacity-90 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    : 'border-sky-400/60 border-dashed'
                }`}
                style={{
                  borderTopColor: lvl.isGolden ? '#f59e0b' : fib.color,
                }}
              />
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

          {/* Fibonacci Floating Control Badge (Double + Color + Cross [X]) */}
          <div
            className="absolute left-4 sm:left-8 pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0b0f19]/95 border border-sky-500/50 shadow-2xl backdrop-blur-md"
            style={{ top: `${fib.topY}px`, transform: 'translateY(-50%)' }}
          >
            <Percent className="w-3 h-3 text-sky-400" />
            <span className="text-[10px] font-black text-sky-200">FIB</span>

            {/* Duplicate / Double Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                onDuplicateDrawingTool?.(fib.id);
              }}
              title="Duplicate / Double Fibonacci"
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 font-extrabold text-[9px] border border-sky-500/30 cursor-pointer ml-1"
            >
              <Copy className="w-2.5 h-2.5" />
              <span>Double</span>
            </button>

            {/* Color Swatch Trigger */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveColorPickerId(activeColorPickerId === fib.id ? null : fib.id);
                }}
                className="w-3.5 h-3.5 rounded-full ring-1 ring-white/40 cursor-pointer ml-1"
                style={{ backgroundColor: fib.color }}
                title="Change Color"
              />

              {activeColorPickerId === fib.id && (
                <div className="absolute left-0 top-full mt-1.5 p-2 bg-[#121829] border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col gap-1.5">
                  <div className="grid grid-cols-4 gap-1">
                    {PRESET_TOOL_COLORS.map((col) => (
                      <button
                        key={col}
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playClick();
                          onUpdateDrawingTool?.(fib.id, { color: col });
                          setActiveColorPickerId(null);
                        }}
                        className="w-4 h-4 rounded-full cursor-pointer hover:scale-110"
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  <label className="flex items-center justify-between text-[9px] text-slate-300 pt-1 border-t border-white/10 cursor-pointer">
                    <span>Custom:</span>
                    <input
                      type="color"
                      value={fib.color}
                      onChange={(e) => onUpdateDrawingTool?.(fib.id, { color: e.target.value })}
                      className="w-4 h-4 rounded bg-transparent border-0 cursor-pointer"
                    />
                  </label>
                </div>
              )}
            </div>

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
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* ========================================================================= */}
      {/* 2.5 ZONE BOXES & PARALLEL CHANNELS                                        */}
      {/* ========================================================================= */}
      {zoneBoxes.map((box) => (
        <div
          key={box.id}
          className="absolute left-0 right-0 pointer-events-auto select-none"
          style={{
            top: `${box.topY}px`,
            height: `${Math.max(10, box.height)}px`,
          }}
        >
          {/* Shaded Area */}
          <div
            className="w-full h-full border-y-2 transition-all backdrop-blur-xs flex items-center justify-center cursor-ns-resize"
            style={{
              backgroundColor: `${box.color}22`,
              borderColor: box.color,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleStartDrag(box.id, box.priceTop, e.clientY);
            }}
            onTouchStart={(e) => {
              handleStartDrag(box.id, box.priceTop, e.touches[0].clientY);
            }}
          >
            {/* Center pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#0d1322]/95 border shadow-xl text-[10px] font-bold text-slate-200">
              <Box className="w-3 h-3 text-emerald-400" />
              <span>{box.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateDrawingTool?.(box.id);
                }}
                className="text-sky-400 hover:underline text-[9px] font-black ml-1 cursor-pointer"
              >
                Double
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDrawingTool?.(box.id);
                }}
                className="text-slate-400 hover:text-rose-400 ml-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {channels.map((chan) => (
        <div key={chan.id} className="absolute left-0 right-0 pointer-events-none select-none">
          {/* Top Line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed pointer-events-auto"
            style={{ top: `${chan.topY}px`, borderColor: chan.color }}
          />
          {/* Mid Line */}
          <div
            className="absolute left-0 right-0 border-t border-dotted pointer-events-auto"
            style={{ top: `${chan.midY}px`, borderColor: chan.color }}
          />
          {/* Bottom Line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed pointer-events-auto"
            style={{ top: `${chan.btmY}px`, borderColor: chan.color }}
          />
        </div>
      ))}

      {/* ========================================================================= */}
      {/* 3. CLEAN INTERACTIVE HORIZONTAL / SUPPORT / RESISTANCE LINES              */}
      {/* ========================================================================= */}
      {toolPositions.map((tool) => (
        <div
          key={tool.id}
          className="absolute left-0 right-0 pointer-events-auto select-none group z-20"
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
            className="w-full h-6 -my-3 flex items-center cursor-ns-resize"
            title="Click and drag to move line"
          >
            <div
              className="w-full border-t-[2.5px] border-dashed transition-all group-hover:border-solid"
              style={{
                borderColor: tool.color,
                boxShadow: `0 0 14px ${tool.color}99, 0 0 4px ${tool.color}`,
              }}
            />
          </div>

          {/* Right-Side Glowing Price Scale Flag */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-l-md text-[10px] font-mono font-black text-slate-950 shadow-lg pointer-events-none flex items-center gap-1 z-20 transition-all select-none"
            style={{
              backgroundColor: tool.color,
              boxShadow: `0 0 12px ${tool.color}99`,
            }}
          >
            <span className="opacity-85 text-[8.5px]">
              {tool.label?.includes('Support') ? 'SUP' : tool.label?.includes('Resistance') ? 'RES' : 'LVL'}
            </span>
            <span>
              ${tool.price >= 1000 ? tool.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : tool.price}
            </span>
          </div>
        </div>
      ))}

      {/* ========================================================================= */}
      {/* 4. ACTIVE TRADE PLACEMENT MARKERS (EXACT CANDLE ENTRY + COUNTDOWN)       */}
      {/* ========================================================================= */}
      {trades.map((trade) => {
        const isUp = trade.direction === 'UP';
        const strokeColor = isUp ? '#00c278' : '#f6465d';
        const arrowBg = isUp ? 'bg-emerald-500' : 'bg-rose-500';

        return (
          <div
            key={trade.id}
            className="absolute left-0 right-0 pointer-events-none select-none transition-all duration-75"
            style={{ top: `${trade.y}px` }}
          >
            {/* SVG Connecting Ray Line */}
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
              <line
                x1={trade.startX}
                y1="0"
                x2={trade.endX}
                y2="0"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeDasharray="6 3"
              />
              <circle
                cx={trade.startX}
                cy="0"
                r="4"
                fill={strokeColor}
                className="animate-ping"
              />
            </svg>

            {/* Entry Marker Badge */}
            <div
              className="absolute -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#090e18]/95 border shadow-2xl backdrop-blur-md transition-all"
              style={{
                left: `${trade.startX}px`,
                borderColor: `${strokeColor}bb`,
              }}
            >
              <div
                className={`w-4 h-4 rounded-full ${arrowBg} flex items-center justify-center text-slate-950 font-black shadow-xs`}
              >
                {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              </div>
              <span className="font-mono font-bold text-xs text-slate-100">
                ${trade.investment}
              </span>
              <span
                className="font-mono font-bold text-[10px] px-1 py-0.2 rounded bg-black/40"
                style={{ color: strokeColor }}
              >
                ${trade.entryPrice}
              </span>
            </div>

            {/* Countdown Badge */}
            <div
              className="absolute -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#0b101c]/95 border shadow-xl backdrop-blur-md font-mono font-bold text-xs"
              style={{
                left: `${trade.endX - 25}px`,
                borderColor: `${strokeColor}88`,
                color: strokeColor,
              }}
            >
              <Clock className="w-3 h-3 animate-spin" />
              <span>{trade.countdown}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
