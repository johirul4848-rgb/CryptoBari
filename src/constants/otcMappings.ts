import { resolveLiveMarketSymbol, ALL_LIVE_CONFIGS, LivePairConfig } from './liveMarketPairs';

export interface OtcUnderlyingConfig {
  underlying: string;
  multiplier: number;
  displayName: string;
  pricePrecision: number;
}

// Backward-compatible mapping dictionary built from comprehensive live pairs
export const OTC_BINANCE_MAPPINGS: Record<string, OtcUnderlyingConfig> = {};

ALL_LIVE_CONFIGS.forEach((c) => {
  if (c.underlying) {
    OTC_BINANCE_MAPPINGS[c.symbol] = {
      underlying: c.underlying,
      multiplier: c.multiplier ?? 1.0,
      displayName: c.displayPair,
      pricePrecision: c.pricePrecision,
    };
    // Also support any legacy _OTC queries cleanly
    OTC_BINANCE_MAPPINGS[`${c.symbol}_OTC`] = {
      underlying: c.underlying,
      multiplier: c.multiplier ?? 1.0,
      displayName: c.displayPair,
      pricePrecision: c.pricePrecision,
    };
  }
});

// Backward compatibility helper
export function resolveUnderlyingSymbol(symbol: string): { underlying: string; multiplier: number; precision?: number } {
  const resolved = resolveLiveMarketSymbol(symbol);
  return {
    underlying: resolved.underlying,
    multiplier: resolved.multiplier,
    precision: resolved.precision,
  };
}

export { ALL_LIVE_CONFIGS };
