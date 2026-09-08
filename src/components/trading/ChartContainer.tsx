import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  AreaSeries,
  LineSeries,
  ColorType,
  LineStyle,
  MouseEventParams,
  Time,
} from 'lightweight-charts';
import { MarketSymbol, CandleData, Trade, Timeframe, ConnectionStatus, DrawingToolItem, IndicatorSettings } from '../../types';
import { sound } from '../../utils/audio';
import {
  binanceMarketData,
  timeframeToSeconds,
  formatPriceByPrecision,
  MarketMetrics,
  BinanceTradeEvent,
} from '../../services/binanceMarketData';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Activity,
  Terminal,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Radio,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { TradeMarkersOverlay } from './TradeMarkersOverlay';
import { IndicatorsAndToolsMenu } from './IndicatorsAndToolsMenu';
import { calculateSMA, calculateEMA, calculateBollingerBands, calculateRSI } from '../../utils/indicators';

interface ChartContainerProps {
  symbol: MarketSymbol;
  activeTrades: Trade[];
  currentPrice: number;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  chartType: 'candles' | 'area';
  onChartTypeChange: (type: 'candles' | 'area') => void;
  accountMode: 'DEMO' | 'LIVE';
  onPriceUpdate?: (price: number) => void;
  connectionStatus?: ConnectionStatus;
}

