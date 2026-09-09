export type TraderTier = 'STANDARD' | 'SILVER' | 'VIP';

export interface TierInfo {
  tier: TraderTier;
  label: string;
  badgeClass: string;
  color: string;
  minBalance: number;
  nextTierBalance?: number;
  nextTierLabel?: string;
  progressPercent: number;
}

export function getTraderTier(liveBalance: number): TierInfo {
  const bal = Math.max(0, Number(liveBalance) || 0);

  if (bal >= 1000) {
    return {
      tier: 'VIP',
      label: 'VIP Member',
      badgeClass: 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 text-slate-950 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-black',
      color: '#f59e0b',
      minBalance: 1000,
      progressPercent: 100,
    };
  }

  if (bal >= 500) {
    const progress = Math.min(100, Math.round(((bal - 500) / (1000 - 500)) * 100));
    return {
      tier: 'SILVER',
      label: 'Silver Member',
      badgeClass: 'bg-gradient-to-r from-slate-200 via-slate-300 to-zinc-400 text-slate-950 border border-white/60 shadow-[0_0_12px_rgba(226,232,240,0.4)] font-black',
      color: '#cbd5e1',
      minBalance: 500,
      nextTierBalance: 1000,
      nextTierLabel: 'VIP',
      progressPercent: progress,
    };
  }

  const progress = Math.min(100, Math.round((bal / 500) * 100));
  return {
    tier: 'STANDARD',
    label: 'Standard Trader',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold',
    color: '#10b981',
    minBalance: 0,
    nextTierBalance: 500,
    nextTierLabel: 'Silver',
    progressPercent: progress,
  };
}
