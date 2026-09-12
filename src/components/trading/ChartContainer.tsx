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
import { otcMarketData } from '../../services/otcMarketData';
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
  Clock,
  Radio,
  AlertTriangle,
  ChevronDown,
  Grid,
  Check,
} from 'lucide-react';
import { TradeMarkersOverlay } from './TradeMarkersOverlay';
import { IndicatorsAndToolsMenu } from './IndicatorsAndToolsMenu';
import { UtcTimeSelector } from './UtcTimeSelector';
import { ActiveToolsFloatingBar } from './ActiveToolsFloatingBar';
import {
  calculateSMA,
  calculateEMA,
  calculateWMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateParabolicSAR,
  calculateStochastic,
} from '../../utils/indicators';

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
  onOpenSelector?: () => void;
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
  onOpenSelector,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wmaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sarSeriesRef = useRef<ISeriesApi<any> | null>(null);
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
    wma: { enabled: false, period: 14, color: '#10b981' },
    stochastic: { enabled: false, kPeriod: 14, dPeriod: 3, slowing: 3, overbought: 80, oversold: 20 },
    parabolicSar: { enabled: false, step: 0.02, max: 0.2, color: '#f43f5e' },
  });
  const [currentRsiValue, setCurrentRsiValue] = useState<number | null>(null);
  const [currentStochasticValue, setCurrentStochasticValue] = useState<{
    k: number;
    d: number;
  } | null>(null);
  const [currentMacdValue, setCurrentMacdValue] = useState<{
    macdLine: number;
    signalLine: number;
    histogram: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  } | null>(null);

  // Indicators ref for stable, non-disruptive chart series updates
  const indicatorsRef = useRef<IndicatorSettings>(indicators);
  useEffect(() => {
    indicatorsRef.current = indicators;
  }, [indicators]);

  // Chart Background Grid Function State ('crisp' | 'dense' | 'dotted' | 'off')
  type ChartGridMode = 'crisp' | 'dense' | 'dotted' | 'off';
  const [gridMode, setGridMode] = useState<ChartGridMode>('crisp');
  const lastActiveGridModeRef = useRef<ChartGridMode>('crisp');
  const [isGridDropdownOpen, setIsGridDropdownOpen] = useState(false);
  const gridDropdownRef = useRef<HTMLDivElement>(null);

  // Toggle Grid ON / OFF directly
  const handleToggleGrid = () => {
    sound.playClick();
    if (gridMode === 'off') {
      const restoreMode = lastActiveGridModeRef.current !== 'off' ? lastActiveGridModeRef.current : 'crisp';
      setGridMode(restoreMode);
    } else {
      lastActiveGridModeRef.current = gridMode;
      setGridMode('off');
    }
  };

  // Close grid dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gridDropdownRef.current && !gridDropdownRef.current.contains(e.target as Node)) {
        setIsGridDropdownOpen(false);
      }
    };
    if (isGridDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGridDropdownOpen]);

  // Helper to get grid styling configuration for lightweight-charts
  const getGridOptions = useCallback((mode: ChartGridMode) => {
    switch (mode) {
      case 'crisp':
        // High visibility dashed grid for technical analysis & key price level alignments
        return {
          vertLines: { color: 'rgba(71, 85, 105, 0.45)', style: LineStyle.Dashed },
          horzLines: { color: 'rgba(71, 85, 105, 0.45)', style: LineStyle.Dashed },
        };
      case 'dense':
        // Solid high-precision scalping grid
        return {
          vertLines: { color: 'rgba(100, 116, 139, 0.4)', style: LineStyle.Solid },
          horzLines: { color: 'rgba(100, 116, 139, 0.4)', style: LineStyle.Solid },
        };
      case 'dotted':
        // Classic Quotex dotted grid
        return {
          vertLines: { color: 'rgba(71, 85, 105, 0.45)', style: LineStyle.Dotted },
          horzLines: { color: 'rgba(71, 85, 105, 0.45)', style: LineStyle.Dotted },
        };
      case 'off':
        // Clean dark canvas without grid lines
        return {
          vertLines: { color: 'rgba(0, 0, 0, 0)', style: LineStyle.Solid },
          horzLines: { color: 'rgba(0, 0, 0, 0)', style: LineStyle.Solid },
        };
    }
  }, []);

  // Update chart grid dynamically when trader changes grid mode
  useEffect(() => {
    if (!chartRef.current) return;
    try {
      chartRef.current.applyOptions({
        grid: getGridOptions(gridMode),
      });
    } catch (e) {
      console.warn('Failed to update chart grid options:', e);
    }
  }, [gridMode, getGridOptions]);

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

  // Duplicate / Double Tool handler ("mane double")
  const handleDuplicateDrawingTool = useCallback((id: string) => {
    sound.playClick();
    setDrawingTools((prev) => {
      const toolToCopy = prev.find((t) => t.id === id);
      if (!toolToCopy) return prev;
      const ref = toolToCopy.price || 1;
      const offset = ref * 0.0012; // 0.12% offset so both lines are clearly visible on the chart
      const formatP = (p: number) => {
        if (ref >= 1000) return Number(p.toFixed(2));
        if (ref >= 1) return Number(p.toFixed(4));
        if (ref >= 0.01) return Number(p.toFixed(6));
        return Number(p.toFixed(8));
      };

      const duplicatedTool: DrawingToolItem = {
        ...toolToCopy,
        id: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        price: formatP(toolToCopy.price + offset),
        price2: toolToCopy.price2 ? formatP(toolToCopy.price2 + offset) : undefined,
        highPrice: toolToCopy.highPrice ? formatP(toolToCopy.highPrice + offset) : undefined,
        lowPrice: toolToCopy.lowPrice ? formatP(toolToCopy.lowPrice + offset) : undefined,
        label: toolToCopy.label || 'Tool Line',
      };
      return [...prev, duplicatedTool];
    });
  }, []);

  const handleClearAllDrawingTools = useCallback(() => {
    sound.playClick();
    setDrawingTools([]);
  }, []);

  // Update indicators logic on chart with comprehensive error boundaries and data validation
  const updateAllIndicators = useCallback(() => {
    if (!chartRef.current || candlesHistoryRef.current.length < 5) return;
    const candles = candlesHistoryRef.current;
    const currentInd = indicatorsRef.current;

    try {
      // 1. SMA (Simple Moving Average)
      if (currentInd.sma.enabled && chartRef.current) {
        if (!smaSeriesRef.current) {
          try {
            smaSeriesRef.current = chartRef.current.addSeries(LineSeries, {
              color: currentInd.sma.color || '#f59e0b',
              lineWidth: 2,
              priceLineVisible: false,
              crosshairMarkerVisible: false,
              lastValueVisible: false,
            });
          } catch (e) {
            console.warn('Failed to add SMA series:', e);
          }
        }
        const smaData = calculateSMA(candles, currentInd.sma.period || 20);
        if (smaSeriesRef.current && smaData.length > 0) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            smaSeriesRef.current.setData(smaData as any);
          } catch (e) {
            console.warn('SMA setData error:', e);
          }
        }
      } else if (smaSeriesRef.current && chartRef.current) {
        try {
          chartRef.current.removeSeries(smaSeriesRef.current);
        } catch (e) {
          console.warn('SMA remove error:', e);
        }
        smaSeriesRef.current = null;
      }
    } catch (err) {
      console.warn('SMA indicator update handled:', err);
    }

    try {
      // 2. EMA (Exponential Moving Average)
      if (currentInd.ema.enabled && chartRef.current) {
        if (!emaSeriesRef.current) {
          try {
            emaSeriesRef.current = chartRef.current.addSeries(LineSeries, {
              color: currentInd.ema.color || '#06b6d4',
              lineWidth: 2,
              priceLineVisible: false,
              crosshairMarkerVisible: false,
              lastValueVisible: false,
            });
          } catch (e) {
            console.warn('Failed to add EMA series:', e);
          }
        }
        const emaData = calculateEMA(candles, currentInd.ema.period || 14);
        if (emaSeriesRef.current && emaData.length > 0) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            emaSeriesRef.current.setData(emaData as any);
          } catch (e) {
            console.warn('EMA setData error:', e);
          }
        }
      } else if (emaSeriesRef.current && chartRef.current) {
        try {
          chartRef.current.removeSeries(emaSeriesRef.current);
        } catch (e) {
          console.warn('EMA remove error:', e);
        }
        emaSeriesRef.current = null;
      }
    } catch (err) {
      console.warn('EMA indicator update handled:', err);
    }

    try {
      // 3. Bollinger Bands (Upper, Middle, Lower)
      if (currentInd.bollinger.enabled && chartRef.current) {
        if (!bbUpperSeriesRef.current) {
          try {
            bbUpperSeriesRef.current = chartRef.current.addSeries(LineSeries, {
              color: currentInd.bollinger.color || '#a855f7',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              priceLineVisible: false,
              crosshairMarkerVisible: false,
              lastValueVisible: false,
            });
            bbMiddleSeriesRef.current = chartRef.current.addSeries(LineSeries, {
              color: currentInd.bollinger.color || '#a855f7',
              lineWidth: 2,
              priceLineVisible: false,
              crosshairMarkerVisible: false,
              lastValueVisible: false,
            });
            bbLowerSeriesRef.current = chartRef.current.addSeries(LineSeries, {
              color: currentInd.bollinger.color || '#a855f7',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              priceLineVisible: false,
              crosshairMarkerVisible: false,
              lastValueVisible: false,
            });
          } catch (e) {
            console.warn('Failed to add Bollinger series:', e);
          }
        }
        const bb = calculateBollingerBands(
          candles,
          currentInd.bollinger.period || 20,
          currentInd.bollinger.stdDev || 2.0
        );
        if (bb.upper.length > 0 && bbUpperSeriesRef.current) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            bbUpperSeriesRef.current?.setData(bb.upper as any);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            bbMiddleSeriesRef.current?.setData(bb.middle as any);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            bbLowerSeriesRef.current?.setData(bb.lower as any);
          } catch (e) {
            console.warn('Bollinger setData error:', e);
          }
        }
      } else if (bbUpperSeriesRef.current && chartRef.current) {
        try {
          if (bbUpperSeriesRef.current) chartRef.current.removeSeries(bbUpperSeriesRef.current);
          if (bbMiddleSeriesRef.current) chartRef.current.removeSeries(bbMiddleSeriesRef.current);
          if (bbLowerSeriesRef.current) chartRef.current.removeSeries(bbLowerSeriesRef.current);
        } catch (e) {
          console.warn('Bollinger remove error:', e);
        }
        bbUpperSeriesRef.current = null;
        bbMiddleSeriesRef.current = null;
        bbLowerSeriesRef.current = null;
      }
    } catch (err) {
      console.warn('Bollinger Bands indicator update handled:', err);
    }

    try {
      // 4. RSI Calculation
      if (currentInd.rsi.enabled) {
        const rsiResult = calculateRSI(candles, currentInd.rsi.period || 14);
        setCurrentRsiValue(Number(rsiResult.latestRSI.toFixed(1)));
      } else {
        setCurrentRsiValue(null);
      }
    } catch (err) {
      console.warn('RSI calculation handled:', err);
    }

    try {
      // 5. MACD Calculation
      if (currentInd.macd?.enabled) {
        const macdResult = calculateMACD(
          candles,
          currentInd.macd.fast || 12,
          currentInd.macd.slow || 26,
          currentInd.macd.signal || 9
        );
        setCurrentMacdValue(macdResult);
      } else {
        setCurrentMacdValue(null);
      }
    } catch (err) {
      console.warn('MACD calculation handled:', err);
    }

    try {
      // 6. WMA (Weighted Moving Average)
      if (currentInd.wma?.enabled && chartRef.current) {
        if (!wmaSeriesRef.current) {
          try {
            wmaSeriesRef.current = chartRef.current.addSeries(LineSeries, {
              color: currentInd.wma.color || '#10b981',
              lineWidth: 2,
              priceLineVisible: false,
              crosshairMarkerVisible: false,
              lastValueVisible: false,
            });
          } catch (e) {
            console.warn('Failed to add WMA series:', e);
          }
        }
        const wmaData = calculateWMA(candles, currentInd.wma.period || 14);
        if (wmaSeriesRef.current && wmaData.length > 0) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            wmaSeriesRef.current.setData(wmaData as any);
          } catch (e) {
            console.warn('WMA setData error:', e);
          }
        }
      } else if (wmaSeriesRef.current && chartRef.current) {
        try {
          chartRef.current.removeSeries(wmaSeriesRef.current);
        } catch (e) {
          console.warn('WMA remove error:', e);
        }
        wmaSeriesRef.current = null;
      }
    } catch (err) {
      console.warn('WMA indicator update handled:', err);
    }

    try {
      // 7. Parabolic SAR
      if (currentInd.parabolicSar?.enabled && chartRef.current) {
        if (!sarSeriesRef.current) {
          try {
            sarSeriesRef.current = chartRef.current.addSeries(LineSeries, {
              color: currentInd.parabolicSar.color || '#f43f5e',
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              priceLineVisible: false,
              crosshairMarkerVisible: false,
              lastValueVisible: false,
            });
          } catch (e) {
            console.warn('Failed to add SAR series:', e);
          }
        }
        const sarData = calculateParabolicSAR(
          candles,
          currentInd.parabolicSar.step || 0.02,
          currentInd.parabolicSar.max || 0.2
        );
        if (sarSeriesRef.current && sarData.length > 0) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sarSeriesRef.current.setData(sarData as any);
          } catch (e) {
            console.warn('SAR setData error:', e);
          }
        }
      } else if (sarSeriesRef.current && chartRef.current) {
        try {
          chartRef.current.removeSeries(sarSeriesRef.current);
        } catch (e) {
          console.warn('SAR remove error:', e);
        }
        sarSeriesRef.current = null;
      }
    } catch (err) {
      console.warn('SAR indicator update handled:', err);
    }

    try {
      // 8. Stochastic Oscillator
      if (currentInd.stochastic?.enabled) {
        const stochResult = calculateStochastic(
          candles,
          currentInd.stochastic.kPeriod || 14,
          currentInd.stochastic.dPeriod || 3,
          currentInd.stochastic.slowing || 3
        );
        setCurrentStochasticValue({
          k: stochResult.latestK,
          d: stochResult.latestD,
        });
      } else {
        setCurrentStochasticValue(null);
      }
    } catch (err) {
      console.warn('Stochastic calculation handled:', err);
    }
  }, []);

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

    // Remove any previous instance safely
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        console.warn('Chart remove warning:', e);
      }
      chartRef.current = null;
      seriesRef.current = null;
      smaSeriesRef.current = null;
      emaSeriesRef.current = null;
      bbUpperSeriesRef.current = null;
      bbMiddleSeriesRef.current = null;
      bbLowerSeriesRef.current = null;
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
      grid: getGridOptions(gridMode),
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

    // 2. Load Historical Candles (Unified Binance & Binance-backed OTC stream)
    setIsLoadingCandles(true);
    let isCancelled = false;

    const activeService = binanceMarketData;
    const candlePromise = binanceMarketData.fetchHistoricalCandles(symbol.symbol, timeframe, 150);

    candlePromise
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

          // Connect real-time WebSocket market stream seeded with last candle
          activeService.subscribeMarketStream(symbol.symbol, timeframe, lastCandle);
        } else {
          // Connect stream directly
          activeService.subscribeMarketStream(symbol.symbol, timeframe);
        }

        setIsLoadingCandles(false);
      })
      .catch((err) => {
        console.warn('Error loading candles:', err);
        if (!isCancelled) {
          activeService.subscribeMarketStream(symbol.symbol, timeframe);
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
  }, [symbol.symbol, timeframe, chartType, symbol.pricePrecision, symbol.tickSize]);

  // Re-run indicators whenever settings change
  useEffect(() => {
    updateAllIndicators();
  }, [indicators, updateAllIndicators]);

  // =========================================================================
  // 2. REAL-TIME CANDLE ENGINE DISPATCH & PRICE FLASH
  // =========================================================================

  useEffect(() => {
    const activeService = binanceMarketData;

    // 1. Subscribe to incremental candle updates (moving candle!)
    const unsubCandle = activeService.onCandleUpdate((candle, _isNewBar) => {
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

    // 2. Subscribe to incoming trade events for lowest-latency price ticks & flash
    const unsubTrade = activeService.onTrade((trade) => {
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
    const unsubMetrics = activeService.onMetrics((m) => {
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
  }, [symbol.symbol, symbol.isOtc, symbol.priceSource, chartType, onPriceUpdate]);

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

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b0f17] overflow-hidden select-none border border-slate-800/60 rounded-lg shadow-2xl">
      {/* 1. TIMEFRAMES & CHART TOOLS BAR */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/60 bg-[#0d121c]/90 z-40 flex-wrap gap-2">
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
            onDuplicateDrawingTool={handleDuplicateDrawingTool}
            onDeleteDrawingTool={handleDeleteDrawingTool}
            onClearAllDrawingTools={handleClearAllDrawingTools}
            indicators={indicators}
            onUpdateIndicators={(updates) =>
              setIndicators((prev) => ({
                ...prev,
                ...updates,
              }))
            }
          />

          {/* Interactive User-Selectable UTC Timezone Clock & Selector */}
          <UtcTimeSelector />

          {/* Chart Background Grid Function Selector with 1-Click ON/OFF Toggle */}
          <div className="relative flex items-center" ref={gridDropdownRef}>
            {/* Direct 1-Click Toggle Button */}
            <button
              id="chart-grid-toggle-btn"
              onClick={handleToggleGrid}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-l text-xs font-bold border transition-all cursor-pointer select-none active:scale-95 ${
                gridMode !== 'off'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={gridMode !== 'off' ? 'Click to turn Grid OFF' : 'Click to turn Grid ON'}
            >
              <Grid className={`w-3.5 h-3.5 ${gridMode !== 'off' ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="capitalize text-xs">
                Grid: <span className={gridMode !== 'off' ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-bold'}>{gridMode === 'off' ? 'OFF' : gridMode}</span>
              </span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  gridMode !== 'off'
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse'
                    : 'bg-rose-500/80'
                }`}
              />
            </button>

            {/* Dropdown Chevron Trigger for Grid Styles */}
            <button
              id="chart-grid-options-chevron-btn"
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                setIsGridDropdownOpen(!isGridDropdownOpen);
              }}
              className={`px-1.5 py-1 rounded-r border-y border-r text-xs transition-all cursor-pointer ${
                gridMode !== 'off'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Change Grid Style (Crisp, Dense, Dotted)"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  isGridDropdownOpen ? 'rotate-180 text-amber-400' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Grid Style & Options Dropdown Menu */}
            {isGridDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-[#0d1322]/98 backdrop-blur-xl border border-slate-700/90 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
                {/* Direct On/Off Switch Row */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-1">
                  <span className="text-[11px] font-black text-slate-200">Grid Lines Display</span>
                  <button
                    id="grid-menu-quick-toggle"
                    onClick={() => {
                      handleToggleGrid();
                      setIsGridDropdownOpen(false);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                      gridMode !== 'off'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {gridMode !== 'off' ? '● ON' : '○ OFF'}
                  </button>
                </div>

                <div className="text-[9px] font-black text-slate-400 px-1 py-0.5 uppercase tracking-wider mb-1">
                  Grid Patterns
                </div>

                {[
                  { id: 'crisp', label: 'Crisp Dashed', desc: 'Optimal level tracking' },
                  { id: 'dense', label: 'Dense Solid', desc: 'High precision scalper grid' },
                  { id: 'dotted', label: 'Dotted Grid', desc: 'Subtle technical guidance' },
                  { id: 'off', label: 'Grid Off', desc: 'Clean dark canvas without lines' },
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`chart-grid-option-${item.id}`}
                    onClick={() => {
                      sound.playClick();
                      if (item.id !== 'off') {
                        lastActiveGridModeRef.current = item.id as ChartGridMode;
                      }
                      setGridMode(item.id as ChartGridMode);
                      setIsGridDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left mb-0.5 ${
                      gridMode === item.id
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{item.label}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{item.desc}</div>
                    </div>
                    {gridMode === item.id && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Status, Chart Type & Zoom Tools */}
        <div className="flex items-center gap-1.5">
          {/* Live Status Indicator */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
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
              className={`w-1.5 h-1.5 rounded-full ${
                effectiveStatus === 'LIVE'
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                  : effectiveStatus === 'RECONNECTING'
                  ? 'bg-amber-400 animate-ping'
                  : effectiveStatus === 'DELAYED'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="hidden sm:inline">
              {effectiveStatus === 'LIVE'
                ? 'LIVE'
                : effectiveStatus === 'RECONNECTING'
                ? 'RECONNECTING'
                : effectiveStatus === 'DELAYED'
                ? 'DELAYED'
                : 'OFFLINE'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

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
        {/* Quotex-Style Persistent Active Tools Floating Bar */}
        <ActiveToolsFloatingBar
          drawingTools={drawingTools}
          indicators={indicators}
          onUpdateDrawingTool={handleUpdateDrawingTool}
          onDuplicateDrawingTool={handleDuplicateDrawingTool}
          onDeleteDrawingTool={handleDeleteDrawingTool}
          onClearAllDrawingTools={handleClearAllDrawingTools}
          onUpdateIndicators={(updates) =>
            setIndicators((prev) => ({
              ...prev,
              ...updates,
            }))
          }
        />

        {/* Quotex Active Trade Markers, Running Candle Timer, and Draggable Horizontal Lines Overlay */}
        <TradeMarkersOverlay
          chart={chartRef.current}
          series={seriesRef.current}
          activeTrades={activeTrades}
          timeframeSeconds={
            timeframe === '5s'
              ? 5
              : timeframe === '15s'
              ? 15
              : timeframe === '30s'
              ? 30
              : timeframe === '1m'
              ? 60
              : timeframe === '5m'
              ? 300
              : timeframe === '15m'
              ? 900
              : timeframe === '1h'
              ? 3600
              : 86400
          }
          currentPrice={livePrice}
          drawingTools={drawingTools}
          onUpdateDrawingTool={handleUpdateDrawingTool}
          onDuplicateDrawingTool={handleDuplicateDrawingTool}
          onDeleteDrawingTool={handleDeleteDrawingTool}
        />

        {/* Floating Live Stochastic Oscillator Badge when enabled */}
        {currentStochasticValue !== null && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0a0f1d]/90 border border-amber-500/50 font-mono text-[11px] shadow-xl backdrop-blur-md">
            <span className="text-amber-400 font-bold">Stochastic ({indicators.stochastic?.kPeriod},{indicators.stochastic?.dPeriod}):</span>
            <span className="text-emerald-400 font-bold">%K: {currentStochasticValue.k}</span>
            <span className="text-sky-400 font-bold">%D: {currentStochasticValue.d}</span>
          </div>
        )}

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

        {/* Floating Live MACD Indicator Badge when enabled */}
        {currentMacdValue !== null && (
          <div className="absolute top-11 right-4 z-20 flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0a0f1d]/90 border border-slate-700/80 font-mono text-[11px] shadow-xl backdrop-blur-md">
            <span className="text-purple-400 font-bold">MACD ({indicators.macd.fast},{indicators.macd.slow},{indicators.macd.signal}):</span>
            <span className="text-blue-400 font-mono text-[10px]">{currentMacdValue.macdLine.toFixed(2)}</span>
            <span className="text-amber-400 font-mono text-[10px]">Sig: {currentMacdValue.signalLine.toFixed(2)}</span>
            <span
              className={`font-black text-xs ${
                currentMacdValue.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              Hist: {currentMacdValue.histogram >= 0 ? `+${currentMacdValue.histogram.toFixed(2)}` : currentMacdValue.histogram.toFixed(2)}
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
