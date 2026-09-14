export interface ReferredUser {
  id: string;
  name: string;
  joinedDate: string;
  totalTrades: number;
  totalVolume: number;
  commissionGenerated: number;
  status: 'Active' | 'Inactive';
  lastActivity: string;
}

export interface CommissionLog {
  id: string;
  timestamp: number;
  type: 'ACTIVATION_BONUS' | 'TRADE_LOSS_COMMISSION' | 'TRADE_WIN_DEDUCTION' | 'CONVERT_TO_LIVE';
  amount: number;
  description: string;
  traderName?: string;
}

export interface ReferralData {
  myReferralCode: string;
  commissionBalance: number;
  totalEarned: number;
  convertedTotal: number;
  activatedSponsorCode: string | null;
  referredUsers: ReferredUser[];
  commissionLogs: CommissionLog[];
}

const STORAGE_KEY_REFERRAL = 'cb_referral_system_v2';
const LEGACY_STORAGE_KEY = 'cb_referral_system_v1';
const MY_CODE_KEY = 'cb_my_referral_id';

class ReferralService {
  private listeners: Set<(data: ReferralData) => void> = new Set();
  private data: ReferralData;

  constructor() {
    this.data = this.loadInitialData();
  }

  private loadInitialData(): ReferralData {
    // 1. Get or generate clean referral code
    let myCode = localStorage.getItem(MY_CODE_KEY);
    if (!myCode) {
      myCode = `CB${Math.floor(10000 + Math.random() * 90000)}`;
      localStorage.setItem(MY_CODE_KEY, myCode);
    } else {
      myCode = myCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }

    try {
      // Check v2 first
      const saved = localStorage.getItem(STORAGE_KEY_REFERRAL);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasSponsor = parsed.activatedSponsorCode || null;
        let validLogs: CommissionLog[] = Array.isArray(parsed.commissionLogs)
          ? parsed.commissionLogs.filter((l: CommissionLog) => !['trader_hasan99', 'crypto_kamrul', 'tanvir_scalper'].includes(l.traderName || ''))
          : [];

        // If no sponsor activated and no legitimate trade logs, force $0.00
        let balance = typeof parsed.commissionBalance === 'number' ? parsed.commissionBalance : 0.0;
        if (balance === 42.5 || (!hasSponsor && validLogs.length === 0)) {
          balance = 0.0;
        } else if (hasSponsor && balance === 42.5) {
          balance = 10.0;
        }

        const validReferredUsers: ReferredUser[] = Array.isArray(parsed.referredUsers)
          ? parsed.referredUsers.filter((u: ReferredUser) => !['trader_hasan99', 'crypto_kamrul', 'tanvir_scalper'].includes(u.name))
          : [];

        return {
          myReferralCode: myCode,
          commissionBalance: Math.max(0, balance),
          totalEarned: typeof parsed.totalEarned === 'number' && parsed.totalEarned !== 42.5 ? parsed.totalEarned : balance,
          convertedTotal: typeof parsed.convertedTotal === 'number' ? parsed.convertedTotal : 0.0,
          activatedSponsorCode: hasSponsor,
          referredUsers: validReferredUsers,
          commissionLogs: validLogs,
        };
      }

      // If only v1 exists, clean out demo seed data and reset initial 42.50 to 0.00
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        const hasSponsor = parsed.activatedSponsorCode || null;
        // If sponsor was activated, user gets $10, otherwise strict $0.00
        const initialBal = hasSponsor ? 10.0 : 0.0;
        const fresh: ReferralData = {
          myReferralCode: myCode,
          commissionBalance: initialBal,
          totalEarned: initialBal,
          convertedTotal: typeof parsed.convertedTotal === 'number' ? parsed.convertedTotal : 0.0,
          activatedSponsorCode: hasSponsor,
          referredUsers: [], // Accurate: remove demo users
          commissionLogs: hasSponsor ? [{
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            type: 'ACTIVATION_BONUS',
            amount: 10.0,
            description: `+$10.00 Instant Welcome Bonus for activating sponsor code ${hasSponsor}`,
            traderName: hasSponsor,
          }] : [],
        };
        this.persist(fresh);
        return fresh;
      }
    } catch (e) {
      console.warn('Error loading referral data:', e);
    }

    // Default: strict $0.00 initial balance, empty referred traders
    return {
      myReferralCode: myCode,
      commissionBalance: 0.0,
      totalEarned: 0.0,
      convertedTotal: 0.0,
      activatedSponsorCode: null,
      referredUsers: [],
      commissionLogs: [],
    };
  }

  private persist(data: ReferralData) {
    try {
      localStorage.setItem(STORAGE_KEY_REFERRAL, JSON.stringify(data));
      // Broadcast to all active components
      window.dispatchEvent(new CustomEvent('cb_referral_state_changed', { detail: data }));
    } catch (e) {
      console.warn('Failed to persist referral data:', e);
    }
  }

  public getData(): ReferralData {
    return { ...this.data };
  }

  public subscribe(cb: (data: ReferralData) => void): () => void {
    this.listeners.add(cb);
    cb(this.getData());
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.persist(this.data);
    this.listeners.forEach((cb) => cb(this.getData()));
  }

  // Activate sponsor code (awards $10 bonus once)
  public activateSponsor(sponsorCode: string, userName?: string): { success: boolean; message: string; bonus: number } {
    const cleanCode = sponsorCode.trim().toUpperCase();

    if (this.data.activatedSponsorCode) {
      return {
        success: false,
        message: `You have already activated sponsor code: ${this.data.activatedSponsorCode}. Only 1 code can be activated per account.`,
        bonus: 0,
      };
    }

    if (!cleanCode || cleanCode.length < 4) {
      return {
        success: false,
        message: 'Please enter a valid Referral Code (at least 4 alphanumeric characters).',
        bonus: 0,
      };
    }

    if (cleanCode === this.data.myReferralCode.toUpperCase()) {
      return {
        success: false,
        message: 'You cannot activate your own Referral Code as your sponsor.',
        bonus: 0,
      };
    }

    // Award $10.00 welcome bonus to referral commission balance
    const bonus = 10.0;
    const newBal = Number((this.data.commissionBalance + bonus).toFixed(2));
    const newTot = Number((this.data.totalEarned + bonus).toFixed(2));

    const newLog: CommissionLog = {
      id: `log-act-${Date.now()}`,
      timestamp: Date.now(),
      type: 'ACTIVATION_BONUS',
      amount: bonus,
      description: `+$10.00 Instant Welcome Bonus for activating sponsor code ${cleanCode}`,
      traderName: cleanCode,
    };

    this.data.activatedSponsorCode = cleanCode;
    this.data.commissionBalance = newBal;
    this.data.totalEarned = newTot;
    this.data.commissionLogs = [newLog, ...this.data.commissionLogs];

    this.notify();

    return {
      success: true,
      message: `🎉 Sponsor code ${cleanCode} activated successfully! $10.00 bonus has been credited to your Referral Balance.`,
      bonus,
    };
  }

  // Register a new referred trader into the network
  public registerReferredTrader(traderName: string, initialTradeAmount: number = 0): ReferredUser {
    const cleanName = traderName.trim() || `trader_${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = this.data.referredUsers.find((u) => u.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      return existing;
    }

    const newUser: ReferredUser = {
      id: `ref-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: cleanName,
      joinedDate: new Date().toISOString().split('T')[0],
      totalTrades: initialTradeAmount > 0 ? 1 : 0,
      totalVolume: initialTradeAmount,
      commissionGenerated: 0,
      status: 'Active',
      lastActivity: 'Just now',
    };

    this.data.referredUsers = [newUser, ...this.data.referredUsers];
    this.notify();
    return newUser;
  }

  // Core Rule: 20% on trader LOSS, 20% reduced from balance on trader WIN
  public processTradeCommission(
    tradeAmount: number,
    result: 'WIN' | 'LOSS',
    traderName?: string
  ): { delta: number; newBalance: number } {
    if (tradeAmount <= 0) {
      return { delta: 0, newBalance: this.data.commissionBalance };
    }

    const amount = Number(tradeAmount.toFixed(2));
    const commissionRatio = 0.20; // 20%
    const rate = Number((amount * commissionRatio).toFixed(2));

    const targetTraderName = traderName || (this.data.referredUsers.length > 0 ? this.data.referredUsers[0].name : 'referred_trader');

    // Make sure trader exists in network
    let userIndex = this.data.referredUsers.findIndex(u => u.name.toLowerCase() === targetTraderName.toLowerCase());
    if (userIndex === -1 && this.data.referredUsers.length === 0) {
      // Auto register first accurate trader if simulating or settling
      const newUser = this.registerReferredTrader(targetTraderName, amount);
      userIndex = 0;
    }

    let delta = 0;
    let newBal = this.data.commissionBalance;
    let newTot = this.data.totalEarned;

    if (result === 'LOSS') {
      // Trader LOSS: 20% added to commission balance
      delta = rate;
      newBal = Number((this.data.commissionBalance + rate).toFixed(2));
      newTot = Number((this.data.totalEarned + rate).toFixed(2));

      const log: CommissionLog = {
        id: `log-loss-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        type: 'TRADE_LOSS_COMMISSION',
        amount: rate,
        description: `+$${rate.toFixed(2)} commission (20% of $${amount.toFixed(2)} trade loss by ${targetTraderName})`,
        traderName: targetTraderName,
      };

      this.data.commissionLogs = [log, ...this.data.commissionLogs];
    } else {
      // Trader WIN: 20% reduced from referral balance automatically (cannot be below $0)
      delta = -rate;
      newBal = Math.max(0, Number((this.data.commissionBalance - rate).toFixed(2)));

      const log: CommissionLog = {
        id: `log-win-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        type: 'TRADE_WIN_DEDUCTION',
        amount: -rate,
        description: `-$${rate.toFixed(2)} offset (20% reduced due to $${amount.toFixed(2)} trade win by ${targetTraderName})`,
        traderName: targetTraderName,
      };

      this.data.commissionLogs = [log, ...this.data.commissionLogs];
    }

    // Update referred user stats accurately
    if (userIndex !== -1 && this.data.referredUsers[userIndex]) {
      const u = this.data.referredUsers[userIndex];
      const updatedUser: ReferredUser = {
        ...u,
        totalTrades: u.totalTrades + 1,
        totalVolume: Number((u.totalVolume + amount).toFixed(2)),
        commissionGenerated: Number((u.commissionGenerated + delta).toFixed(2)),
        lastActivity: 'Just now',
        status: 'Active',
      };
      this.data.referredUsers = this.data.referredUsers.map((usr, i) => (i === userIndex ? updatedUser : usr));
    }

    this.data.commissionBalance = newBal;
    this.data.totalEarned = newTot;

    this.notify();

    return { delta, newBalance: newBal };
  }

  // Convert Commission to Live Balance (Min $50.00)
  public convertToLive(): { success: boolean; amount: number; message: string } {
    const MIN_CONVERT = 50.0;
    if (this.data.commissionBalance < MIN_CONVERT) {
      return {
        success: false,
        amount: 0,
        message: `Minimum transfer amount is $${MIN_CONVERT.toFixed(2)}. Current balance: $${this.data.commissionBalance.toFixed(2)}.`,
      };
    }

    const transferAmount = this.data.commissionBalance;
    const newConv = Number((this.data.convertedTotal + transferAmount).toFixed(2));

    const log: CommissionLog = {
      id: `log-conv-${Date.now()}`,
      timestamp: Date.now(),
      type: 'CONVERT_TO_LIVE',
      amount: -transferAmount,
      description: `Transferred $${transferAmount.toFixed(2)} to Live Real Balance`,
    };

    this.data.commissionBalance = 0.0;
    this.data.convertedTotal = newConv;
    this.data.commissionLogs = [log, ...this.data.commissionLogs];

    this.notify();

    return {
      success: true,
      amount: transferAmount,
      message: `Successfully transferred $${transferAmount.toFixed(2)} to Live Trading Balance!`,
    };
  }

  // Clear or reset test referral network (keeps balance & sponsor)
  public clearReferredNetwork() {
    this.data.referredUsers = [];
    this.notify();
  }
}

export const referralService = new ReferralService();
