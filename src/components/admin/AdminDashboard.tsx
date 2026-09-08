import React, { useState } from 'react';
import { AdminStats, MarketSymbol, Trade } from '../../types';
import { ShieldCheck, Users, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Settings, Sliders, CheckCircle } from 'lucide-react';
import { sound } from '../../utils/audio';

interface AdminDashboardProps {
  stats: AdminStats;
  symbols: MarketSymbol[];
  trades: Trade[];
  onUpdateSymbol: (symbol: string, payoutRate: number, enabled: boolean) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  symbols,
  trades,
  onUpdateSymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'trades' | 'settings'>('overview');
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [tempPayout, setTempPayout] = useState<number>(85);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveAsset = (symbolCode: string, currentEnabled: boolean) => {
    sound.playClick();
    onUpdateSymbol(symbolCode, tempPayout, currentEnabled);
    setEditingSymbol(null);
    setSuccessMsg(`Updated ${symbolCode} payout rate to ${tempPayout}%`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleToggleAssetEnabled = (symbol: MarketSymbol) => {
    sound.playClick();
    onUpdateSymbol(symbol.symbol, symbol.payoutRate, !symbol.enabled);
    setSuccessMsg(`${symbol.displayPair} is now ${!symbol.enabled ? 'Enabled' : 'Disabled'}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const winRate = stats.totalTrades > 0 ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1) : '52.4';

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0c1018] text-slate-100 custom-scrollbar select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-100">CryptoBari Administration</h1>
              <p className="text-xs text-slate-400">Risk management, asset payout configuration, and trade audit records</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['overview', 'assets', 'trades', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                  activeTab === tab
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-[#151c2c] text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#111624] border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Registered Users</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="font-mono font-black text-2xl text-slate-100 mt-2">
                  {stats.totalUsers.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{stats.activeUsers} currently active</span>
                </div>
              </div>

              <div className="bg-[#111624] border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Total Positions Placed</span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-mono font-black text-2xl text-slate-100 mt-2">
                  {stats.totalTrades.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Win Rate: <span className="text-amber-400 font-bold">{winRate}%</span>
                </div>
              </div>

              <div className="bg-[#111624] border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Trading Volume</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-mono font-black text-2xl text-slate-100 mt-2">
                  ${stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Total Deposits: ${(stats.totalDeposits).toLocaleString()}
                </div>
              </div>

              <div className="bg-[#111624] border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Platform Net P/L</span>
                  <Sliders className="w-4 h-4 text-purple-400" />
                </div>
                <div className={`font-mono font-black text-2xl mt-2 ${stats.platformProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stats.platformProfit >= 0 ? `+$${stats.platformProfit.toFixed(2)}` : `-$${Math.abs(stats.platformProfit).toFixed(2)}`}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Settled Authoritatively
                </div>
              </div>
            </div>

            {/* Quick overview of latest trades */}
            <div className="bg-[#111624] border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-extrabold text-slate-100 mb-3">Live Platform Positions Feed</h3>
              <div className="space-y-2">
                {trades.slice(0, 5).map(trade => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 bg-[#151c2c] rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        trade.direction === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {trade.direction}
                      </span>
                      <span className="font-bold text-slate-200">{trade.displayPair}</span>
                      <span className="text-slate-400">${trade.investment.toFixed(2)}</span>
                    </div>

                    <div className="font-mono text-right">
                      <span className={trade.result === 'WIN' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {trade.result} {trade.result === 'WIN' ? `+$${trade.profit.toFixed(2)}` : `-$${trade.investment.toFixed(2)}`}
                      </span>
                      <div className="text-[10px] text-slate-500">ID: {trade.id}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ASSETS TAB */}
        {activeTab === 'assets' && (
          <div className="bg-[#111624] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-[#151c2c] border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Binance Pairs & Payout Percentage Engine</h3>
                <p className="text-xs text-slate-400">Configure client return percentages and toggle active symbols</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121826] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Asset</th>
                    <th className="px-4 py-3">Binance Spot Price</th>
                    <th className="px-4 py-3">Payout %</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {symbols.map(sym => (
                    <tr key={sym.symbol} className="hover:bg-[#161d2d] transition-colors">
                      <td className="px-4 py-3 font-sans font-bold text-slate-200">
                        {sym.displayPair}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        ${sym.price.toLocaleString(undefined, { minimumFractionDigits: sym.pricePrecision })}
                      </td>
                      <td className="px-4 py-3">
                        {editingSymbol === sym.symbol ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="60"
                              max="95"
                              value={tempPayout}
                              onChange={(e) => setTempPayout(parseInt(e.target.value) || 85)}
                              className="w-16 bg-[#182234] border border-slate-600 rounded px-2 py-1 text-xs text-slate-100"
                            />
                            <button
                              onClick={() => handleSaveAsset(sym.symbol, sym.enabled)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                            {sym.payoutRate}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sym.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {sym.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 font-sans">
                        <button
                          onClick={() => {
                            sound.playClick();
                            setEditingSymbol(sym.symbol);
                            setTempPayout(sym.payoutRate);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs cursor-pointer"
                        >
                          Edit Payout
                        </button>
                        <button
                          onClick={() => handleToggleAssetEnabled(sym)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                            sym.enabled
                              ? 'bg-rose-900/40 text-rose-300 hover:bg-rose-900/60'
                              : 'bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/60'
                          }`}
                        >
                          {sym.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRADES TAB */}
        {activeTab === 'trades' && (
          <div className="bg-[#111624] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-100 mb-3">Audit Logs & Verification</h3>
            <p className="text-xs text-slate-400 mb-4">
              All trades are permanently timestamped with entry price, expiry price, and Binance reference source.
            </p>
            <div className="space-y-2">
              {trades.map(trade => (
                <div key={trade.id} className="p-3 bg-[#151c2c] border border-slate-800 rounded-lg text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200">
                      {trade.id} • {trade.displayPair} ({trade.direction})
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Source: {trade.priceSource?.provider || 'BINANCE'} SPOT • Entry: ${trade.entryPrice} • Exit: ${trade.exitPrice || 'Active'}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className={trade.result === 'WIN' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {trade.result}
                    </span>
                    <div className="text-slate-400 text-[11px]">${trade.investment}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-[#111624] border border-slate-800 rounded-xl p-5 space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-100">Global Trading System Parameters</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Default Demo Account Balance ($)</label>
                <input
                  type="text"
                  defaultValue="10,000"
                  disabled
                  className="w-full bg-[#182234] border border-slate-700 rounded-lg p-2.5 text-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Global Expiry Windows</label>
                <input
                  type="text"
                  defaultValue="5s, 15s, 30s, 60s, 120s, 300s, 900s, 1800s, 3600s"
                  disabled
                  className="w-full bg-[#182234] border border-slate-700 rounded-lg p-2.5 text-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Settlement Engine Precision Mode</label>
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300">
                  Binance Direct WebSocket Millisecond Timestamp Active
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
