import { Trade, AccountMode, TradeDirection, TradeResult } from '../types';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { otcPriceEngine } from './otcEngine';
import { binanceMarketData } from './binanceMarketData';

export interface PlaceTradeParams {
  symbol: string;
  displayPair: string;
  direction: TradeDirection;
  investment: number;
  durationSeconds: number;
  accountMode: AccountMode;
  payoutRate: number;
  currentPrice: number;
  userId?: string;
  userEmail?: string;
}

export type TradeSettledListener = (trade: Trade) => void;
export type TradesChangeListener = (active: Trade[], all: Trade[]) => void;

class TradingEngine {
  private static instance: TradingEngine;

  private activeTrades: Map<string, Trade> = new Map();
  private historyTrades: Trade[] = [];
  private priceCache: Map<string, number> = new Map();
  private settledListeners: Set<TradeSettledListener> = new Set();
  private changeListeners: Set<TradesChangeListener> = new Set();
  private settlementIntervalId: NodeJS.Timeout | null = null;
  private isServerOnline = false;

  private constructor() {
    this.loadFromStorage();
    this.startSettlementLoop();
    this.checkServerHealth();
  }

  public static getInstance(): TradingEngine {
    if (!TradingEngine.instance) {
      TradingEngine.instance = new TradingEngine();
    }
    return TradingEngine.instance;
  }

  private getStorageKeyPrefix(): string {
    const uid = auth.currentUser?.uid || 'guest';
    return `cb_trades_${uid}`;
  }

  private loadFromStorage() {
    try {
      const activeRaw = localStorage.getItem(`${this.getStorageKeyPrefix()}_active`);
      if (activeRaw) {
        const parsed: Trade[] = JSON.parse(activeRaw);
        if (Array.isArray(parsed)) {
          for (const t of parsed) {
            // Keep if not expired, or let settlement process immediately if expired
            if (t.status === 'ACTIVE') {
              this.activeTrades.set(t.id, t);
            }
          }
        }
      }

      const historyRaw = localStorage.getItem(`${this.getStorageKeyPrefix()}_history`);
      if (historyRaw) {
        const parsed: Trade[] = JSON.parse(historyRaw);
        if (Array.isArray(parsed)) {
          this.historyTrades = parsed.slice(0, 300);
        }
      }
    } catch (e) {
      console.warn('Could not load trades from localStorage:', e);
    }
  }

  private saveToStorage() {
    try {
      const activeList = Array.from(this.activeTrades.values());
      localStorage.setItem(`${this.getStorageKeyPrefix()}_active`, JSON.stringify(activeList));
      localStorage.setItem(`${this.getStorageKeyPrefix()}_history`, JSON.stringify(this.historyTrades.slice(0, 300)));
    } catch {
      // quota or private browsing
    }
  }