interface HoverCandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  change?: number;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  symbol,
  activeTrades,
  currentPrice: externalCurrentPrice,
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  accountMode,
  onPriceUpdate,
  connectionStatus = 'LIVE',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceLinesRef = useRef<Map<string, any>>(new Map());

  // Indicator Series Refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const smaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bbUpperSeriesRef = useRef<ISeriesApi<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bbMiddleSeriesRef = useRef<ISeriesApi<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bbLowerSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const candlesHistoryRef = useRef<CandleData[]>([]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingCandles, setIsLoadingCandles] = useState(true);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showTradesFeed, setShowTradesFeed] = useState(false);
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [lastCandleTime, setLastCandleTime] = useState<number | undefined>(undefined);

  // Drawing Tools (Horizontal Lines, Quotex style)
  const [drawingTools, setDrawingTools] = useState<DrawingToolItem[]>([]);

  // Indicators State
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    sma: { enabled: false, period: 20, color: '#f59e0b' },
    ema: { enabled: false, period: 14, color: '#06b6d4' },
    bollinger: { enabled: false, period: 20, stdDev: 2.0, color: '#a855f7' },
    rsi: { enabled: false, period: 14, overbought: 70, oversold: 30 },
    macd: { enabled: false, fast: 12, slow: 26, signal: 9 },
  });
  const [currentRsiValue, setCurrentRsiValue] = useState<number | null>(null);

  // Real-time market metrics & trade stream
  const [livePrice, setLivePrice] = useState<number>(symbol.price || externalCurrentPrice || 0);
  const [priceFlash, setPriceFlash] = useState<'UP' | 'DOWN' | null>(null);
  const [clockTime, setClockTime] = useState<string>('');
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [recentTrades, setRecentTrades] = useState<BinanceTradeEvent[]>([]);

  const prevPriceRef = useRef<number>(livePrice);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIndicatorUpdateRef = useRef<number>(0);

  // Live real-time clock ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Drawing tool actions
  const handleAddDrawingTool = useCallback((tool: Omit<DrawingToolItem, 'id'>) => {
    sound.playClick();
    const newTool: DrawingToolItem = {
      ...tool,
      id: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setDrawingTools((prev) => [...prev, newTool]);
  }, []);

  const handleUpdateDrawingTool = useCallback((id: string, updates: Partial<DrawingToolItem>) => {
    setDrawingTools((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const handleDeleteDrawingTool = useCallback((id: string) => {
    sound.playClick();
    setDrawingTools((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClearAllDrawingTools = useCallback(() => {
    sound.playClick();
    setDrawingTools([]);
  }, []);

  // Update indicators logic on chart with comprehensive error boundaries and data validation
  const updateAllIndicators = useCallback(() => {
    if (!chartRef.current || candlesHistoryRef.current.length === 0) return;
    const candles = candlesHistoryRef.current;

    try {
      // 1. SMA
      if (indicators.sma.enabled) {
        if (!smaSeriesRef.current) {
          smaSeriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: indicators.sma.color,
            lineWidth: 2,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
          });
        }
        const smaData = calculateSMA(candles, indicators.sma.period);
        if (smaSeriesRef.current && smaData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          smaSeriesRef.current.setData(smaData as any);
        }
      } else if (smaSeriesRef.current) {
        chartRef.current.removeSeries(smaSeriesRef.current);
        smaSeriesRef.current = null;
      }
    } catch (err) {
      console.warn('SMA indicator update handled:', err);
    }

    try {
      // 2. EMA
      if (indicators.ema.enabled) {
        if (!emaSeriesRef.current) {
          emaSeriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: indicators.ema.color,
            lineWidth: 2,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
          });
        }
        const emaData = calculateEMA(candles, indicators.ema.period);
        if (emaSeriesRef.current && emaData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          emaSeriesRef.current.setData(emaData as any);
        }
      } else if (emaSeriesRef.current) {
        chartRef.current.removeSeries(emaSeriesRef.current);
        emaSeriesRef.current = null;
      }
    } catch (err) {
      console.warn('EMA indicator update handled:', err);
    }

    try {
      // 3. Bollinger Bands
      if (indicators.bollinger.enabled) {
        if (!bbUpperSeriesRef.current) {
          bbUpperSeriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: indicators.bollinger.color,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
          });
          bbMiddleSeriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: indicators.bollinger.color,
            lineWidth: 2,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
          });
          bbLowerSeriesRef.current = chartRef.current.addSeries(LineSeries, {
            color: indicators.bollinger.color,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
          });
        }
        const bb = calculateBollingerBands(candles, indicators.bollinger.period, indicators.bollinger.stdDev);
        if (bb.upper.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bbUpperSeriesRef.current?.setData(bb.upper as any);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bbMiddleSeriesRef.current?.setData(bb.middle as any);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bbLowerSeriesRef.current?.setData(bb.lower as any);
        }
      } else if (bbUpperSeriesRef.current) {
        if (bbUpperSeriesRef.current) chartRef.current.removeSeries(bbUpperSeriesRef.current);
        if (bbMiddleSeriesRef.current) chartRef.current.removeSeries(bbMiddleSeriesRef.current);
        if (bbLowerSeriesRef.current) chartRef.current.removeSeries(bbLowerSeriesRef.current);
        bbUpperSeriesRef.current = null;
        bbMiddleSeriesRef.current = null;
        bbLowerSeriesRef.current = null;
      }
    } catch (err) {
      console.warn('Bollinger Bands indicator update handled:', err);
    }

    try {
      // 4. RSI Calculation
      if (indicators.rsi.enabled) {
        const rsiResult = calculateRSI(candles, indicators.rsi.period);
        setCurrentRsiValue(Number(rsiResult.latestRSI.toFixed(1)));
      } else {
        setCurrentRsiValue(null);
      }
    } catch (err) {
      console.warn('RSI calculation handled:', err);
    }
  }, [indicators]);

  // Supported timeframes
  const allTimeframes: Timeframe[] = [
    '1s',
    '5s',
    '10s',
    '15s',
    '30s',
    '1m',
    '5m',
    '15m',
    '30m',
    '1h',
    '4h',
    '1d',
  ];

  // =========================================================================
  // 1. LIGHTWEIGHT CHARTS INITIALIZATION & LIFECYCLE
  // =========================================================================

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Remove any previous instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
      priceLinesRef.current.clear();
    }

    const container = chartContainerRef.current;
    const isSecondsVisible = ['1s', '5s', '10s', '15s', '30s', '1m'].includes(timeframe);

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#0b0f17' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)', style: LineStyle.Dotted },
      },
      crosshair: {
        vertLine: {
          color: '#3b82f6',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          color: '#3b82f6',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: isSecondsVisible,
        barSpacing: 10,
        minBarSpacing: 3,
        rightOffset: 6,
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        autoScale: true,
        scaleMargins: {
          top: 0.12,
          bottom: 0.12,
        },
      },
    });

    chartRef.current = chart;

    // Series precision
    const precision = symbol.pricePrecision || 2;
    const minMove = symbol.tickSize || 1 / Math.pow(10, precision);

    if (chartType === 'candles') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00c278',
        downColor: '#f6465d',
        borderVisible: false,
        wickUpColor: '#00c278',
        wickDownColor: '#f6465d',
        priceFormat: {
          type: 'price',
          precision,
          minMove,
        },
      });
      seriesRef.current = candleSeries;
    } else {
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(0, 194, 120, 0.35)',
        bottomColor: 'rgba(0, 194, 120, 0.01)',
        lineColor: '#00c278',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision,
          minMove,
        },
      });
      seriesRef.current = areaSeries;
    }

    // 2. Load Historical Candles from Binance
    setIsLoadingCandles(true);
    let isCancelled = false;

    binanceMarketData
      .fetchHistoricalCandles(symbol.symbol, timeframe, 150)
      .then((candles) => {
        if (isCancelled || !seriesRef.current || !chartRef.current) return;

        if (candles.length > 0) {
          candlesHistoryRef.current = [...candles];
          if (chartType === 'candles') {
            seriesRef.current.setData(candles);
          } else {
            seriesRef.current.setData(
              candles.map((c) => ({ time: c.time, value: c.close }))
            );
          }

          chartRef.current.timeScale().fitContent();

          const lastCandle = candles[candles.length - 1];
          setLivePrice(lastCandle.close);
          prevPriceRef.current = lastCandle.close;
          setLastCandleTime(Number(lastCandle.time));

          // Compute initial indicators
          updateAllIndicators();

          // Connect Binance real-time WebSocket market stream seeded with last candle
          binanceMarketData.subscribeMarketStream(symbol.symbol, timeframe, lastCandle);
        } else {
          // Connect stream directly
          binanceMarketData.subscribeMarketStream(symbol.symbol, timeframe);
        }

        setIsLoadingCandles(false);
      })
      .catch((err) => {
        console.warn('Error loading candles:', err);
        if (!isCancelled) {
          binanceMarketData.subscribeMarketStream(symbol.symbol, timeframe);
          setIsLoadingCandles(false);
        }
      });

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
    });
    resizeObserver.observe(container);

    return () => {
      isCancelled = true;
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        smaSeriesRef.current = null;
        emaSeriesRef.current = null;
        bbUpperSeriesRef.current = null;
        bbMiddleSeriesRef.current = null;
        bbLowerSeriesRef.current = null;
      }
    };
  }, [symbol.symbol, timeframe, chartType, symbol.pricePrecision, symbol.tickSize, updateAllIndicators]);

  // Re-run indicators whenever settings change
  useEffect(() => {
    updateAllIndicators();
  }, [indicators, updateAllIndicators]);

  // =========================================================================
  // 2. REAL-TIME CANDLE ENGINE DISPATCH & PRICE FLASH
  // =========================================================================

  useEffect(() => {
    // 1. Subscribe to incremental candle updates (moving candle!)
    const unsubCandle = binanceMarketData.onCandleUpdate((candle, _isNewBar) => {
      if (!seriesRef.current) return;
      try {
        setLastCandleTime(Number(candle.time));
        if (chartType === 'candles') {
          seriesRef.current.update(candle);
        } else {
          seriesRef.current.update({ time: candle.time, value: candle.close });
        }

        // Update candles history for live indicator calculation
        if (candlesHistoryRef.current.length > 0) {
          const lastIdx = candlesHistoryRef.current.length - 1;
          const lastCandle = candlesHistoryRef.current[lastIdx];
          if (lastCandle.time === candle.time) {
            candlesHistoryRef.current[lastIdx] = candle;
          } else if (Number(candle.time) > Number(lastCandle.time)) {
            candlesHistoryRef.current.push(candle);
            if (candlesHistoryRef.current.length > 200) {
              candlesHistoryRef.current.shift();
            }
          }
        } else {
          candlesHistoryRef.current = [candle];
        }

        // Refresh indicators smoothly without overloading chart computation
        const now = Date.now();
        if (_isNewBar || now - lastIndicatorUpdateRef.current > 1200) {
          lastIndicatorUpdateRef.current = now;
          updateAllIndicators();
        }
      } catch {
        // Handled: out-of-order ticks safely ignored
      }
    });

    // 2. Subscribe to incoming Binance trade events for lowest-latency price ticks & flash
    const unsubTrade = binanceMarketData.onTrade((trade) => {
      const newPrice = trade.price;
      const oldPrice = prevPriceRef.current;

      setLivePrice(newPrice);
      if (onPriceUpdate) {
        onPriceUpdate(newPrice);
      }

      // Trigger high-speed price flash animation
      if (newPrice > oldPrice) {
        setPriceFlash('UP');
      } else if (newPrice < oldPrice) {
        setPriceFlash('DOWN');
      }

      prevPriceRef.current = newPrice;

      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      flashTimeoutRef.current = setTimeout(() => {
        setPriceFlash(null);
      }, 250);

      // Keep recent 6 trades for the live ticker
      setRecentTrades((prev) => [trade, ...prev.slice(0, 5)]);
    });

    // 3. Subscribe to market metrics (latency, events/sec, connection status)
    const unsubMetrics = binanceMarketData.onMetrics((m) => {
      setMetrics(m);
    });

    return () => {
      unsubCandle();
      unsubTrade();
      unsubMetrics();
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [chartType, onPriceUpdate]);

  // =========================================================================
  // 3. QUOTEX STYLE ACTIVE TRADE ENTRY PRICE LINES
  // =========================================================================

  useEffect(() => {
    if (!seriesRef.current) return;

    const activeSymbolTrades = activeTrades.filter((t) => t.symbol === symbol.symbol);
    const currentLineIds = new Set(activeSymbolTrades.map((t) => t.id));

    // Remove closed trades
    for (const [id, line] of priceLinesRef.current.entries()) {
      if (!currentLineIds.has(id)) {
        try {
          seriesRef.current.removePriceLine(line);
        } catch {}
        priceLinesRef.current.delete(id);
      }
    }

    // Add or maintain active trade lines
    activeSymbolTrades.forEach((trade) => {
      if (!priceLinesRef.current.has(trade.id)) {
        const isUp = trade.direction === 'UP';
        const color = isUp ? '#00c278' : '#f6465d';
        try {
          const line = seriesRef.current?.createPriceLine({
            price: trade.entryPrice,
            color,
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `${trade.direction} $${trade.investment} [${trade.id.slice(-4)}]`,
          });
          if (line) {
            priceLinesRef.current.set(trade.id, line);
          }
        } catch {}
      }
    });
  }, [activeTrades, symbol.symbol]);

  // =========================================================================
  // 4. CHART ZOOM & VIEW ACTIONS
  // =========================================================================

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    sound.playClick();
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    if (direction === 'reset') {
      timeScale.fitContent();
    } else {
      const currentSpacing = timeScale.width() / 40;
      timeScale.applyOptions({
        barSpacing: direction === 'in' ? currentSpacing * 1.35 : Math.max(2, currentSpacing * 0.7),
      });
    }
  };

  const toggleFullscreen = () => {
    if (!chartContainerRef.current) return;
    sound.playClick();
    if (!isFullscreen) {
      if (chartContainerRef.current.requestFullscreen) {
        chartContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const effectiveStatus = metrics?.wsStatus || connectionStatus;
  const formattedPrice = formatPriceByPrecision(livePrice, symbol.pricePrecision || 2);
  const is24hPositive = symbol.priceChangePercent >= 0;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b0f17] overflow-hidden select-none border border-slate-800/60 rounded-lg shadow-2xl">
      {/* 1. TOP LIVE PRICE & METRICS HUD BAR */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-slate-800/80 bg-[#0e1420]/95 backdrop-blur-md z-20 flex-wrap gap-2">
        {/* Left: Active Pair + Live Price with Flash Animation + 24h Change + Live Time Clock */}
        <div className="flex items-center gap-2.5 md:gap-4 flex-wrap">
          {/* Symbol Display */}
          <div className="flex items-center">
            <span className="text-sm md:text-base font-extrabold text-slate-100 tracking-tight">
              {symbol.displayPair}
            </span>
          </div>

          {/* Live Streaming Price with Flash Feedback */}
          <div className="flex items-center gap-2">
            <div
              className={`font-mono text-base md:text-lg font-bold transition-all duration-200 px-2 py-0.5 rounded ${
                priceFlash === 'UP'
                  ? 'text-emerald-400 bg-emerald-950/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] scale-[1.03]'
                  : priceFlash === 'DOWN'
                  ? 'text-rose-400 bg-rose-950/60 shadow-[0_0_12px_rgba(244,63,94,0.3)] scale-[0.98]'
                  : 'text-slate-100'
              }`}
            >
              {formattedPrice}
            </div>

            {/* 24h Change Badge (Price Movement) */}
            <div
              className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
                is24hPositive
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
              }`}
            >
              {is24hPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {is24hPositive ? `+${symbol.priceChangePercent.toFixed(2)}%` : `${symbol.priceChangePercent.toFixed(2)}%`}
            </div>

            {/* Time Format Clock placed right to the right side of price movement */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#131a29] border border-slate-700/60 text-slate-300 font-mono text-xs shadow-inner">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="tracking-wide font-medium">{clockTime}</span>
            </div>
          </div>
        </div>

        {/* Right: Connection Status + Tools + Debug Toggles */}
        <div className="flex items-center gap-2">
          {/* Live Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border transition-colors ${
              effectiveStatus === 'LIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : effectiveStatus === 'RECONNECTING'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : effectiveStatus === 'DELAYED'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                effectiveStatus === 'LIVE'
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                  : effectiveStatus === 'RECONNECTING'
                  ? 'bg-amber-400 animate-ping'
                  : effectiveStatus === 'DELAYED'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {effectiveStatus === 'LIVE'
                ? '● LIVE'
                : effectiveStatus === 'RECONNECTING'
                ? '◐ RECONNECTING'
                : effectiveStatus === 'DELAYED'
                ? '⚠ DELAYED'
                : '○ OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TIMEFRAMES & CHART TOOLS SUB-BAR */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/60 bg-[#0d121c]/90 z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Single Timeframe Dropdown Selector with Scroll Functionality */}
          <div className="relative">
            <button
              id="timeframe-dropdown-btn"
              onClick={() => {
                sound.playClick();
                setIsTimeframeOpen(!isTimeframeOpen);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/90 hover:bg-slate-700/90 text-amber-400 font-extrabold text-xs rounded border border-slate-700/80 cursor-pointer shadow-sm transition-all"
            >
              <span>Timeframe: {timeframe}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  isTimeframeOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isTimeframeOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 max-h-72 overflow-y-auto custom-scrollbar bg-[#141924] border border-slate-700 rounded-lg shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-1 py-0.5">
                  Seconds
                </div>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {(['1s', '5s', '10s', '15s', '30s'] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => {
                        sound.playClick();
                        onTimeframeChange(tf);
                        setIsTimeframeOpen(false);
                      }}
                      className={`px-2 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                        timeframe === tf
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] uppercase font-bold text-slate-400 px-1 py-0.5">
                  Minutes
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {(['1m', '5m', '15m', '30m'] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => {
                        sound.playClick();
                        onTimeframeChange(tf);
                        setIsTimeframeOpen(false);
                      }}
                      className={`px-2 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                        timeframe === tf
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] uppercase font-bold text-slate-400 px-1 py-0.5">
                  Hours / Day
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(['1h', '4h', '1d'] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => {
                        sound.playClick();
                        onTimeframeChange(tf);
                        setIsTimeframeOpen(false);
                      }}
                      className={`px-2 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                        timeframe === tf
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quotex-Style Unified Indicators & Drawing Tools Menu beside Timeframe */}
          <IndicatorsAndToolsMenu
            currentPrice={livePrice}
            drawingTools={drawingTools}
            onAddDrawingTool={handleAddDrawingTool}
            onUpdateDrawingTool={handleUpdateDrawingTool}
            onDeleteDrawingTool={handleDeleteDrawingTool}
            onClearAllDrawingTools={handleClearAllDrawingTools}
            indicators={indicators}
            onUpdateIndicators={setIndicators}
          />
        </div>

        {/* Right: Chart Type & Zoom Tools */}
        <div className="flex items-center gap-1.5">
          {/* Chart Type Toggle (Candles vs Mountain Area) */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
            <button
              id="chart-type-candles"
              onClick={() => {
                sound.playClick();
                onChartTypeChange('candles');
              }}
              title="Candlestick Chart"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                chartType === 'candles'
                  ? 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="chart-type-area"
              onClick={() => {
                sound.playClick();
                onChartTypeChange('area');
              }}
              title="Area Mountain Chart"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                chartType === 'area'
                  ? 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          {/* Zoom controls */}
          <button
            id="chart-zoom-in"
            onClick={() => handleZoom('in')}
            title="Zoom In"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="chart-zoom-out"
            onClick={() => handleZoom('out')}
            title="Zoom Out"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            id="chart-zoom-reset"
            onClick={() => handleZoom('reset')}
            title="Fit to Screen"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            id="chart-fullscreen"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. MAIN CANVAS CONTAINER */}
      <div className="relative flex-1 w-full h-full min-h-[320px]">
        {/* Quotex Active Trade Markers, Running Candle Timer, and Draggable Horizontal Lines Overlay */}
        <TradeMarkersOverlay
          chart={chartRef.current}
          series={seriesRef.current}
          activeTrades={activeTrades}
          timeframe={timeframe}
          lastCandleTime={lastCandleTime}
          currentPrice={livePrice}
          drawingTools={drawingTools}
          onUpdateDrawingTool={handleUpdateDrawingTool}
          onDeleteDrawingTool={handleDeleteDrawingTool}
        />

        {/* Floating Live RSI Indicator Badge when enabled */}
        {currentRsiValue !== null && (
          <div className="absolute top-3 right-4 z-20 flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0a0f1d]/90 border border-slate-700/80 font-mono text-[11px] shadow-xl backdrop-blur-md">
            <span className="text-slate-400 font-bold">RSI ({indicators.rsi.period}):</span>
            <span
              className={`font-black text-xs ${
                currentRsiValue >= indicators.rsi.overbought
                  ? 'text-rose-400'
                  : currentRsiValue <= indicators.rsi.oversold
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {currentRsiValue}
            </span>
            <span className="text-[9px] text-slate-500 font-sans">
              {currentRsiValue >= indicators.rsi.overbought
                ? 'Overbought'
                : currentRsiValue <= indicators.rsi.oversold
                ? 'Oversold'
                : 'Neutral'}
            </span>
          </div>
        )}

        {/* Loading overlay */}
        {isLoadingCandles && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b0f17]/70 backdrop-blur-sm z-20">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 shadow-2xl">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Connecting Binance Spot stream & building candles...</span>
            </div>
          </div>
        )}

        {/* DEBUG PANEL HUD (Floating in top-left or top-right) */}
        {showDebugPanel && metrics && (
          <div className="absolute top-3 left-3 z-30 w-72 bg-[#090d16]/95 border border-blue-500/40 rounded-lg p-3 text-[11px] font-mono shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-blue-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Binance WebSocket Monitor
              </span>
              <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300">
                {metrics.wsStatus}
              </span>
            </div>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Active Symbol:</span>
                <span className="text-slate-100 font-bold">{metrics.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Timeframe:</span>
                <span className="text-amber-400 font-bold">
                  {metrics.timeframe} ({timeframeToSeconds(metrics.timeframe)}s)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data Latency:</span>
                <span
                  className={
                    metrics.latencyMs < 100
                      ? 'text-emerald-400 font-bold'
                      : metrics.latencyMs < 300
                      ? 'text-amber-400 font-bold'
                      : 'text-rose-400 font-bold'
                  }
                >
                  {metrics.latencyMs} ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trade Ticks/Sec:</span>
                <span className="text-blue-400 font-bold">{metrics.eventsPerSecond} eps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Trade Time:</span>
                <span className="text-slate-200">
                  {metrics.lastTradeTime > 0
                    ? new Date(metrics.lastTradeTime).toISOString().slice(11, 23)
                    : '--'}
                </span>
              </div>
              {metrics.currentCandle && (
                <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Current Building Candle
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                    <div>
                      <span className="text-slate-500">O:</span> {metrics.currentCandle.open}
                    </div>
                    <div>
                      <span className="text-slate-500">H:</span> {metrics.currentCandle.high}
                    </div>
                    <div>
                      <span className="text-slate-500">L:</span> {metrics.currentCandle.low}
                    </div>
                    <div>
                      <span className="text-slate-500">C:</span> {metrics.currentCandle.close}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RECENT TRADES MINI-STREAM (Floating in bottom-left) */}
        {showTradesFeed && recentTrades.length > 0 && (
          <div className="absolute bottom-4 left-3 z-30 w-56 bg-[#090d16]/95 border border-slate-800 rounded-lg p-2 text-[10px] font-mono shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-slate-400 font-bold">
              <span>Live Binance Trades</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="space-y-1">
              {recentTrades.map((t) => (
                <div
                  key={`${t.tradeId}-${t.tradeTime}`}
                  className="flex items-center justify-between text-slate-300"
                >
                  <span
                    className={
                      t.isBuyerMaker ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'
                    }
                  >
                    {formatPriceByPrecision(t.price, symbol.pricePrecision || 2)}
                  </span>
                  <span className="text-slate-400">{t.quantity.toFixed(4)}</span>
                  <span className="text-slate-500">
                    {new Date(t.tradeTime).toLocaleTimeString('en-US', {
                      hour12: false,
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightweight Charts Mount Element */}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
