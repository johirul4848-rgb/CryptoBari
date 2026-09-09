import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders,
  ChevronDown,
  Layers,
  Activity,
  Plus,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Minus,
  Check,
  Crosshair,
  Percent,
} from 'lucide-react';
import { IndicatorSettings, DrawingToolItem } from '../../types';
import { sound } from '../../utils/audio';

interface IndicatorsAndToolsMenuProps {
  currentPrice: number;
  drawingTools: DrawingToolItem[];
  onAddDrawingTool: (tool: Omit<DrawingToolItem, 'id'>) => void;
  onUpdateDrawingTool: (id: string, updates: Partial<DrawingToolItem>) => void;
  onDeleteDrawingTool: (id: string) => void;
  onClearAllDrawingTools: () => void;
  indicators: IndicatorSettings;
  onUpdateIndicators: (updates: Partial<IndicatorSettings>) => void;
}

export const IndicatorsAndToolsMenu: React.FC<IndicatorsAndToolsMenuProps> = ({
  currentPrice,
  drawingTools,
  onAddDrawingTool,
  onUpdateDrawingTool,
  onDeleteDrawingTool,
  onClearAllDrawingTools,
  indicators,
  onUpdateIndicators,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'drawings' | 'indicators'>('drawings');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside on desktop
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const activeDrawingsCount = drawingTools.length;
  const activeIndicatorsCount = [
    indicators.sma.enabled,
    indicators.ema.enabled,
    indicators.bollinger.enabled,
    indicators.rsi.enabled,
    indicators.macd?.enabled,
  ].filter(Boolean).length;

  const totalActive = activeDrawingsCount + activeIndicatorsCount;

  // Add Horizontal Support/Resistance Line
  const handleAddHorizontalLine = (type: 'current' | 'support' | 'resistance') => {
    sound.playClick();
    let price = currentPrice;
    let label = 'Horizontal Line';
    let color = '#f59e0b'; // Amber

    if (type === 'support') {
      price = currentPrice * 0.998;
      label = 'Support Line';
      color = '#10b981'; // Emerald
    } else if (type === 'resistance') {
      price = currentPrice * 1.002;
      label = 'Resistance Line';
      color = '#f43f5e'; // Rose
    }

    onAddDrawingTool({
      type: 'horizontal_line',
      price: Number(price.toFixed(4)),
      color,
      label,
      lineWidth: 2,
    });
  };

  // Add Fibonacci Retracement Tool ("fibola retchment tools")
  const handleAddFibonacciRetracement = () => {
    sound.playClick();
    const highPrice = Number((currentPrice * 1.006).toFixed(4));
    const lowPrice = Number((currentPrice * 0.994).toFixed(4));

    onAddDrawingTool({
      type: 'fibonacci',
      price: Number(currentPrice.toFixed(4)),
      highPrice,
      lowPrice,
      color: '#38bdf8', // Sky blue
      label: 'Fibonacci Retracement (0% - 100%)',
      lineWidth: 2,
    });
  };

  // Nudge line price manually
  const handleNudgePrice = (id: string, currentP: number, dir: 'up' | 'down') => {
    sound.playClick();
    const step = currentP * 0.0005; // 0.05% step
    const newPrice = dir === 'up' ? currentP + step : currentP - step;
    onUpdateDrawingTool(id, { price: Number(newPrice.toFixed(4)) });
  };

  const colorPalette = [
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Cyan', value: '#06b6d4' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Purple', value: '#a855f7' },
    { label: 'White', value: '#ffffff' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button with 3D status badge */}
      <button
        id="indicators-tools-dropdown-btn"
        onClick={() => {
          sound.playClick();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-lg border transition-all cursor-pointer shadow-sm select-none ${
          isOpen || totalActive > 0
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600'
        }`}
      >
        <Sliders className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Tools & Indicators</span>
        <span className="sm:hidden">Tools</span>
        {totalActive > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
            {totalActive}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Backdrop for Mobile Outside Dismiss */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Modern Responsive Panel (Docked bottom sheet on mobile, anchored left dropdown on web) */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-3 sm:fixed-none sm:absolute sm:top-full sm:left-0 sm:right-auto sm:mt-1.5 w-auto sm:w-[410px] max-h-[82vh] overflow-y-auto custom-scrollbar bg-[#0c1220]/98 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-3.5 sm:p-4 z-50 animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-2 duration-150 select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-100 uppercase tracking-wider block">
                  Tools & Indicators
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Interactive Chart Analysis</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs: Drawings vs Indicators */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl mb-3 border border-white/5 text-xs font-extrabold">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('drawings');
              }}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'drawings'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Drawing Tools ({activeDrawingsCount})</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('indicators');
              }}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'indicators'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Indicators ({activeIndicatorsCount})</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: DRAWING TOOLS (HORIZONTAL LINES, SUPPORT, RESISTANCE, FIBONACCI)     */}
          {/* ========================================================================= */}
          {activeTab === 'drawings' && (
            <div className="space-y-3">
              {/* Action Buttons to Add Tools */}
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 tracking-wider flex items-center justify-between">
                  <span>Add Lines & Fibonacci</span>
                  <span className="text-amber-400 font-normal">Interactive Chart Tools</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  <button
                    onClick={() => handleAddHorizontalLine('current')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1 text-amber-400 text-[11px] font-black">
                      <Plus className="w-3 h-3" />
                      <span>Horizontal Line</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">At current live price</div>
                  </button>

                  <button
                    id="add-fibonacci-tool-btn"
                    onClick={handleAddFibonacciRetracement}
                    className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-500/50 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1 text-sky-400 text-[11px] font-black">
                      <Percent className="w-3 h-3" />
                      <span>Fibonacci Retrace</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">0%, 23.6%, 38.2%, 50%, 61.8%</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleAddHorizontalLine('support')}
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-black">
                      <ArrowUp className="w-3 h-3" />
                      <span>Support Line</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Below market baseline</div>
                  </button>

                  <button
                    onClick={() => handleAddHorizontalLine('resistance')}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1 text-rose-400 text-[11px] font-black">
                      <ArrowDown className="w-3 h-3" />
                      <span>Resistance Line</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Above market resistance</div>
                  </button>
                </div>
              </div>

              {/* Active Tools List */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                    Active Chart Tools ({drawingTools.length})
                  </span>
                  {drawingTools.length > 0 && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onClearAllDrawingTools();
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear All
                    </button>
                  )}
                </div>

                {drawingTools.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center text-xs text-slate-400">
                    <Crosshair className="w-6 h-6 text-slate-500 mx-auto mb-1.5 opacity-60" />
                    <p className="font-semibold text-slate-300">No active drawing lines</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Click Horizontal or Fibonacci above to place onto the chart. You can drag lines, adjust, or delete them anytime.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {drawingTools.map((tool, idx) => (
                      <div
                        key={tool.id}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 transition-all hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shadow-sm shrink-0 ring-1 ring-white/20"
                              style={{ backgroundColor: tool.color }}
                            />
                            <span className="text-xs font-bold text-slate-200">
                              {tool.label || (tool.type === 'fibonacci' ? 'Fibonacci Retracement' : `Line ${idx + 1}`)}
                            </span>
                            {tool.type === 'fibonacci' && (
                              <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-black border border-sky-500/30">
                                FIB
                              </span>
                            )}
                          </div>

                          {/* Delete Cross (X) button */}
                          <button
                            id={`delete-line-${tool.id}`}
                            onClick={() => {
                              sound.playClick();
                              onDeleteDrawingTool(tool.id);
                            }}
                            title="Delete this tool"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price Display & Manual Controls */}
                        {tool.type === 'fibonacci' ? (
                          <div className="bg-black/40 rounded-lg p-2 border border-white/5 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[11px] text-slate-300">
                              <span>0.0% High:</span>
                              <span className="font-mono font-bold text-sky-300">${tool.highPrice}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-300">
                              <span>100.0% Low:</span>
                              <span className="font-mono font-bold text-sky-300">${tool.lowPrice}</span>
                            </div>
                            <div className="text-[9px] text-slate-500 pt-0.5">
                              Levels: 23.6%, 38.2%, 50%, 61.8% (Golden Pocket), 78.6%
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-black/40 rounded-lg p-1.5 border border-white/5 text-xs">
                            <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                              <span>Price:</span>
                              <span className="font-mono font-bold text-slate-100">${tool.price}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 mr-1">Move:</span>
                              <button
                                onClick={() => handleNudgePrice(tool.id, tool.price, 'down')}
                                title="Move Down"
                                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center cursor-pointer active:scale-95"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleNudgePrice(tool.id, tool.price, 'up')}
                                title="Move Up"
                                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center cursor-pointer active:scale-95"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Color Selector */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-slate-400 mr-1">Color:</span>
                          {colorPalette.map((cp) => (
                            <button
                              key={cp.value}
                              onClick={() => onUpdateDrawingTool(tool.id, { color: cp.value })}
                              className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                                tool.color === cp.value ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: cp.value }}
                              title={cp.label}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TECHNICAL INDICATORS (SMA, EMA, BOLLINGER, RSI, MACD)              */}
          {/* ========================================================================= */}
          {activeTab === 'indicators' && (
            <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {/* 1. Moving Average (SMA) */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100">Simple Moving Average (SMA)</div>
                    <div className="text-[10px] text-slate-400">Trend baseline line</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onUpdateIndicators({
                        sma: { ...indicators.sma, enabled: !indicators.sma.enabled },
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      indicators.sma.enabled
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {indicators.sma.enabled ? 'ENABLED' : 'OFF'}
                  </button>
                </div>

                {indicators.sma.enabled && (
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Period:</span>
                      <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                        <button
                          onClick={() =>
                            onUpdateIndicators({
                              sma: { ...indicators.sma, period: Math.max(2, indicators.sma.period - 5) },
                            })
                          }
                          className="text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-amber-400 px-1">
                          {indicators.sma.period}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateIndicators({
                              sma: { ...indicators.sma, period: indicators.sma.period + 5 },
                            })
                          }
                          className="text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {['#f59e0b', '#06b6d4', '#10b981', '#f43f5e'].map((col) => (
                        <button
                          key={col}
                          onClick={() =>
                            onUpdateIndicators({ sma: { ...indicators.sma, color: col } })
                          }
                          className={`w-3.5 h-3.5 rounded-full cursor-pointer ${
                            indicators.sma.color === col ? 'ring-2 ring-white scale-110' : 'opacity-60'
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Exponential Moving Average (EMA) */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100">Exponential Moving Average (EMA)</div>
                    <div className="text-[10px] text-slate-400">Fast reaction smoothing</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onUpdateIndicators({
                        ema: { ...indicators.ema, enabled: !indicators.ema.enabled },
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      indicators.ema.enabled
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {indicators.ema.enabled ? 'ENABLED' : 'OFF'}
                  </button>
                </div>

                {indicators.ema.enabled && (
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Period:</span>
                      <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                        <button
                          onClick={() =>
                            onUpdateIndicators({
                              ema: { ...indicators.ema, period: Math.max(2, indicators.ema.period - 2) },
                            })
                          }
                          className="text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-cyan-400 px-1">
                          {indicators.ema.period}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateIndicators({
                              ema: { ...indicators.ema, period: indicators.ema.period + 2 },
                            })
                          }
                          className="text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {['#06b6d4', '#a855f7', '#10b981', '#ffffff'].map((col) => (
                        <button
                          key={col}
                          onClick={() =>
                            onUpdateIndicators({ ema: { ...indicators.ema, color: col } })
                          }
                          className={`w-3.5 h-3.5 rounded-full cursor-pointer ${
                            indicators.ema.color === col ? 'ring-2 ring-white scale-110' : 'opacity-60'
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Bollinger Bands */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100">Bollinger Bands (BB)</div>
                    <div className="text-[10px] text-slate-400">Volatility envelope (20, 2.0)</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onUpdateIndicators({
                        bollinger: { ...indicators.bollinger, enabled: !indicators.bollinger.enabled },
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      indicators.bollinger.enabled
                        ? 'bg-purple-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {indicators.bollinger.enabled ? 'ENABLED' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* 4. Relative Strength Index (RSI) */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100">RSI Oscillator</div>
                    <div className="text-[10px] text-slate-400">Overbought (70) / Oversold (30)</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onUpdateIndicators({
                        rsi: { ...indicators.rsi, enabled: !indicators.rsi.enabled },
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      indicators.rsi.enabled
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {indicators.rsi.enabled ? 'ENABLED' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* 5. MACD */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100">MACD Indicator</div>
                    <div className="text-[10px] text-slate-400">Fast 12, Slow 26, Signal 9</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onUpdateIndicators({
                        macd: { ...indicators.macd, enabled: !indicators.macd?.enabled },
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      indicators.macd?.enabled
                        ? 'bg-sky-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {indicators.macd?.enabled ? 'ENABLED' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
