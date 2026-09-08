import React from 'react';
import { CandlestickChart, BarChart3, History, Wallet, LifeBuoy, Settings, ShieldAlert, Globe } from 'lucide-react';
import { sound } from '../../utils/audio';

export type NavTab = 'trade' | 'markets' | 'history' | 'wallet' | 'support' | 'admin' | 'landing';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeTradesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeTradesCount,
}) => {
  const navItems = [
    { id: 'trade', label: 'Trade', icon: CandlestickChart, badge: activeTradesCount > 0 ? activeTradesCount : null },
    { id: 'markets', label: 'Markets', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'landing', label: 'Overview', icon: Globe },
    { id: 'admin', label: 'Admin', icon: ShieldAlert },
  ];

  return (
    <aside className="hidden md:flex flex-col items-center w-16 bg-[#0c1018] border-r border-slate-800/80 py-3 select-none shrink-0 z-20 justify-between">
      {/* Top Nav Icons */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => {
                sound.playClick();
                onSelectTab(item.id as NavTab);
              }}
              title={item.label}
              className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#151c2c]'
              }`}
            >
              <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className={`text-[9px] font-bold mt-1 ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
                {item.label}
              </span>

              {/* Active trade badge */}
              {item.badge && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Settings Icon */}
      <div className="w-full px-2 flex flex-col items-center">
        <button
          id="nav-settings-btn"
          onClick={() => {
            sound.playClick();
            onSelectTab('wallet');
          }}
          title="Settings"
          className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-[#151c2c] transition-colors cursor-pointer"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-semibold mt-1">Config</span>
        </button>
      </div>
    </aside>
  );
};
