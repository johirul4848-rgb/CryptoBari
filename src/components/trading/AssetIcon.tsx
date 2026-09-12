import React from 'react';

interface AssetIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  showFlag?: boolean;
}

export const AssetIcon: React.FC<AssetIconProps> = ({ symbol, size = 'md', showFlag = true }) => {
  const isBTC = symbol.toUpperCase().includes('BTC');
  const isETH = symbol.toUpperCase().includes('ETH');
  const isSOL = symbol.toUpperCase().includes('SOL');
  const isBNB = symbol.toUpperCase().includes('BNB');
  const isXRP = symbol.toUpperCase().includes('XRP');

  const dim = size === 'sm' ? 'w-4 h-4 text-[10px]' : size === 'lg' ? 'w-6 h-6 text-sm' : 'w-5 h-5 text-xs';
  const flagDim = size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  // Determine base coin badge color & letter
  let bg = 'bg-amber-500';
  let letter = '₿';
  if (isETH) {
    bg = 'bg-indigo-500';
    letter = 'Ξ';
  } else if (isSOL) {
    bg = 'bg-purple-500';
    letter = 'S';
  } else if (isBNB) {
    bg = 'bg-yellow-500 text-black';
    letter = 'B';
  } else if (isXRP) {
    bg = 'bg-sky-500';
    letter = 'X';
  } else if (!isBTC) {
    bg = 'bg-blue-600';
    letter = symbol.charAt(0).toUpperCase();
  }

  return (
    <div className="relative inline-flex items-center shrink-0">
      {/* Coin Circle */}
      <div
        className={`${dim} rounded-full ${bg} text-white font-black flex items-center justify-center shadow-sm`}
      >
        {letter}
      </div>

      {/* Flag Circle Badge (USD/USDT Live Crypto pairs like Quotex) */}
      {showFlag && (
        <div
          className={`-ml-1.5 ${flagDim} rounded-full overflow-hidden border border-slate-900 shadow-sm shrink-0 flex flex-col justify-between`}
          title="Live Crypto"
        >
          <div className="h-[34%] bg-red-600 w-full flex items-center">
            <div className="h-full w-[45%] bg-blue-800" />
          </div>
          <div className="h-[33%] bg-white w-full" />
          <div className="h-[33%] bg-red-600 w-full" />
        </div>
      )}
    </div>
  );
};
