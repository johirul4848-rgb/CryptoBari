import { CandleData } from '../types';

export interface IndicatorPoint {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  time: any;
  value: number;
}

export interface BollingerBandPoint {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  time: any;
  upper: number;
  middle: number;
  lower: number;
}

/**
 * Sanitize indicator points to ensure strictly ascending unique timestamps
 * and valid finite values to prevent Lightweight Charts Assertion failures and crashes.
 */
export function sanitizeIndicatorPoints(points: IndicatorPoint[]): IndicatorPoint[] {
  if (!points || points.length === 0) return [];
  const sanitized: IndicatorPoint[] = [];
  let prevTime: number | null = null;

  for (const pt of points) {
    const t = Number(pt.time);
    const v = Number(pt.value);
    if (!isNaN(t) && isFinite(v) && !isNaN(v)) {
      if (prevTime === null || t > prevTime) {
        sanitized.push({
          time: t,
          value: Number(v.toFixed(4)),
        });
        prevTime = t;
      }
    }
  }
  return sanitized;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(candles: CandleData[], period: number): IndicatorPoint[] {
  if (!candles || candles.length < period) return [];
  const raw: IndicatorPoint[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    raw.push({
      time: candles[i].time,
      value: sum / period,
    });
  }
  return sanitizeIndicatorPoints(raw);
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(candles: CandleData[], period: number): IndicatorPoint[] {
  if (!candles || candles.length < period) return [];
  const raw: IndicatorPoint[] = [];
  const multiplier = 2 / (period + 1);

  // Initial SMA as starting point
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEMA = sum / period;
  raw.push({ time: candles[period - 1].time, value: prevEMA });

  for (let i = period; i < candles.length; i++) {
    const currentClose = candles[i].close;
    const currentEMA = (currentClose - prevEMA) * multiplier + prevEMA;
    raw.push({
      time: candles[i].time,
      value: currentEMA,
    });
    prevEMA = currentEMA;
  }
  return sanitizeIndicatorPoints(raw);
}

/**
 * Calculate Bollinger Bands (SMA + 2 StdDev)
 */
export function calculateBollingerBands(
  candles: CandleData[],
  period: number = 20,
  stdDevMultiplier: number = 2.0
): { upper: IndicatorPoint[]; middle: IndicatorPoint[]; lower: IndicatorPoint[] } {
  if (!candles || candles.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const rawUpper: IndicatorPoint[] = [];
  const rawMiddle: IndicatorPoint[] = [];
  const rawLower: IndicatorPoint[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    const avg = sum / period;

    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      const diff = candles[i - j].close - avg;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / period);

    rawMiddle.push({ time: candles[i].time, value: avg });
    rawUpper.push({ time: candles[i].time, value: avg + stdDev * stdDevMultiplier });
    rawLower.push({ time: candles[i].time, value: avg - stdDev * stdDevMultiplier });
  }

  return {
    upper: sanitizeIndicatorPoints(rawUpper),
    middle: sanitizeIndicatorPoints(rawMiddle),
    lower: sanitizeIndicatorPoints(rawLower),
  };
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(candles: CandleData[], period: number = 14): { latestRSI: number; points: IndicatorPoint[] } {
  if (!candles || candles.length <= period) {
    return { latestRSI: 50, points: [] };
  }

  const raw: IndicatorPoint[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const firstRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const firstRSI = 100 - 100 / (1 + firstRS);
  raw.push({ time: candles[period].time, value: firstRSI });

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    raw.push({ time: candles[i].time, value: rsi });
  }

  const sanitized = sanitizeIndicatorPoints(raw);
  const latestRSI = sanitized.length > 0 ? sanitized[sanitized.length - 1].value : 50;
  return { latestRSI, points: sanitized };
}

/**
 * Calculate Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(
  candles: CandleData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macdLine: number;
  signalLine: number;
  histogram: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
} {
  if (!candles || candles.length < slowPeriod + signalPeriod) {
    return { macdLine: 0, signalLine: 0, histogram: 0, trend: 'NEUTRAL' };
  }

  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  if (fastEMA.length === 0 || slowEMA.length === 0) {
    return { macdLine: 0, signalLine: 0, histogram: 0, trend: 'NEUTRAL' };
  }

  // Align timestamps
  const slowTimeMap = new Map<number, number>();
  slowEMA.forEach((pt) => slowTimeMap.set(Number(pt.time), pt.value));

  const macdPoints: IndicatorPoint[] = [];
  for (const f of fastEMA) {
    const t = Number(f.time);
    const slowVal = slowTimeMap.get(t);
    if (slowVal !== undefined) {
      macdPoints.push({
        time: t,
        value: f.value - slowVal,
      });
    }
  }

  if (macdPoints.length < signalPeriod) {
    return { macdLine: 0, signalLine: 0, histogram: 0, trend: 'NEUTRAL' };
  }

  // Calculate signal line (EMA of MACD)
  let signalEMA = macdPoints.slice(0, signalPeriod).reduce((acc, p) => acc + p.value, 0) / signalPeriod;
  const k = 2 / (signalPeriod + 1);

  for (let i = signalPeriod; i < macdPoints.length; i++) {
    signalEMA = macdPoints[i].value * k + signalEMA * (1 - k);
  }

  const latestMACD = macdPoints[macdPoints.length - 1].value;
  const histogram = latestMACD - signalEMA;
  const trend = histogram > 0 ? 'BULLISH' : histogram < 0 ? 'BEARISH' : 'NEUTRAL';

  return {
    macdLine: Number(latestMACD.toFixed(4)),
    signalLine: Number(signalEMA.toFixed(4)),
    histogram: Number(histogram.toFixed(4)),
    trend,
  };
}


