import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown, Check, Globe } from 'lucide-react';
import { sound } from '../../utils/audio';

export interface TimezoneOption {
  offsetMinutes: number;
  label: string;
  city: string;
  code: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { offsetMinutes: -480, label: 'UTC -8:00', city: 'Los Angeles / Vancouver', code: 'PST' },
  { offsetMinutes: -420, label: 'UTC -7:00', city: 'Denver / Phoenix', code: 'MST' },
  { offsetMinutes: -360, label: 'UTC -6:00', city: 'Chicago / Mexico City', code: 'CST' },
  { offsetMinutes: -300, label: 'UTC -5:00', city: 'New York / Toronto', code: 'EST' },
  { offsetMinutes: -240, label: 'UTC -4:00', city: 'Santiago / Halifax', code: 'AST' },
  { offsetMinutes: -180, label: 'UTC -3:00', city: 'São Paulo / Buenos Aires', code: 'BRT' },
  { offsetMinutes: 0, label: 'UTC +0:00', city: 'London / Lisbon (GMT)', code: 'GMT' },
  { offsetMinutes: 60, label: 'UTC +1:00', city: 'Berlin / Paris / Rome', code: 'CET' },
  { offsetMinutes: 120, label: 'UTC +2:00', city: 'Cairo / Athens / Kyiv', code: 'EET' },
  { offsetMinutes: 180, label: 'UTC +3:00', city: 'Moscow / Riyadh / Istanbul', code: 'MSK' },
  { offsetMinutes: 240, label: 'UTC +4:00', city: 'Dubai / Baku', code: 'GST' },
  { offsetMinutes: 300, label: 'UTC +5:00', city: 'Karachi / Tashkent', code: 'PKT' },
  { offsetMinutes: 330, label: 'UTC +5:30', city: 'Delhi / Mumbai (IST)', code: 'IST' },
  { offsetMinutes: 360, label: 'UTC +6:00', city: 'Dhaka / Almaty (BST)', code: 'BST' },
  { offsetMinutes: 420, label: 'UTC +7:00', city: 'Bangkok / Jakarta / Hanoi', code: 'WIB' },
  { offsetMinutes: 480, label: 'UTC +8:00', city: 'Singapore / Hong Kong / Beijing', code: 'SGT' },
  { offsetMinutes: 540, label: 'UTC +9:00', city: 'Tokyo / Seoul', code: 'JST' },
  { offsetMinutes: 600, label: 'UTC +10:00', city: 'Sydney / Melbourne', code: 'AEST' },
  { offsetMinutes: 720, label: 'UTC +12:00', city: 'Auckland / Fiji', code: 'NZST' },
];

interface UtcTimeSelectorProps {
  className?: string;
}

export const UtcTimeSelector: React.FC<UtcTimeSelectorProps> = ({ className = '' }) => {
  // Initialize with saved preference or browser offset match or UTC
  const [selectedOffset, setSelectedOffset] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cryptobari_utc_offset');
      if (saved !== null) {
        return parseInt(saved, 10);
      }
      // Match browser timezone offset
      const browserOffset = -new Date().getTimezoneOffset();
      const match = TIMEZONE_OPTIONS.find((tz) => tz.offsetMinutes === browserOffset);
      return match ? match.offsetMinutes : 0;
    } catch {
      return 0;
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update clock every second based on selected UTC offset
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // UTC time in ms
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      // Target time in ms
      const targetDate = new Date(utcMs + selectedOffset * 60000);

      const hours = String(targetDate.getHours()).padStart(2, '0');
      const mins = String(targetDate.getMinutes()).padStart(2, '0');
      const secs = String(targetDate.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${hours}:${mins}:${secs}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [selectedOffset]);

  const handleSelectTimezone = (offset: number) => {
    sound.playClick();
    setSelectedOffset(offset);
    try {
      localStorage.setItem('cryptobari_utc_offset', offset.toString());
    } catch {}
    setIsOpen(false);
  };

  const currentTz =
    TIMEZONE_OPTIONS.find((t) => t.offsetMinutes === selectedOffset) || {
      offsetMinutes: selectedOffset,
      label: `UTC ${selectedOffset >= 0 ? '+' : ''}${Math.floor(selectedOffset / 60)}:${String(
        Math.abs(selectedOffset % 60)
      ).padStart(2, '0')}`,
      city: 'Custom',
      code: 'UTC',
    };

  const filteredOptions = TIMEZONE_OPTIONS.filter(
    (tz) =>
      tz.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tz.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tz.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Interactive UTC Selector Button */}
      <button
        id="utc-timezone-selector-btn"
        onClick={() => {
          sound.playClick();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border shadow-sm select-none ${
          isOpen
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600'
        }`}
        title="Select Timezone (UTC offset clock)"
      >
        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
        <span className="font-bold tracking-tight text-[11px] text-slate-100">
          {currentTimeStr || '00:00:00'}
        </span>
        <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] text-amber-300 font-bold hidden sm:inline">
          {currentTz.label.replace('UTC ', '')}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 3D Glassmorphic Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1.5 w-72 max-h-80 overflow-hidden bg-[#0d1322]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(245,158,11,0.15)] z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-white/10 bg-black/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-100 uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Select UTC Timezone</span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                {currentTz.label}
              </span>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, region, or offset..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          {/* Timezone List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar max-h-56">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">No timezones matched</div>
            ) : (
              filteredOptions.map((tz) => {
                const isSelected = tz.offsetMinutes === selectedOffset;
                return (
                  <button
                    key={tz.label + tz.city}
                    onClick={() => handleSelectTimezone(tz.offsetMinutes)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                        : 'bg-transparent hover:bg-white/5 border-transparent text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-mono font-black">{tz.label}</span>
                        <span className="text-[10px] text-slate-400">({tz.code})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[190px]">
                        {tz.city}
                      </span>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick presets footer */}
          <div className="p-2 border-t border-white/10 bg-black/40 flex items-center justify-between text-[10px] text-slate-400">
            <span>Current: <strong>{currentTimeStr}</strong></span>
            <button
              onClick={() => handleSelectTimezone(0)}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              Reset to UTC 0
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
