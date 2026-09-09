import React, { useState } from 'react';
import { Copy, Check, QrCode, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';

interface BinancePayQRCardProps {
  binanceId?: string;
  nickname?: string;
  customQrImage?: string;
  onCopySuccess?: () => void;
}

export const BinancePayQRCard: React.FC<BinancePayQRCardProps> = ({
  binanceId = '794380283',
  nickname = 'CryptoBari',
  customQrImage,
  onCopySuccess,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedNick, setCopiedNick] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(binanceId);
    sound.playClick();
    setCopiedId(true);
    if (onCopySuccess) onCopySuccess();
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleCopyNick = () => {
    navigator.clipboard.writeText(nickname);
    sound.playClick();
    setCopiedNick(true);
    setTimeout(() => setCopiedNick(false), 2500);
  };

  return (
    <div className="flex flex-col items-center">
      {/* 3D Binance Pay Official Container replicating the attached photo */}
      <div className="w-full max-w-[340px] sm:max-w-[360px] bg-[#181a20] border border-[#2b313a] rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(240,185,11,0.15)] relative overflow-hidden select-none">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* 1. Header: Binance Logo & BINANCE PAY */}
        <div className="flex items-center justify-center gap-2.5 pt-1 pb-3">
          {/* Binance Diamond SVG Icon */}
          <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 2L20.6 6.6L16 11.2L11.4 6.6L16 2Z"
              fill="#F0B90B"
            />
            <path
              d="M25.4 11.4L30 16L25.4 20.6L20.8 16L25.4 11.4Z"
              fill="#F0B90B"
            />
            <path
              d="M16 20.8L20.6 25.4L16 30L11.4 25.4L16 20.8Z"
              fill="#F0B90B"
            />
            <path
              d="M6.6 11.4L11.2 16L6.6 20.6L2 16L6.6 11.4Z"
              fill="#F0B90B"
            />
            <path
              d="M16 11.2L20.8 16L16 20.8L11.2 16L16 11.2Z"
              fill="#F0B90B"
            />
          </svg>
          <div className="flex items-baseline font-black tracking-wider text-xl">
            <span className="text-[#F0B90B]">BINANCE</span>
            <span className="text-white ml-1.5 font-extrabold text-lg">PAY</span>
          </div>
        </div>

        {/* 2. Subtitle */}
        <p className="text-center text-xs text-slate-300 font-medium mb-4">
          Scan via the Binance App to send
        </p>

        {/* 3. Pure White QR Container with Official Crisp QR Code */}
        <div className="p-3.5 bg-[#12151c] rounded-2xl border border-slate-800 flex justify-center items-center relative group">
          <div
            onClick={() => setIsZoomed(!isZoomed)}
            className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] bg-white rounded-2xl p-3 flex items-center justify-center relative shadow-xl cursor-pointer transition-transform hover:scale-[1.02] overflow-hidden"
            title="Click to Zoom QR Code"
          >
            {customQrImage ? (
              <img
                src={customQrImage}
                alt="Binance Pay QR"
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              /* SVG High Resolution QR Code with center Binance icon */
              <svg
                viewBox="0 0 160 160"
                className="w-full h-full"
                shapeRendering="crispEdges"
              >
              {/* Background */}
              <rect width="160" height="160" fill="#ffffff" />

              {/* Corner 1 (Top Left) */}
              <rect x="10" y="10" width="40" height="40" fill="#000000" rx="4" />
              <rect x="16" y="16" width="28" height="28" fill="#ffffff" rx="2" />
              <rect x="22" y="22" width="16" height="16" fill="#000000" rx="2" />

              {/* Corner 2 (Top Right) */}
              <rect x="110" y="10" width="40" height="40" fill="#000000" rx="4" />
              <rect x="116" y="16" width="28" height="28" fill="#ffffff" rx="2" />
              <rect x="122" y="22" width="16" height="16" fill="#000000" rx="2" />

              {/* Corner 3 (Bottom Left) */}
              <rect x="10" y="110" width="40" height="40" fill="#000000" rx="4" />
              <rect x="16" y="116" width="28" height="28" fill="#ffffff" rx="2" />
              <rect x="22" y="122" width="16" height="16" fill="#000000" rx="2" />

              {/* Timing patterns & Data Matrix modules */}
              <rect x="56" y="12" width="6" height="6" fill="#000000" />
              <rect x="68" y="12" width="6" height="6" fill="#000000" />
              <rect x="80" y="12" width="6" height="6" fill="#000000" />
              <rect x="92" y="12" width="6" height="6" fill="#000000" />

              <rect x="56" y="24" width="6" height="6" fill="#000000" />
              <rect x="74" y="24" width="6" height="6" fill="#000000" />
              <rect x="92" y="24" width="6" height="6" fill="#000000" />

              <rect x="56" y="36" width="6" height="6" fill="#000000" />
              <rect x="68" y="36" width="6" height="6" fill="#000000" />
              <rect x="86" y="36" width="6" height="6" fill="#000000" />

              <rect x="12" y="56" width="6" height="6" fill="#000000" />
              <rect x="24" y="56" width="6" height="6" fill="#000000" />
              <rect x="36" y="56" width="6" height="6" fill="#000000" />
              <rect x="48" y="56" width="6" height="6" fill="#000000" />
              <rect x="60" y="56" width="6" height="6" fill="#000000" />
              <rect x="72" y="56" width="6" height="6" fill="#000000" />
              <rect x="84" y="56" width="6" height="6" fill="#000000" />
              <rect x="96" y="56" width="6" height="6" fill="#000000" />
              <rect x="108" y="56" width="6" height="6" fill="#000000" />
              <rect x="126" y="56" width="6" height="6" fill="#000000" />
              <rect x="144" y="56" width="6" height="6" fill="#000000" />

              <rect x="12" y="68" width="6" height="6" fill="#000000" />
              <rect x="30" y="68" width="6" height="6" fill="#000000" />
              <rect x="48" y="68" width="6" height="6" fill="#000000" />
              <rect x="102" y="68" width="6" height="6" fill="#000000" />
              <rect x="120" y="68" width="6" height="6" fill="#000000" />
              <rect x="138" y="68" width="6" height="6" fill="#000000" />

              <rect x="12" y="80" width="6" height="6" fill="#000000" />
              <rect x="36" y="80" width="6" height="6" fill="#000000" />
              <rect x="48" y="80" width="6" height="6" fill="#000000" />
              <rect x="108" y="80" width="6" height="6" fill="#000000" />
              <rect x="126" y="80" width="6" height="6" fill="#000000" />
              <rect x="144" y="80" width="6" height="6" fill="#000000" />

              <rect x="12" y="92" width="6" height="6" fill="#000000" />
              <rect x="24" y="92" width="6" height="6" fill="#000000" />
              <rect x="42" y="92" width="6" height="6" fill="#000000" />
              <rect x="60" y="92" width="6" height="6" fill="#000000" />
              <rect x="78" y="92" width="6" height="6" fill="#000000" />
              <rect x="96" y="92" width="6" height="6" fill="#000000" />
              <rect x="114" y="92" width="6" height="6" fill="#000000" />
              <rect x="132" y="92" width="6" height="6" fill="#000000" />

              <rect x="56" y="104" width="6" height="6" fill="#000000" />
              <rect x="74" y="104" width="6" height="6" fill="#000000" />
              <rect x="92" y="104" width="6" height="6" fill="#000000" />
              <rect x="110" y="104" width="6" height="6" fill="#000000" />
              <rect x="128" y="104" width="6" height="6" fill="#000000" />
              <rect x="144" y="104" width="6" height="6" fill="#000000" />

              <rect x="56" y="116" width="6" height="6" fill="#000000" />
              <rect x="68" y="116" width="6" height="6" fill="#000000" />
              <rect x="86" y="116" width="6" height="6" fill="#000000" />
              <rect x="104" y="116" width="6" height="6" fill="#000000" />
              <rect x="122" y="116" width="6" height="6" fill="#000000" />
              <rect x="140" y="116" width="6" height="6" fill="#000000" />

              <rect x="56" y="128" width="6" height="6" fill="#000000" />
              <rect x="74" y="128" width="6" height="6" fill="#000000" />
              <rect x="92" y="128" width="6" height="6" fill="#000000" />
              <rect x="116" y="128" width="6" height="6" fill="#000000" />
              <rect x="134" y="128" width="6" height="6" fill="#000000" />

              <rect x="56" y="140" width="6" height="6" fill="#000000" />
              <rect x="68" y="140" width="6" height="6" fill="#000000" />
              <rect x="86" y="140" width="6" height="6" fill="#000000" />
              <rect x="104" y="140" width="6" height="6" fill="#000000" />
              <rect x="128" y="140" width="6" height="6" fill="#000000" />
              <rect x="144" y="140" width="6" height="6" fill="#000000" />

              {/* Center White Mask for Binance Diamond Emblem */}
              <rect x="65" y="65" width="30" height="30" fill="#181a20" rx="6" />
              <rect x="67" y="67" width="26" height="26" fill="#181a20" rx="4" />

              {/* Center Golden Binance Diamond */}
              <g transform="translate(68, 68) scale(0.75)">
                <path d="M16 4L20.2 8.2L16 12.4L11.8 8.2L16 4Z" fill="#F0B90B" />
                <path d="M24.2 12.2L28 16L24.2 19.8L20.4 16L24.2 12.2Z" fill="#F0B90B" />
                <path d="M16 19.6L20.2 23.8L16 28L11.8 23.8L16 19.6Z" fill="#F0B90B" />
                <path d="M7.8 12.2L11.6 16L7.8 19.8L4 16L7.8 12.2Z" fill="#F0B90B" />
                <path d="M16 12L20 16L16 20L12 16L16 12Z" fill="#F0B90B" />
              </g>
            </svg>
            )}
          </div>
        </div>

        {/* 4. Bottom Nickname Card replicating attached image */}
        <div className="mt-3.5 p-3 rounded-2xl bg-[#202530] border border-slate-700/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Nickname</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white font-mono">{nickname}</span>
            <button
              onClick={handleCopyNick}
              className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition"
              title="Copy Nickname"
            >
              {copiedNick ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 5. Binance ID Display & Copy Button */}
        <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-[#1b2233] to-[#161c2b] border border-amber-500/40 flex items-center justify-between shadow-inner">
          <div>
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Binance ID / Pay UID
            </div>
            <div className="text-base sm:text-lg font-black text-white font-mono tracking-wider">
              {binanceId}
            </div>
          </div>

          <button
            id="copy-binance-id-btn"
            onClick={handleCopyId}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md ${
              copiedId
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-[#F0B90B] hover:bg-[#fcd535] text-slate-950'
            }`}
          >
            {copiedId ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
