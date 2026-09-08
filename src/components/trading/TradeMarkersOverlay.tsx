import React, { useEffect, useState, useRef, useCallback } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { Trade, Timeframe, DrawingToolItem } from '../../types';
import { timeframeToSeconds } from '../../services/binanceMarketData';
import { ArrowDown, ArrowUp, Clock, X, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TradeMarkersOverlayProps {
  chart: IChartApi | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: ISeriesApi<any> | null;
  activeTrades: Trade[];
  timeframe: Timeframe;
  lastCandleTime?: number; // in seconds
  currentPrice: number;
  drawingTools?: DrawingToolItem[];
  onUpdateDrawingTool?: (id: string, updates: Partial<DrawingToolItem>) => void;
  onDeleteDrawingTool?: (id: string) => void;
}

export const TradeMarkersOverlay: React.FC<TradeMarkersOverlayProps> = ({
  chart,
  series,
  activeTrades,
  timeframe,
  lastCandleTime,
  currentPrice,
  drawingTools = [],
  onUpdateDrawingTool,
  onDeleteDrawingTool,
}) => {
  const [positions, setPositions] = useState<{
    candleX: number | null;
    candleY: number | null;
    chartWidth: number;
    candleCountdown: string;
    trades: Array<{
      id: string;
      direction: 'UP' | 'DOWN';
      investment: number;
      entryPrice: number;
      y: number;
      startX: number;
      endX: number;
      countdown: string;
      isWinning: boolean;
    }>;
    toolPositions: Array<{
      id: string;
      y: number;
      price: number;
      color: string;
      label?: string;
    }>;
  }>({
    candleX: null,
    candleY: null,
    chartWidth: 800,
    candleCountdown: '00:00',
    trades: [],
    toolPositions: [],
  });

  const animFrameRef = useRef<number | null>(null);
  const draggingToolRef = useRef<{ id: string; startY: number; startPrice: number } | null>(null);
  const lastOverlayUpdateRef = useRef<number>(0);

  // Compute live candle countdown and trade marker coordinates
  useEffect(() => {
    const updateOverlay = () => {
      if (!chart || !series) {
        animFrameRef.current = requestAnimationFrame(updateOverlay);
        return;
      }

      const now = Date.now();
      // Throttle state update to at most ~20fps (50ms) to ensure lightweight charts smooth 60fps candle rendering
      if (now - lastOverlayUpdateRef.current < 45) {
        animFrameRef.current = requestAnimationFrame(updateOverlay);
        return;
      }
      lastOverlayUpdateRef.current = now;

      const nowSec = Math.floor(now / 1000);
      const tfSec = timeframeToSeconds(timeframe);
      const passed = nowSec % tfSec;
      const remaining = tfSec - passed;

      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      const candleCountdown = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

      const chartWidth = chart.timeScale().width() || 800;

      // 1. Running candle coordinates
      let candleX: number | null = null;
      let candleY: number | null = null;

      if (lastCandleTime) {
        try {
          const coord = chart.timeScale().timeToCoordinate(lastCandleTime as any);
          if (coord !== null && !isNaN(coord)) {
            candleX = coord;
          }
        } catch {}
      }

      if (candleX === null || isNaN(candleX) || candleX < 0) {
        candleX = Math.max(100, chartWidth - 85);
      }

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
      for (const tool of drawingTools) {
        try {
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
        } catch {}
      }

      // 3. Active Trades (Quotex style pill badge + horizontal line + dots)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tradeMarkers: any[] = [];

      for (const trade of activeTrades) {
        try {
          // Immediately auto-remove if expired or not active
          const timeLeftMs = trade.expiryTimestamp - now;
          if (timeLeftMs <= 0 || trade.status === 'SETTLED') {
            continue;
          }

          const y = series.priceToCoordinate(trade.entryPrice);
          if (y === null || isNaN(y)) continue;

          const tradeStartSec = Math.floor(trade.createdAt / 1000);
          const tradeExpirySec = Math.floor(trade.expiryTimestamp / 1000);

          let startX = chart.timeScale().timeToCoordinate(tradeStartSec as any);
          let endX = chart.timeScale().timeToCoordinate(tradeExpirySec as any);

          if (startX === null || isNaN(startX)) {
            startX = Math.max(20, (candleX || chartWidth - 100) - 120);
          }
          if (endX === null || isNaN(endX)) {
            endX = Math.min(chartWidth - 50, (candleX || chartWidth - 100) + 90);
          }

          if (endX <= startX) {
            endX = startX + 110;
          }

          const timeLeftSec = Math.ceil(timeLeftMs / 1000);
          const tm = Math.floor(timeLeftSec / 60);
          const ts = timeLeftSec % 60;
          const countdown = `${String(tm).padStart(2, '0')}:${String(ts).padStart(2, '0')}`;

          tradeMarkers.push({
            id: trade.id,
            direction: trade.direction,
            investment: trade.investment,
            entryPrice: trade.entryPrice,
            y,
            startX,
            endX,
            countdown,
            isWinning: false,
          });
        } catch {}
      }

      setPositions({
        candleX,
        candleY,
        chartWidth,
        candleCountdown,
        trades: tradeMarkers,
        toolPositions,
      });

      animFrameRef.current = requestAnimationFrame(updateOverlay);
    };

    animFrameRef.current = requestAnimationFrame(updateOverlay);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [chart, series, activeTrades, timeframe, lastCandleTime, currentPrice, drawingTools]);

  // Dragging logic for on-chart horizontal lines
  const handleMouseDown = useCallback((id: string, currentP: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingToolRef.current = { id, startY: e.clientY, startPrice: currentP };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingToolRef.current || !series || !chart) return;
      // Get chart bounds
      const chartElement = chart.chartElement();
      const rect = chartElement.getBoundingClientRect();
      const localY = moveEvent.clientY - rect.top;

      try {
        const newPrice = series.coordinateToPrice(localY);
        if (newPrice !== null && !isNaN(newPrice) && newPrice > 0) {
          onUpdateDrawingTool?.(draggingToolRef.current.id, {
            price: Number(newPrice.toFixed(4)),
          });
        }
      } catch {}
    };

    const handleMouseUp = () => {
      draggingToolRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [chart, series, onUpdateDrawingTool]);

  const { candleX, candleY, chartWidth, candleCountdown, trades, toolPositions } = positions;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* ========================================================================= */}
      {/* 1. RUNNING CANDLE HORIZONTAL LINE + CENTERED LARGE COUNTDOWN BADGE        */}
      {/* "running candle time countdown ta horizontal line a candle er sathei      */}
      {/*  right side a hok thic line middele a arekto size boro kore dio"          */}
      {/* ========================================================================= */}
      {candleX !== null && candleY !== null && (
        <>
          {/* Subtle vertical dotted guide line at candle time */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: `${candleX}px` }}
          >
            <div className="w-[1px] h-full border-l border-dashed border-amber-400/30" />
          </div>

          {/* Quotex-Style Horizontal Price Line extending rightwards from the candle */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: `${candleY}px`,
              left: `${Math.max(0, candleX)}px`,
              right: '0px',
            }}
          >
            <div className="w-full border-t-2 border-dashed border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
          </div>

          {/* Quotex Running Candle Countdown Badge centered right on this horizontal line, beside the candle */}
          <div
            className="absolute pointer-events-auto select-none transition-transform duration-75"
            style={{
              left: `${Math.min(candleX + 20, Math.max(120, chartWidth - 110))}px`,
              top: `${candleY}px`,
              transform: 'translateY(-50%)',
            }}
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0a0f1d]/95 border-2 border-amber-400 text-amber-300 font-mono font-black text-xs md:text-sm shadow-[0_0_16px_rgba(245,158,11,0.55),0_4px_12px_rgba(0,0,0,0.8)] tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <span>{candleCountdown}</span>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE MANUALLY MOVABLE HORIZONTAL LINES WITH CROSS FUNCTION      */}
      {/* "horizontal line gula jeno manually set and move kora jabe and cross dio" */}
      {/* ========================================================================= */}
      {toolPositions.map((tool) => (
        <div
          key={tool.id}
          className="absolute left-0 right-0 pointer-events-auto select-none group"
          style={{ top: `${tool.y}px`, transform: 'translateY(-50%)' }}
        >
          {/* Draggable Horizontal Line */}
          <div
            onMouseDown={(e) => handleMouseDown(tool.id, tool.price, e)}
            className="w-full h-4 -my-2 flex items-center cursor-ns-resize"
          >
            <div
              className="w-full border-t-2 border-dashed transition-all"
              style={{
                borderColor: tool.color,
                boxShadow: `0 0 10px ${tool.color}66`,
              }}
            />
          </div>

          {/* On-Chart Control Pill (Drag Handle + Price + Cross Delete) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d1322]/95 border shadow-2xl backdrop-blur-md"
            style={{ borderColor: `${tool.color}aa` }}
          >
            {/* Drag Handle */}
            <div
              onMouseDown={(e) => handleMouseDown(tool.id, tool.price, e)}
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
      {/* 3. QUOTEX ACTIVE TRADE PLACEMENT MARKERS                                  */}
      {/* ========================================================================= */}
      {trades.map((trade) => {
        const isUp = trade.direction === 'UP';
        const badgeBg = isUp ? 'bg-[#00c278]' : 'bg-[#f6465d]';
        const lineBorder = isUp ? 'border-[#00c278]' : 'border-[#f6465d]';

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
            {/* Horizontal Entry Line extending from start to expiry */}
            <div
              className={`absolute h-[2px] border-b ${lineBorder} -translate-y-1/2 opacity-90`}
              style={{
                left: `${trade.startX + 95}px`,
                width: `${Math.max(30, trade.endX - (trade.startX + 95))}px`,
              }}
            />

            {/* White Ring Dot on the Entry Point */}
            <div
              className="absolute w-3 h-3 rounded-full bg-white border-2 border-slate-900 shadow-md -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${trade.startX + 95}px`, top: '0px' }}
            />

            {/* White Ring Dot on the Expiry Point */}
            <div
              className="absolute w-3 h-3 rounded-full bg-white border-2 border-slate-900 shadow-md -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${trade.endX}px`, top: '0px' }}
            />

            {/* Quotex Rounded Pill Badge: [ ↓ 1 $  00:55 ] */}
            <div
              className={`absolute -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full text-white shadow-xl ${badgeBg}`}
              style={{ left: `${trade.startX}px`, top: '0px' }}
            >
              <div className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center">
                {isUp ? (
                  <ArrowUp className="w-2.5 h-2.5 text-white stroke-[3]" />
                ) : (
                  <ArrowDown className="w-2.5 h-2.5 text-white stroke-[3]" />
                )}
              </div>

              <span className="font-mono font-bold text-xs">
                {trade.investment} $
              </span>

              <span className="font-mono font-medium text-[11px] opacity-90 ml-0.5">
                {trade.countdown}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
