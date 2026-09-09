import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const iconDimensions = {
    sm: 'w-6 h-6 sm:w-7 sm:h-7',
    md: 'w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
  }[size];

  const textSize = {
    sm: 'text-xs sm:text-base',
    md: 'text-xs sm:text-base md:text-xl',
    lg: 'text-lg sm:text-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D-styled Logo Emblem matching CryptoBari brand */}
      <div className={`relative ${iconDimensions} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Metallic Gold Gradient for "C" crescent */}
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>

            {/* Metallic Silver Gradient for "B" home shape */}
            <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#e2e8f0" />
              <stop offset="80%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            {/* Dark inner cavity */}
            <radialGradient id="innerDark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>

          {/* Outer Gold "C" crescent */}
          <path
            d="M 52 10 A 40 40 0 1 0 52 90 L 52 74 A 24 24 0 1 1 52 26 Z"
            fill="url(#goldGrad)"
            stroke="#b45309"
            strokeWidth="1.5"
          />

          {/* Inner Dark Background behind candles */}
          <path
            d="M 46 30 L 68 30 L 76 44 L 66 52 L 76 62 L 68 72 L 46 72 Z"
            fill="url(#innerDark)"
          />

          {/* Silver "B" house-like contour */}
          <path
            d="M 44 26 L 68 26 C 78 26 84 32 84 41 C 84 47 80 50 74 52 C 82 54 86 60 86 68 C 86 78 78 84 66 84 L 44 84 Z M 54 36 L 54 48 L 66 48 C 70 48 74 46 74 42 C 74 38 70 36 66 36 Z M 54 58 L 54 74 L 66 74 C 71 74 76 71 76 66 C 76 61 71 58 66 58 Z"
            fill="url(#silverGrad)"
            fillRule="evenodd"
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Candlestick 1: Green Bullish */}
          <line x1="56" y1="41" x2="56" y2="67" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="53.5" y="46" width="5" height="15" rx="1" fill="#10b981" />

          {/* Candlestick 2: Red Bearish (middle) */}
          <line x1="63" y1="44" x2="63" y2="70" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="60.5" y="49" width="5" height="15" rx="1" fill="#ef4444" />

          {/* Candlestick 3: Green Bullish */}
          <line x1="70" y1="39" x2="70" y2="64" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="67.5" y="43" width="5" height="15" rx="1" fill="#10b981" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-baseline tracking-tight font-black">
          <span className={`${textSize} text-slate-100 font-extrabold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}>
            Crypto
          </span>
          <span
            className={`${textSize} font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)] ml-0.5`}
          >
            Bari
          </span>
        </div>
      )}
    </div>
  );
};