  private async checkServerHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('/api/trades/active', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          this.isServerOnline = true;
        }
      }
    } catch {
      this.isServerOnline = false;
    }
  }

  public updatePrice(symbol: string, price: number) {
    if (price > 0 && !isNaN(price)) {
      this.priceCache.set(symbol, price);
    }
  }

  public getLatestPrice(symbol: string): number {
    const cached = this.priceCache.get(symbol);
    if (cached && cached > 0) return cached;

    if (symbol.endsWith('_OTC') || otcPriceEngine.getPair(symbol)) {
      const otcPrice = otcPriceEngine.getCurrentPrice(symbol);
      if (otcPrice > 0) return otcPrice;
    }

    const binancePrice = binanceMarketData.getCurrentPrice();
    if (binancePrice > 0) return binancePrice;

    return 0;
  }

  public async placeTrade(params: PlaceTradeParams): Promise<Trade> {
    const now = Date.now();
    const duration = Math.max(5, params.durationSeconds || 30);
    const payout = params.payoutRate || 85;
    const potentialPayout = Number((params.investment * (1 + payout / 100)).toFixed(2));

    // Resolve authoritative non-zero entry price
    let entryPrice = params.currentPrice;
    if (!entryPrice || entryPrice <= 0 || isNaN(entryPrice)) {
      entryPrice = this.getLatestPrice(params.symbol);
    }
    if (!entryPrice || entryPrice <= 0) {
      entryPrice = 1.0;
    }

    const tradeId = 'CB-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const uid = params.userId || auth.currentUser?.uid || 'trader_user';

    const newTrade: Trade = {
      id: tradeId,
      userId: uid,
      accountMode: params.accountMode,
      symbol: params.symbol,
      displayPair: params.displayPair,
      direction: params.direction,
      investment: params.investment,
      payoutRate: payout,
      potentialPayout,
      entryPrice,
      entryTimestamp: now,
      expiryTimestamp: now + duration * 1000,
      durationSeconds: duration,
      result: 'PENDING',
      profit: 0,
      status: 'ACTIVE',
      priceSource: {
        provider: params.symbol.endsWith('_OTC') ? 'OTC' : 'BINANCE',
        market: params.symbol.endsWith('_OTC') ? 'SYNTHETIC' : 'SPOT',
        symbol: params.symbol,
      },
      createdAt: now,
    };

    // Store in active trades map immediately so it appears on chart
    this.activeTrades.set(newTrade.id, newTrade);
    this.saveToStorage();
    this.emitChange();

    // Async sync with Firestore if authenticated
    if (auth.currentUser) {
      setDoc(doc(db, 'trades', newTrade.id), {
        id: newTrade.id,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || params.userEmail || '',
        accountMode: newTrade.accountMode,
        symbol: newTrade.symbol,
        displayPair: newTrade.displayPair,
        direction: newTrade.direction,
        investment: newTrade.investment,
        payoutRate: newTrade.payoutRate,
        potentialPayout: newTrade.potentialPayout,
        entryPrice: newTrade.entryPrice,
        entryTimestamp: newTrade.entryTimestamp,
        expiryTimestamp: newTrade.expiryTimestamp,
        durationSeconds: newTrade.durationSeconds,
        result: 'PENDING',
        profit: 0,
        status: 'ACTIVE',
        createdAt: newTrade.createdAt,
      }, { merge: true }).catch((err) => {
        console.warn('Firestore trade log init:', err);
      });
    }

    // Attempt server sync if backend route exists (non-blocking)
    fetch('/api/trades/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        entryPrice,
      }),
    })
      .then((res) => {
        if (res.ok) {
          this.isServerOnline = true;
        }
      })
      .catch(() => {
        this.isServerOnline = false;
      });

    return newTrade;
  }

  private startSettlementLoop() {
    if (this.settlementIntervalId) {
      clearInterval(this.settlementIntervalId);
    }

    // Run high frequency settlement check (every 200ms)
    this.settlementIntervalId = setInterval(() => {
      this.checkAndSettleTrades();
    }, 200);
  }

  private checkAndSettleTrades() {
    if (this.activeTrades.size === 0) return;

    const now = Date.now();
    const settledList: Trade[] = [];

    for (const [id, trade] of this.activeTrades.entries()) {
      if (trade.status !== 'ACTIVE') {
        this.activeTrades.delete(id);
        continue;
      }

      if (now >= trade.expiryTimestamp) {
        // Time expired! Settle this trade authoritatively
        let exitPrice = this.getLatestPrice(trade.symbol);
        if (!exitPrice || exitPrice <= 0 || isNaN(exitPrice)) {
          exitPrice = trade.entryPrice;
        }

        let result: TradeResult = 'TIE';
        if (trade.direction === 'UP') {
          if (exitPrice > trade.entryPrice) {
            result = 'WIN';
          } else if (exitPrice < trade.entryPrice) {
            result = 'LOSS';
          } else {
            result = 'TIE';
          }
        } else {
          // DOWN
          if (exitPrice < trade.entryPrice) {
            result = 'WIN';
          } else if (exitPrice > trade.entryPrice) {
            result = 'LOSS';
          } else {
            result = 'TIE';
          }
        }

        let profit = 0;
        if (result === 'WIN') {
          profit = Number((trade.investment * (trade.payoutRate / 100)).toFixed(2));
        } else if (result === 'LOSS') {
          profit = -trade.investment;
        } else {
          profit = 0;
        }

        const settledTrade: Trade = {
          ...trade,
          status: 'SETTLED',
          result,
          profit,
          exitPrice,
          settledTimestamp: now,
        };

        this.activeTrades.delete(id);
        this.historyTrades.unshift(settledTrade);
        settledList.push(settledTrade);

        // Update Firestore if user is authenticated
        if (auth.currentUser) {
          updateDoc(doc(db, 'trades', settledTrade.id), {
            status: 'SETTLED',
            result: settledTrade.result,
            profit: settledTrade.profit,
            exitPrice: settledTrade.exitPrice,
            settledTimestamp: now,
          }).catch((err) => {
            console.warn('Firestore trade settlement record update:', err);
          });
        }
      }
    }

    if (settledList.length > 0) {
      this.saveToStorage();
      this.emitChange();

      for (const settled of settledList) {
        for (const listener of this.settledListeners) {
          try {
            listener(settled);
          } catch (e) {
            console.error('Error in trade settled listener:', e);
          }
        }
      }
    }
  }

  public getActiveTrades(): Trade[] {
    return Array.from(this.activeTrades.values());
  }

  public getTradeHistory(): Trade[] {
    return [...this.historyTrades];
  }

  public getAllTrades(): Trade[] {
    return [...this.getActiveTrades(), ...this.historyTrades];
  }

  public onTradeSettled(listener: TradeSettledListener): () => void {
    this.settledListeners.add(listener);
    return () => {
      this.settledListeners.delete(listener);
    };
  }

  public onTradesChange(listener: TradesChangeListener): () => void {
    this.changeListeners.add(listener);
    listener(this.getActiveTrades(), this.getAllTrades());
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  private emitChange() {
    const active = this.getActiveTrades();
    const all = this.getAllTrades();
    for (const listener of this.changeListeners) {
      try {
        listener(active, all);
      } catch (e) {
        console.error('Error in trades change listener:', e);
      }
    }
  }
}

export const tradingEngine = TradingEngine.getInstance();
