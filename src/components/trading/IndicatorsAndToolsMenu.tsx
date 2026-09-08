import React, { useState } from 'react';
import { DrawingToolItem, IndicatorSettings } from '../../types';
import {
  Sliders,
  Minus,
  Plus,
  Trash2,
  X,
  TrendingUp,
  Activity,
  ChevronDown,
  Layers,
  Eye,
  EyeOff,
  Crosshair,
  ArrowUp,
  ArrowDown,
  HelpCircle,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface IndicatorsAndToolsMenuProps {
  currentPrice: number;
  drawingTools: DrawingToolItem[];
  onAddDrawingTool: (tool: Omit<DrawingToolItem, 'id'>) => void;
  onUpdateDrawingTool: (id: string, updates: Partial<DrawingToolItem>) => void;
  onDeleteDrawingTool: (id: string) => void;
  onClearAllDrawingTools: () => void;
  indicators: IndicatorSettings;
  onUpdateIndicators: (settings: Partial<IndicatorSettings>) => void;
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

  // Count active tools & indicators
  const activeDrawingsCount = drawingTools.length;
  const activeIndicatorsCount =
    (indicators.sma.enabled ? 1 : 0) +
    (indicators.ema.enabled ? 1 : 0) +
    (indicators.bollinger.enabled ? 1 : 0) +
    (indicators.rsi.enabled ? 1 : 0) +
    (indicators.macd.enabled ? 1 : 0);
  const totalActive = activeDrawingsCount + activeIndicatorsCount;

  const colorPalette = [
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Cyan', value: '#06b6d4' },
    { label: 'Green', value: '#10b981' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Purple', value: '#a855f7' },
    { label: 'White', value: '#f8fafc' },
  ];

  const handleAddHorizontalLine = (type: 'current' | 'support' | 'resistance') => {
    sound.playClick();
    let price = currentPrice;
    let color = '#f59e0b';
    let label = `Horizontal Line ${drawingTools.length + 1}`;

    if (type === 'support') {
      price = currentPrice * 0.998;
      color = '#10b981';
      label = `Support Level ${drawingTools.length + 1}`;
    } else if (type === 'resistance') {
      price = currentPrice * 1.002;
      color = '#f43f5e';
      label = `Resistance Level ${drawingTools.length + 1}`;
    }

    onAddDrawingTool({
      type: 'horizontal_line',
      price: Number(price.toFixed(4)),
      color,
      label,
      lineWidth: 2,
    });
  };

  const handleNudgePrice = (id: string, currentVal: number, direction: 'up' | 'down') => {
    sound.playClick();
    const step = currentVal * 0.0005; // 0.05% step
    const nextPrice = direction === 'up' ? currentVal + step : currentVal - step;
    onUpdateDrawingTool(id, { price: Number(nextPrice.toFixed(4)) });
  };

  return (
    <div className="relative">
      {/* Quotex-Style Dropdown Toggle Button */}
      <button
        id="indicators-tools-dropdown-btn"
        onClick={() => {
          sound.playClick();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded border transition-all cursor-pointer shadow-sm ${
          isOpen || totalActive > 0
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
            : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700/80'
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

      {/* 3D Glassmorphic Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1.5 w-80 sm:w-96 max-h-[75vh] overflow-y-auto custom-scrollbar bg-[#0f1422]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(255,255,255,0.03)] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-slate-100 uppercase tracking-wider">
                Quotex Tools & Indicators
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navigation Tabs: Drawings vs Indicators */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/30 rounded-xl mb-3 border border-white/5 text-xs font-extrabold">
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
          {/* TAB 1: DRAWING TOOLS (HORIZONTAL LINES, SUPPORT, RESISTANCE)              */}
          {/* ========================================================================= */}
          {activeTab === 'drawings' && (
            <div className="space-y-3">
              {/* Quick Add Horizontal Lines Action Buttons */}
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 tracking-wider">
                  Add Lines to Chart
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleAddHorizontalLine('current')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1 text-amber-400 text-[11px] font-black">
                      <Plus className="w-3 h-3" />
                      <span>Horizontal</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">At current price</div>
                  </button>

                  <button
                    onClick={() => handleAddHorizontalLine('support')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-black">
                      <ArrowUp className="w-3 h-3" />
                      <span>Support</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Below market</div>
                  </button>

                  <button
                    onClick={() => handleAddHorizontalLine('resistance')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1 text-rose-400 text-[11px] font-black">
                      <ArrowDown className="w-3 h-3" />
                      <span>Resistance</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Above market</div>
                  </button>
                </div>
              </div>

              {/* Active Lines List */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                    Active Horizontal Lines ({drawingTools.length})
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
                      Click "+ Horizontal" above to place a support/resistance line. You can drag it or nudge it with the arrows.
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
                              {tool.label || `Line ${idx + 1}`}
                            </span>
                          </div>

                          {/* Delete Cross (X) button */}
                          <button
                            id={`delete-line-${tool.id}`}
                            onClick={() => {
                              sound.playClick();
                              onDeleteDrawingTool(tool.id);
                            }}
                            title="Delete this line (cross)"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price Display & Manual Nudge Controls */}
                        <div className="flex items-center justify-between bg-black/40 rounded-lg p-1.5 border border-white/5 text-xs">
                          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <span>Price:</span>
                            <span className="font-mono font-bold text-slate-100">${tool.price}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500 mr-1">Move:</span>
                            <button
                              onClick={() => handleNudgePrice(tool.id, tool.price, 'down')}
                              title="Move Down (manual)"
                              className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center cursor-pointer active:scale-95"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleNudgePrice(tool.id, tool.price, 'up')}
                              title="Move Up (manual)"
                              className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Color Selector */}
                        <div className="flex items-center gap-1.5 pt-1">
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
                    <div className="text-[10px] text-slate-400">Trend smoothing line</div>
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
                    <div className="text-[10px] text-slate-400">Fast reaction to recent candles</div>
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
                              ema: { ...indicators.ema, period: Math.max(2, indicators.ema.period - 5) },
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
                              ema: { ...indicators.ema, period: indicators.ema.period + 5 },
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
                        macd: { ...indicators.macd, enabled: !indicators.macd.enabled },
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      indicators.macd.enabled
                        ? 'bg-sky-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {indicators.macd.enabled ? 'ENABLED' : 'OFF'}
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
