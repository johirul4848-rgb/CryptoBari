import React, { useState } from 'react';
import { Copy, X, Trash2 } from 'lucide-react';
import { DrawingToolItem, IndicatorSettings } from '../../types';
import { sound } from '../../utils/audio';

interface ActiveToolsFloatingBarProps {
  drawingTools: DrawingToolItem[];
  indicators: IndicatorSettings;
  onUpdateDrawingTool: (id: string, updates: Partial<DrawingToolItem>) => void;
  onDuplicateDrawingTool: (id: string) => void;
  onDeleteDrawingTool: (id: string) => void;
  onClearAllDrawingTools: () => void;
  onUpdateIndicators: (updates: Partial<IndicatorSettings>) => void;
  onOpenFullMenu?: () => void;
}

const PRESET_COLORS = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Sky', hex: '#38bdf8' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'White', hex: '#ffffff' },
];

export const ActiveToolsFloatingBar: React.FC<ActiveToolsFloatingBarProps> = ({
  drawingTools,
  indicators,
  onUpdateDrawingTool,
  onDuplicateDrawingTool,
  onDeleteDrawingTool,
  onClearAllDrawingTools,
  onUpdateIndicators,
}) => {
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);

  // Active indicators list (if any)
  const activeIndicatorsList: {
    key: keyof IndicatorSettings;
    name: string;
    color: string;
  }[] = [];

  if (indicators.sma?.enabled) {
    activeIndicatorsList.push({
      key: 'sma',
      name: `SMA (${indicators.sma.period})`,
      color: indicators.sma.color || '#f59e0b',
    });
  }
  if (indicators.ema?.enabled) {
    activeIndicatorsList.push({
      key: 'ema',
      name: `EMA (${indicators.ema.period})`,
      color: indicators.ema.color || '#06b6d4',
    });
  }
  if (indicators.wma?.enabled) {
    activeIndicatorsList.push({
      key: 'wma',
      name: `WMA (${indicators.wma.period})`,
      color: indicators.wma.color || '#10b981',
    });
  }
  if (indicators.bollinger?.enabled) {
    activeIndicatorsList.push({
      key: 'bollinger',
      name: `Bollinger (${indicators.bollinger.period})`,
      color: indicators.bollinger.color || '#a855f7',
    });
  }
  if (indicators.rsi?.enabled) {
    activeIndicatorsList.push({
      key: 'rsi',
      name: `RSI (${indicators.rsi.period})`,
      color: indicators.rsi.color || '#10b981',
    });
  }
  if (indicators.macd?.enabled) {
    activeIndicatorsList.push({
      key: 'macd',
      name: 'MACD',
      color: indicators.macd.color || '#38bdf8',
    });
  }
  if (indicators.stochastic?.enabled) {
    activeIndicatorsList.push({
      key: 'stochastic',
      name: 'Stochastic',
      color: '#f59e0b',
    });
  }
  if (indicators.parabolicSar?.enabled) {
    activeIndicatorsList.push({
      key: 'parabolicSar',
      name: 'Parabolic SAR',
      color: indicators.parabolicSar.color || '#f43f5e',
    });
  }

  const totalActive = drawingTools.length + activeIndicatorsList.length;

  if (totalActive === 0) {
    return null;
  }

  const getToolDisplayName = (tool: DrawingToolItem) => {
    if (tool.label) return tool.label;
    if (tool.type === 'horizontal_line') return 'Horizontal Line';
    if (tool.type === 'trend_line') return 'Trend Line';
    if (tool.type === 'ray') return 'Ray Line';
    if (tool.type === 'vertical_line') return 'Vertical Line';
    if (tool.type === 'fibonacci') return 'Fibonacci';
    if (tool.type === 'zone_box') return 'Zone Box';
    if (tool.type === 'channel') return 'Channel';
    return 'Tool';
  };

  return (
    <div
      id="chart-top-left-corner-bar"
      className="absolute top-2.5 left-2.5 z-30 pointer-events-auto select-none flex flex-wrap items-center gap-1.5 max-w-[92%] animate-in fade-in duration-100"
    >
      {/* DRAWING TOOLS: ONLY Name, Color Change, Double, Cross */}
      {drawingTools.map((tool) => (
        <div
          key={tool.id}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0b101d]/95 hover:bg-[#0f172a] border border-slate-700/80 shadow-[0_4px_16px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all text-xs"
        >
          {/* 1. Name */}
          <span
            className="font-bold text-[11px] tracking-tight whitespace-nowrap"
            style={{ color: tool.color }}
          >
            {getToolDisplayName(tool)}
          </span>

          {/* 2. Color Change Swatch & Popover */}
          <div className="relative flex items-center">
            <button
              onClick={() => {
                sound.playClick();
                setActiveColorPickerId(activeColorPickerId === tool.id ? null : tool.id);
              }}
              className="w-3.5 h-3.5 rounded-full ring-1 ring-white/50 cursor-pointer hover:scale-125 transition-transform"
              style={{ backgroundColor: tool.color }}
              title="Change Color"
            />

            {activeColorPickerId === tool.id && (
              <div className="absolute left-0 top-full mt-2 p-2 bg-[#0c1220] border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col gap-1.5 min-w-[125px] animate-in fade-in duration-100">
                <span className="text-[9px] font-bold text-slate-300">Choose Color:</span>
                <div className="grid grid-cols-4 gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => {
                        sound.playClick();
                        onUpdateDrawingTool(tool.id, { color: c.hex });
                        setActiveColorPickerId(null);
                      }}
                      className={`w-4 h-4 rounded-full cursor-pointer transition-all ${
                        tool.color === c.hex
                          ? 'ring-2 ring-white scale-110'
                          : 'hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
                {/* Custom color input */}
                <label className="flex items-center justify-between gap-1 pt-1 border-t border-white/10 text-[9px] text-slate-300 cursor-pointer">
                  <span>Custom:</span>
                  <input
                    type="color"
                    value={tool.color}
                    onChange={(e) => onUpdateDrawingTool(tool.id, { color: e.target.value })}
                    className="w-4 h-4 rounded bg-transparent border-0 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

          {/* 3. Double (Duplicate into 2 lines on the chart) */}
          <button
            onClick={() => {
              sound.playClick();
              onDuplicateDrawingTool(tool.id);
            }}
            title="Double (Duplicate this line)"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 hover:text-sky-200 text-[10px] font-bold border border-sky-500/30 cursor-pointer transition-colors"
          >
            <Copy className="w-2.5 h-2.5" />
            <span>Double</span>
          </button>

          {/* 4. Cross (✕) to delete */}
          <button
            onClick={() => {
              sound.playClick();
              onDeleteDrawingTool(tool.id);
            }}
            title="Delete this tool (Cross)"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors border-l border-white/10 pl-1.5 ml-0.5"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      ))}

      {/* ACTIVE INDICATORS: Name + Cross */}
      {activeIndicatorsList.map((ind) => (
        <div
          key={ind.key}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0b101d]/95 hover:bg-[#0f172a] border border-slate-700/80 shadow-[0_4px_16px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all text-xs"
        >
          <div
            className="w-2 h-2 rounded-full ring-1 ring-white/30"
            style={{ backgroundColor: ind.color }}
          />
          <span className="font-bold text-[10px] text-slate-200">{ind.name}</span>

          {/* Cross Button to Disable Indicator */}
          <button
            onClick={() => {
              sound.playClick();
              onUpdateIndicators({
                [ind.key]: {
                  ...(indicators[ind.key] as any),
                  enabled: false,
                },
              });
            }}
            title={`Remove ${ind.name}`}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors border-l border-white/10 pl-1.5 ml-0.5"
          >
            <X className="w-3 h-3 stroke-[2.5]" />
          </button>
        </div>
      ))}

      {/* Clear All button if 2 or more tools active */}
      {drawingTools.length >= 2 && (
        <button
          onClick={() => {
            sound.playClick();
            onClearAllDrawingTools();
          }}
          title="Clear all active drawings"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-[10px] font-bold cursor-pointer transition-colors"
        >
          <Trash2 className="w-2.5 h-2.5" />
          <span>Clear All</span>
        </button>
      )}
    </div>
  );
};
