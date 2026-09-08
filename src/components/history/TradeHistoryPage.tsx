import React, { useState } from 'react';
import { Trade } from '../../types';
import { ArrowUp, ArrowDown, CheckCircle, XCircle, Clock, Search, Download } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TradeHistoryPageProps {
  trades: Trade[];
}

export const TradeHistoryPage: React.FC<TradeHistoryPageProps> = ({ trades }) => {
  const [filter, setFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'DEMO' | 'LIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrades = trades.filter(t => {
    if (filter === 'WIN' && t.result !== 'WIN') return false;
    if (filter === 'LOSS' && t.result !== 'LOSS') return false;
    if (filter === 'DEMO' && t.accountMode !== 'DEMO') return false;
    if (filter === 'LIVE' && t.accountMode !== 'LIVE') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.symbol.toLowerCase().includes(q) ||
        t.displayPair.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    sound.playClick();
    const headers = ['Trade ID', 'Asset', 'Direction', 'Investment', 'Entry Price', 'Exit Price', 'Result', 'Profit', 'Mode', 'Timestamp'];
    const rows = filteredTrades.map(t => [
      t.id,
      t.displayPair,
      t.direction,
      t.investment,
      t.entryPrice,
      t.exitPrice || 'N/A',
      t.result,
      t.profit,
      t.accountMode,
      new Date(t.createdAt).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CryptoBari_Trades_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalProfit = filteredTrades.reduce((acc, t) => acc + (t.result === 'WIN' ? t.profit : t.result === 'LOSS' ? -t.investment : 0), 0);
  const winCount = filteredTrades.filter(t => t.result === 'WIN').length;
  const winRate = filteredTrades.length > 0 ? ((winCount / filteredTrades.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0c1018] text-slate-100 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Stats Cards */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100">My Trading History</h1>
            <p className="text-xs text-slate-400 mt-1">Authoritative Binance-settled binary positions and audit logs</p>
          </div>

          {/* Quick summary stats */}
          <div className="flex items-center gap-3">
            <div className="bg-[#141b2b] border border-slate-800 rounded-lg px-3 py-2 text-right">
              <div className="text-[11px] text-slate-400">Total Positions</div>
              <div className="font-bold text-sm text-slate-100">{filteredTrades.length}</div>
            </div>
            <div className="bg-[#141b2b] border border-slate-800 rounded-lg px-3 py-2 text-right">
              <div className="text-[11px] text-slate-400">Win Rate</div>
              <div className="font-bold text-sm text-emerald-400">{winRate}%</div>
            </div>
            <div className="bg-[#141b2b] border border-slate-800 rounded-lg px-3 py-2 text-right">
              <div className="text-[11px] text-slate-400">Net Profit</div>
              <div className={`font-mono font-bold text-sm ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalProfit >= 0 ? `+$${totalProfit.toFixed(2)}` : `-$${Math.abs(totalProfit).toFixed(2)}`}
              </div>
            </div>
            <button
              id="export-trades-btn"
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#182236] hover:bg-[#202d48] border border-slate-700 rounded-lg text-xs font-bold text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Filter and Search toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111624] p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(['ALL', 'WIN', 'LOSS', 'DEMO', 'LIVE'] as const).map(f => (
              <button
                key={f}
                id={`filter-btn-${f}`}
                onClick={() => {
                  sound.playClick();
                  setFilter(f);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filter === f
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-[#182133] text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#182234] border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-[#111624] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151c2c] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Trade ID</th>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Investment</th>
                <th className="px-4 py-3">Entry Price</th>
                <th className="px-4 py-3">Expiry Price</th>
                <th className="px-4 py-3">Payout</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 font-sans">
                    No trades found. Start placing UP or DOWN positions on the trading terminal!
                  </td>
                </tr>
              ) : (
                filteredTrades.map(trade => {
                  const isUp = trade.direction === 'UP';
                  const isWin = trade.result === 'WIN';
                  const isTie = trade.result === 'TIE';

                  return (
                    <tr key={trade.id} className="hover:bg-[#161d2d] transition-colors">
                      <td className="px-4 py-3 text-slate-400">{trade.id}</td>
                      <td className="px-4 py-3 font-sans font-bold text-slate-200">
                        <span className="flex items-center gap-1.5">
                          {trade.displayPair}
                          <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">
                            {trade.accountMode}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[11px] ${
                            isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-200">${trade.investment.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-300">${trade.entryPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : 'Active'}
                      </td>
                      <td className="px-4 py-3 text-amber-400 font-bold">+{trade.payoutRate}%</td>
                      <td className="px-4 py-3 font-sans">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[11px] ${
                            isWin
                              ? 'bg-emerald-500/25 text-emerald-300'
                              : isTie
                              ? 'bg-amber-500/25 text-amber-300'
                              : 'bg-rose-500/25 text-rose-300'
                          }`}
                        >
                          {isWin ? <CheckCircle className="w-3 h-3" /> : isTie ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {trade.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {new Date(trade.createdAt).toLocaleTimeString()} {new Date(trade.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3">
          {filteredTrades.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm bg-[#111624] rounded-xl border border-slate-800 p-6">
              No trades recorded yet.
            </div>
          ) : (
            filteredTrades.map(trade => {
              const isUp = trade.direction === 'UP';
              const isWin = trade.result === 'WIN';

              return (
                <div
                  key={trade.id}
                  className="bg-[#111624] border border-slate-800/80 rounded-xl p-3.5 space-y-2 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{trade.displayPair}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold">
                        {trade.accountMode}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-extrabold ${
                        isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {trade.result} {isWin ? `+$${trade.profit.toFixed(2)}` : `-$${trade.investment.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 text-slate-400 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-500 block text-[10px]">DIRECTION / INVEST</span>
                      <span className={isUp ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {trade.direction} (${trade.investment})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">ENTRY / EXIT PRICE</span>
                      <span>${trade.entryPrice.toFixed(2)} → ${trade.exitPrice ? trade.exitPrice.toFixed(2) : '---'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>ID: {trade.id}</span>
                    <span>{new Date(trade.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
