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
  Copy,
  Box,
  Spline,
  Clock,
  Palette,
  Eye,
  EyeOff,
  Move,
  Settings2,
} from 'lucide-react';
import { IndicatorSettings, DrawingToolItem } from '../../types';
import { sound } from '../../utils/audio';

interface IndicatorsAndToolsMenuProps {
  currentPrice: number;
  drawingTools: DrawingToolItem[];
  onAddDrawingTool: (tool: Omit<DrawingToolItem, 'id'>) => void;
  onUpdateDrawingTool: (id: string, updates: Partial<DrawingToolItem>) => void;
  onDuplicateDrawingTool?: (id: string) => void;
  onDeleteDrawingTool: (id: string) => void;
  onClearAllDrawingTools: () => void;
  indicators: IndicatorSettings;
  onUpdateIndicators: (updates: Partial<IndicatorSettings>) => void;
}

const PRESET_COLORS = [
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Sky', value: '#38bdf8' },
  { name: 'Gold', value: '#eab308' },
  { name: 'White', value: '#ffffff' },
];

export const IndicatorsAndToolsMenu: React.FC<IndicatorsAndToolsMenuProps> = ({
  currentPrice,
  drawingTools,
  onAddDrawingTool,
  onUpdateDrawingTool,
  onDuplicateDrawingTool,
  onDeleteDrawingTool,
  onClearAllDrawingTools,
  indicators,
  onUpdateIndicators,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'drawings' | 'indicators' | 'active'>('drawings');
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
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
    indicators.sma?.enabled,
    indicators.ema?.enabled,
    indicators.wma?.enabled,
    indicators.bollinger?.enabled,
    indicators.rsi?.enabled,
    indicators.macd?.enabled,
    indicators.stochastic?.enabled,
    indicators.parabolicSar?.enabled,
  ].filter(Boolean).length;

  const totalActive = activeDrawingsCount + activeIndicatorsCount;

  // Helper for adaptive price precision
  const formatPrecision = (p: number, ref: number) => {
    if (ref >= 1000) return Number(p.toFixed(2));
    if (ref >= 1) return Number(p.toFixed(4));
    if (ref >= 0.01) return Number(p.toFixed(6));
    return Number(p.toFixed(8));
  };

  // Add Horizontal Line
  const handleAddHorizontalLine = (type: 'current' | 'support' | 'resistance') => {
    sound.playClick();
    let price = currentPrice;
    let label = 'Horizontal Line';
    let color = '#f59e0b'; // Amber

    if (type === 'support') {
      price = currentPrice * 0.9992;
      label = 'Support Line';
      color = '#10b981'; // Emerald
    } else if (type === 'resistance') {
      price = currentPrice * 1.0008;
      label = 'Resistance Line';
      color = '#f43f5e'; // Rose
    }

    onAddDrawingTool({
      type: 'horizontal_line',
      price: formatPrecision(price, currentPrice),
      color,
      label,
      lineWidth: 2,
      lineStyle: 'dashed',
    });
    setIsOpen(false);
  };

  // Add Trend Line
  const handleAddTrendLine = () => {
    sound.playClick();
    onAddDrawingTool({
      type: 'trend_line',
      price: formatPrecision(currentPrice, currentPrice),
      price2: formatPrecision(currentPrice * 1.0012, currentPrice),
      color: '#06b6d4',
      label: 'Trend Line',
      lineWidth: 2,
      lineStyle: 'solid',
    });
    setIsOpen(false);
  };

  // Add Ray Line
  const handleAddRay = () => {
    sound.playClick();
    onAddDrawingTool({
      type: 'ray',
      price: formatPrecision(currentPrice, currentPrice),
      color: '#a855f7',
      label: 'Ray Line',
      lineWidth: 2,
      lineStyle: 'solid',
    });
    setIsOpen(false);
  };

  // Add Vertical Line
  const handleAddVerticalLine = () => {
    sound.playClick();
    onAddDrawingTool({
      type: 'vertical_line',
      price: formatPrecision(currentPrice, currentPrice),
      time: Math.floor(Date.now() / 1000),
      color: '#eab308',
      label: 'Vertical Time Line',
      lineWidth: 2,
      lineStyle: 'dashed',
    });
    setIsOpen(false);
  };

  // Add Support/Resistance Zone Box
  const handleAddZoneBox = () => {
    sound.playClick();
    const highPrice = formatPrecision(currentPrice * 1.0008, currentPrice);
    const lowPrice = formatPrecision(currentPrice * 0.9992, currentPrice);
    onAddDrawingTool({
      type: 'zone_box',
      price: highPrice,
      price2: lowPrice,
      color: '#10b981',
      label: 'S/R Zone Box',
      lineWidth: 1,
    });
    setIsOpen(false);
  };

  // Add Parallel Channel
  const handleAddChannel = () => {
    sound.playClick();
    const halfWidth = formatPrecision(currentPrice * 0.001, currentPrice);
    onAddDrawingTool({
      type: 'channel',
      price: formatPrecision(currentPrice, currentPrice),
      channelWidth: halfWidth,
      color: '#38bdf8',
      label: 'Parallel Channel',
      lineWidth: 2,
    });
    setIsOpen(false);
  };

  // Add Fibonacci Retracement Tool
  const handleAddFibonacciRetracement = () => {
    sound.playClick();
    const highPrice = formatPrecision(currentPrice * 1.0015, currentPrice);
    const lowPrice = formatPrecision(currentPrice * 0.9985, currentPrice);

    onAddDrawingTool({
      type: 'fibonacci',
      price: formatPrecision(currentPrice, currentPrice),
      highPrice,
      lowPrice,
      color: '#38bdf8',
      label: 'Fibonacci Retracement (0% - 100%)',
      lineWidth: 2,
    });
    setIsOpen(false);
  };

  // Duplicate / Double Tool Action
  const handleDuplicate = (id: string) => {
    sound.playClick();
    if (onDuplicateDrawingTool) {
      onDuplicateDrawingTool(id);
    } else {
      const tool = drawingTools.find((t) => t.id === id);
      if (tool) {
        const offset = tool.price * 0.002;
        onAddDrawingTool({
          ...tool,
          price: Number((tool.price + offset).toFixed(4)),
          label: `${tool.label || 'Tool'} (Copy)`,
        });
      }
    }
  };

  // Nudge line price manually
  const handleNudgePrice = (id: string, currentP: number, dir: 'up' | 'down') => {
    sound.playClick();
    const step = currentP * 0.0005; // 0.05% step
    const newPrice = dir === 'up' ? currentP + step : currentP - step;
    onUpdateDrawingTool(id, { price: Number(newPrice.toFixed(4)) });
  };

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

      {/* Modern Responsive Panel (Docked bottom sheet on mobile, anchored dropdown below button on web) */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-3 sm:inset-auto sm:absolute sm:top-full sm:left-0 sm:mt-2 w-auto sm:w-[480px] max-h-[82vh] sm:max-h-[560px] overflow-y-auto custom-scrollbar bg-[#0c1220]/98 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-3.5 sm:p-4 z-50 animate-in fade-in duration-150 select-none">
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
                <span className="text-[10px] text-slate-400 font-mono">
                  Advanced Technical Analysis Suite
                </span>
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

          {/* Navigation Tabs: Drawings vs Indicators vs Active Manager */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-xl mb-3 border border-white/5 text-xs font-extrabold">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('drawings');
              }}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer text-[11px] ${
                activeTab === 'drawings'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Tools</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('indicators');
              }}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer text-[11px] ${
                activeTab === 'indicators'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Indicators</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('active');
              }}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer text-[11px] ${
                activeTab === 'active'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings2 className="w-3 h-3" />
              <span>Active ({totalActive})</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: DRAWING TOOLS                                                      */}
          {/* ========================================================================= */}
          {activeTab === 'drawings' && (
            <div className="space-y-3">
              {/* Action Buttons to Add Quotex Tools */}
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1.5 tracking-wider flex items-center justify-between">
                  <span>Lines & Channels</span>
                  <span className="text-amber-400 font-normal">One-Click Add to Chart</span>
                </div>

                {/* Primary Lines Grid */}
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
                    <div className="text-[9px] text-slate-400 mt-0.5">0%, 38.2%, 50%, 61.8% Golden</div>
                  </button>
                </div>

                {/* Support & Resistance Quick Presets */}
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
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

                {/* Advanced Tools: Trend Line, Ray, Parallel Channel, Zone Box, Vertical Line */}
                <div className="text-[10px] uppercase font-extrabold text-slate-400 my-1.5 tracking-wider">
                  <span>Advanced Geometric Tools</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={handleAddTrendLine}
                    className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-cyan-400 text-[10px] font-black">
                      <TrendingUp className="w-3 h-3" />
                      <span>Trend Line</span>
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5">Diagonal ray</div>
                  </button>

                  <button
                    onClick={handleAddZoneBox}
                    className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black">
                      <Box className="w-3 h-3" />
                      <span>Zone Box</span>
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5">Shaded S/R zone</div>
                  </button>

                  <button
                    onClick={handleAddChannel}
                    className="p-2 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-purple-400 text-[10px] font-black">
                      <Spline className="w-3 h-3" />
                      <span>Channel</span>
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5">Parallel bands</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                  <button
                    onClick={handleAddRay}
                    className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-amber-400 text-[10px] font-black">
                      <TrendingUp className="w-3 h-3" />
                      <span>Ray Line</span>
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5">Single-anchor ray</div>
                  </button>

                  <button
                    onClick={handleAddVerticalLine}
                    className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-amber-400 text-[10px] font-black">
                      <Clock className="w-3 h-3" />
                      <span>Vertical Time</span>
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5">Time milestone bar</div>
                  </button>
                </div>
              </div>

              {/* Active Tools List with Quotex Controls */}
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
                    <p className="font-semibold text-slate-300">No active drawing tools</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Select any line, zone, or Fibonacci above. You can drag, change colors, duplicate (Double), or delete them anytime.
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
                              className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0 ring-1 ring-white/30"
                              style={{ backgroundColor: tool.color }}
                            />
                            <span className="text-xs font-bold text-slate-200">
                              {tool.label ||
                                (tool.type === 'fibonacci'
                                  ? 'Fibonacci Retracement'
                                  : tool.type === 'zone_box'
                                  ? 'Zone Box'
                                  : `Line ${idx + 1}`)}
                            </span>
                          </div>

                          {/* Quick Action Buttons: Duplicate (Double), Cross (Delete) */}
                          <div className="flex items-center gap-1">
                            {/* Duplicate / Double Button */}
                            <button
                              onClick={() => handleDuplicate(tool.id)}
                              title="Duplicate / Double this tool"
                              className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 hover:text-sky-300 font-extrabold text-[10px] border border-sky-500/30 cursor-pointer transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Double</span>
                            </button>

                            {/* Delete Cross (X) button */}
                            <button
                              id={`delete-line-${tool.id}`}
                              onClick={() => {
                                sound.playClick();
                                onDeleteDrawingTool(tool.id);
                              }}
                              title="Delete this tool"
                              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
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

                        {/* Full Color Customization (Presets + Custom Native Picker) */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Color:</span>
                            {PRESET_COLORS.map((cp) => (
                              <button
                                key={cp.value}
                                onClick={() => {
                                  sound.playClick();
                                  onUpdateDrawingTool(tool.id, { color: cp.value });
                                }}
                                className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                                  tool.color === cp.value
                                    ? 'ring-2 ring-white scale-110 shadow-xs'
                                    : 'opacity-70 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: cp.value }}
                                title={cp.name}
                              />
                            ))}
                          </div>

                          {/* Custom HTML Color Picker */}
                          <label className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer ml-2">
                            <Palette className="w-3 h-3 text-amber-400" />
                            <input
                              type="color"
                              value={tool.color}
                              onChange={(e) =>
                                onUpdateDrawingTool(tool.id, { color: e.target.value })
                              }
                              className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
                              title="Custom Color Picker"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TECHNICAL INDICATORS                                               */}
          {/* ========================================================================= */}
          {activeTab === 'indicators' && (
            <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {/* 1. Simple Moving Average (SMA) */}
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

              {/* 3. Weighted Moving Average (WMA) */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100">Weighted Moving Average (WMA)</div>
                    <div className="text-[10px] text-slate-400">High sensitivity recent price weights</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      const curr = indicators.wma || { enabled: false, period: 14, color: '#10b981' };
                      onUpdateIndicators({
                        wma: { ...curr, enabled: !curr.enabled },
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      indicators.wma?.enabled
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {indicators.wma?.enabled ? 'ENABLED' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* 4. Bollinger Bands */}
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

              {/* 5. Relative Strength Index (RSI) */}
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

              {/* 6. MACD */}
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

              {/* 7. Stochastic Oscillator */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100">Stochastic Oscillator</div>
                    <div className="text-[10px] text-slate-400">%K 14, %D 3, Slowing 3</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      const curr = indicators.stochastic || {
                        enabled: false,
                        kPeriod: 14,
                        dPeriod: 3,
                        slowing: 3,
                        overbought: 80,
                        oversold: 20,
                      };
                      onUpdateIndicators({
                        stochastic: { ...curr, enabled: !curr.enabled },
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      indicators.stochastic?.enabled
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {indicators.stochastic?.enabled ? 'ENABLED' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* 8. Parabolic SAR */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100">Parabolic SAR</div>
                    <div className="text-[10px] text-slate-400">Stop and reverse price trailing (0.02, 0.2)</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      const curr = indicators.parabolicSar || {
                        enabled: false,
                        step: 0.02,
                        max: 0.2,
                        color: '#f43f5e',
                      };
                      onUpdateIndicators({
                        parabolicSar: { ...curr, enabled: !curr.enabled },
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      indicators.parabolicSar?.enabled
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {indicators.parabolicSar?.enabled ? 'ENABLED' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ACTIVE MANAGER (Quotex Unified Active Console)                     */}
          {/* ========================================================================= */}
          {activeTab === 'active' && (
            <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                  Total Active: {totalActive}
                </span>
                {drawingTools.length > 0 && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onClearAllDrawingTools();
                    }}
                    className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear Drawings
                  </button>
                )}
              </div>

              {totalActive === 0 ? (
                <div className="p-5 rounded-xl bg-black/30 border border-white/5 text-center text-xs text-slate-400">
                  <Activity className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-300">No tools or indicators active</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Turn on indicators or add drawing tools from the tabs above.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* Drawing tools */}
                  {drawingTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full ring-1 ring-white/30 shrink-0"
                          style={{ backgroundColor: tool.color }}
                        />
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {tool.label || tool.type}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          ${tool.price}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleDuplicate(tool.id)}
                          title="Double this tool"
                          className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 font-extrabold text-[9px] border border-sky-500/30 cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>Double</span>
                        </button>
                        <button
                          onClick={() => onDeleteDrawingTool(tool.id)}
                          title="Delete tool"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Indicators */}
                  {indicators.sma?.enabled && (
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-slate-200">
                          SMA (Period: {indicators.sma.period})
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onUpdateIndicators({ sma: { ...indicators.sma, enabled: false } })
                        }
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {indicators.ema?.enabled && (
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-cyan-400" />
                        <span className="text-xs font-bold text-slate-200">
                          EMA (Period: {indicators.ema.period})
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onUpdateIndicators({ ema: { ...indicators.ema, enabled: false } })
                        }
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {indicators.bollinger?.enabled && (
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-purple-500" />
                        <span className="text-xs font-bold text-slate-200">
                          Bollinger Bands ({indicators.bollinger.period}, {indicators.bollinger.stdDev})
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onUpdateIndicators({
                            bollinger: { ...indicators.bollinger, enabled: false },
                          })
                        }
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {indicators.rsi?.enabled && (
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
                        <span className="text-xs font-bold text-slate-200">
                          RSI ({indicators.rsi.period})
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onUpdateIndicators({ rsi: { ...indicators.rsi, enabled: false } })
                        }
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {indicators.macd?.enabled && (
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-sky-400" />
                        <span className="text-xs font-bold text-slate-200">
                          MACD ({indicators.macd.fast}, {indicators.macd.slow}, {indicators.macd.signal})
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onUpdateIndicators({
                            macd: { ...indicators.macd, enabled: false },
                          })
                        }
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
