// Influencer Promotion Program Service
// Handles influencer accounts, commission logic (20% per deposit),
// trader promo bonuses (30%, 40%, 60%), credential card generation, and withdrawals.

export interface InfluencerProfile {
  id: string; // e.g. INF-4821
  userId: string; // short memorable e.g. INF-4821
  password: string; // short memorable e.g. CB7829
  promoCode: string; // e.g. WIN99, VIP77
  name: string;
  email: string;
  country: string;
  binanceId: string;
  availableBalance: number; // 20% earnings available for withdrawal
  totalEarned: number;
  totalWithdrawn: number;
  totalVolumeGenerated: number;
  referralCount: number;
  createdAt: number;
}

export interface InfluencerDepositLog {
  id: string;
  influencerId: string;
  promoCode: string;
  depositId: string;
  traderName: string;
  traderEmail?: string;
  depositAmount: number;
  bonusPercent: number;
  bonusAmount: number;
  influencerCommission: number; // 20% of depositAmount
  timestamp: number;
  status: 'COMPLETED' | 'PENDING';
}

export interface InfluencerWithdrawalRequest {
  id: string;
  influencerId: string;
  influencerName: string;
  userId: string;
  binanceId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  processedAt?: number;
  rejectedReason?: string;
}

const STORAGE_KEY_INFLUENCERS = 'cb_influencer_profiles_v1';
const STORAGE_KEY_DEPOSITS = 'cb_influencer_deposit_logs_v1';
const STORAGE_KEY_WITHDRAWALS = 'cb_influencer_withdrawals_v1';
const STORAGE_KEY_CURRENT_SESSION = 'cb_influencer_session_v1';
const STORAGE_KEY_ACTIVE_PROMO_BONUS = 'cb_user_active_promo_bonus';

// Generate short, memorable codes
export function generateShortUserId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `INF-${num}`;
}

export function generateShortPassword(): string {
  const letters = ['CB', 'VIP', 'PRO', 'WIN'];
  const prefix = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
}

export function generateShortPromoCode(name: string): string {
  const clean = name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4) || 'VIP';
  const num = Math.floor(10 + Math.random() * 90);
  return `${clean}${num}`;
}

// Tier Bonus Calculator:
// Minimum deposit: $30
// $30 - $49: 30%
// $50 - $69: 40%
// $70 - $100+: 60%
export function calculateDepositBonus(amount: number) {
  if (amount < 30) {
    return {
      eligible: false,
      bonusPercent: 0,
      bonusAmount: 0,
      totalWithBonus: amount,
      influencerCommission: amount * 0.20,
      minRequired: 30,
      message: 'Minimum deposit with promo code is $30.00 USD to unlock deposit bonus.',
    };
  }

  let bonusPercent = 30;
  if (amount >= 70) {
    bonusPercent = 60;
  } else if (amount >= 50) {
    bonusPercent = 40;
  }

  const bonusAmount = parseFloat((amount * (bonusPercent / 100)).toFixed(2));
  const totalWithBonus = parseFloat((amount + bonusAmount).toFixed(2));
  const influencerCommission = parseFloat((amount * 0.20).toFixed(2)); // Always 20% to influencer

  return {
    eligible: true,
    bonusPercent,
    bonusAmount,
    totalWithBonus,
    influencerCommission,
    minRequired: 30,
    message: `+${bonusPercent}% Promotional Trading Bonus unlocked! (+$${bonusAmount.toFixed(2)} USD bonus)`,
  };
}

class InfluencerService {
  private influencers: InfluencerProfile[] = [];
  private depositLogs: InfluencerDepositLog[] = [];
  private withdrawalRequests: InfluencerWithdrawalRequest[] = [];
  private currentSession: InfluencerProfile | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedInf = localStorage.getItem(STORAGE_KEY_INFLUENCERS);
      if (savedInf) {
        this.influencers = JSON.parse(savedInf);
      } else {
        // Seed default verified top influencer for demonstration
        this.influencers = [
          {
            id: 'INF-2048',
            userId: 'INF-2048',
            password: 'VIP7782',
            promoCode: 'WIN99',
            name: 'Tanvir Hossain',
            email: 'tanvir.crypto@gmail.com',
            country: '🇧🇩 Bangladesh',
            binanceId: '794380283',
            availableBalance: 40.00,
            totalEarned: 40.00,
            totalWithdrawn: 0.00,
            totalVolumeGenerated: 200.00,
            referralCount: 2,
            createdAt: Date.now() - 86400000 * 5,
          },
        ];
        this.saveInfluencers();
      }

      const savedDep = localStorage.getItem(STORAGE_KEY_DEPOSITS);
      if (savedDep) {
        this.depositLogs = JSON.parse(savedDep);
      } else {
        this.depositLogs = [
          {
            id: 'IDEP-101',
            influencerId: 'INF-2048',
            promoCode: 'WIN99',
            depositId: 'DEP-849102',
            traderName: 'Kazi Shakil',
            traderEmail: 'shakil@gmail.com',
            depositAmount: 100.00,
            bonusPercent: 60,
            bonusAmount: 60.00,
            influencerCommission: 20.00,
            timestamp: Date.now() - 86400000 * 2,
            status: 'COMPLETED',
          },
          {
            id: 'IDEP-102',
            influencerId: 'INF-2048',
            promoCode: 'WIN99',
            depositId: 'DEP-849103',
            traderName: 'Ahmad Rafiq',
            traderEmail: 'rafiq@gmail.com',
            depositAmount: 100.00,
            bonusPercent: 60,
            bonusAmount: 60.00,
            influencerCommission: 20.00,
            timestamp: Date.now() - 86400000,
            status: 'COMPLETED',
          },
        ];
        this.saveDepositLogs();
      }

      const savedWth = localStorage.getItem(STORAGE_KEY_WITHDRAWALS);
      if (savedWth) {
        this.withdrawalRequests = JSON.parse(savedWth);
      }

      const savedSession = localStorage.getItem(STORAGE_KEY_CURRENT_SESSION);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const match = this.influencers.find((i) => i.id === parsed.id);
        this.currentSession = match || null;
      }
    } catch {
      // Fallback safe
    }
  }

  private saveInfluencers() {
    localStorage.setItem(STORAGE_KEY_INFLUENCERS, JSON.stringify(this.influencers));
    this.notify();
  }

  private saveDepositLogs() {
    localStorage.setItem(STORAGE_KEY_DEPOSITS, JSON.stringify(this.depositLogs));
    this.notify();
  }

  private saveWithdrawals() {
    localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(this.withdrawalRequests));
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // Get current active session
  public getCurrentSession(): InfluencerProfile | null {
    if (!this.currentSession) return null;
    return this.influencers.find((i) => i.id === this.currentSession?.id) || this.currentSession;
  }

  // Get all influencers (for admin & lookups)
  public getAllInfluencers(): InfluencerProfile[] {
    return [...this.influencers];
  }

  // Validate promo code
  public findInfluencerByPromoCode(code: string): InfluencerProfile | null {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    return this.influencers.find((i) => i.promoCode.toUpperCase() === clean) || null;
  }

  // Register a new influencer
  public registerInfluencer(params: {
    name: string;
    country: string;
    email: string;
    binanceId: string;
    customPromoCode?: string;
  }): { success: boolean; influencer?: InfluencerProfile; message: string } {
    const { name, country, email, binanceId, customPromoCode } = params;
    if (!name.trim() || !email.trim() || !binanceId.trim()) {
      return { success: false, message: 'Please provide full Name, Email, and Binance Pay ID.' };
    }

    // Check email uniqueness
    const emailLower = email.trim().toLowerCase();
    const existing = this.influencers.find((i) => i.email.toLowerCase() === emailLower);
    if (existing) {
      return {
        success: false,
        message: 'An influencer profile with this email already exists. Please sign in.',
      };
    }

    const userId = generateShortUserId();
    const password = generateShortPassword();
    
    // Prepare preferred promo code or generate base
    let basePromo = '';
    if (customPromoCode && typeof customPromoCode === 'string') {
      basePromo = customPromoCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase().trim();
    }
    if (!basePromo) {
      basePromo = generateShortPromoCode(name).toUpperCase().trim();
    }

    // Guarantee unique promo code: If duplicate exists, append numbers
    let promoCode = basePromo;
    let suffix = 2;
    while (this.influencers.some((i) => i.promoCode.toUpperCase() === promoCode.toUpperCase())) {
      promoCode = `${basePromo}${suffix++}`;
    }

    const newProfile: InfluencerProfile = {
      id: userId,
      userId,
      password,
      promoCode,
      name: name.trim(),
      email: emailLower,
      country: country || 'International',
      binanceId: binanceId.trim(),
      availableBalance: 0.00,
      totalEarned: 0.00,
      totalWithdrawn: 0.00,
      totalVolumeGenerated: 0.00,
      referralCount: 0,
      createdAt: Date.now(),
    };

    this.influencers.unshift(newProfile);
    this.currentSession = newProfile;
    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(newProfile));
    this.saveInfluencers();

    // Async sync with server
    try {
      fetch('/api/influencer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProfile.name,
          email: newProfile.email,
          country: newProfile.country,
          binanceId: newProfile.binanceId,
          customPromoCode: newProfile.promoCode,
        }),
      }).catch(() => {});
    } catch {}

    return {
      success: true,
      influencer: newProfile,
      message: 'Influencer profile created successfully!',
    };
  }

  // Login influencer with User ID and Password
  public loginInfluencer(userId: string, password: string): { success: boolean; influencer?: InfluencerProfile; message: string } {
    const cleanUserId = userId.trim().toUpperCase();
    const cleanPass = password.trim();

    const influencer = this.influencers.find(
      (i) => i.userId.toUpperCase() === cleanUserId && i.password === cleanPass
    );

    if (!influencer) {
      return { success: false, message: 'Invalid User ID or Password. Please verify credentials.' };
    }

    this.currentSession = influencer;
    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(influencer));
    this.notify();

    return { success: true, influencer, message: 'Welcome back to Influencer Portal!' };
  }

  public logoutInfluencer() {
    this.currentSession = null;
    localStorage.removeItem(STORAGE_KEY_CURRENT_SESSION);
    this.notify();
  }

  // Update Binance Pay ID
  public updateBinanceId(influencerId: string, newBinanceId: string): { success: boolean; message: string } {
    const inf = this.influencers.find((i) => i.id === influencerId);
    if (!inf) return { success: false, message: 'Influencer not found.' };

    if (!newBinanceId.trim()) {
      return { success: false, message: 'Binance Pay ID cannot be empty.' };
    }

    inf.binanceId = newBinanceId.trim();
    if (this.currentSession && this.currentSession.id === influencerId) {
      this.currentSession.binanceId = inf.binanceId;
      localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(this.currentSession));
    }

    this.saveInfluencers();
    return { success: true, message: 'Binance Pay ID updated successfully!' };
  }

  // Get active promo offers list for public traders to see and activate
  public getActivePromoOffers(): Array<{
    code: string;
    name: string;
    badge: string;
    bonusTiers: string;
    description: string;
  }> {
    const result: Array<{
      code: string;
      name: string;
      badge: string;
      bonusTiers: string;
      description: string;
    }> = [];

    // Verified official influencer code WIN99
    result.push({
      code: 'WIN99',
      name: 'Tanvir Hossain (CryptoBari Verified Partner)',
      badge: 'Official Verified',
      bonusTiers: '30% ($30+) • 40% ($50+) • 60% ($70+)',
      description: 'Get up to +60% trading bonus on deposits $30 and above. 20% influencer commission supported.',
    });

    // Add other registered influencers
    for (const inf of this.influencers) {
      if (inf.promoCode && inf.promoCode.toUpperCase() !== 'WIN99' && !result.some((r) => r.code === inf.promoCode.toUpperCase())) {
        result.push({
          code: inf.promoCode.toUpperCase(),
          name: `${inf.name} (${inf.country})`,
          badge: 'Partner Code',
          bonusTiers: '30% ($30+) • 40% ($50+) • 60% ($70+)',
          description: `Active partner offer from ${inf.name}. Unlock up to +60% bonus credits!`,
        });
      }
    }

    return result;
  }

  // Validate and activate promo code with real-time feedback
  public validatePromoCode(code: string): {
    valid: boolean;
    code: string;
    influencer?: InfluencerProfile;
    message: string;
  } {
    if (!code || !code.trim()) {
      return { valid: false, code: '', message: 'Please enter a promotion code.' };
    }
    const clean = code.trim().toUpperCase();
    const influencer = this.findInfluencerByPromoCode(clean);
    if (influencer) {
      return {
        valid: true,
        code: influencer.promoCode,
        influencer,
        message: `Promo Offer ${influencer.promoCode} active! Partner: ${influencer.name}`,
      };
    }
    // Allow official promotional codes
    if (clean === 'BONUS60' || clean === 'CRYPTOBARI' || clean === 'VIP2026') {
      return {
        valid: true,
        code: clean,
        message: `Official Promotional Offer ${clean} active! Up to +60% Bonus enabled.`,
      };
    }

    return {
      valid: false,
      code: clean,
      message: `Invalid or unverified promo code "${clean}". Please select an active partner code below.`,
    };
  }

  // Record deposit made with promo code:
  // Automatically adds 20% to the influencer's balance!
  public processDepositWithPromo(params: {
    depositId: string;
    traderName: string;
    traderEmail?: string;
    depositAmount: number;
    promoCode: string;
  }): { success: boolean; bonusAmount: number; totalCredited: number } {
    const { depositId, traderName, traderEmail, depositAmount, promoCode } = params;
    const influencer = this.findInfluencerByPromoCode(promoCode);

    const bonusInfo = calculateDepositBonus(depositAmount);
    const bonusAmount = bonusInfo.bonusAmount;
    const totalCredited = depositAmount + bonusAmount;

    if (influencer) {
      const commission = bonusInfo.influencerCommission; // 20% of depositAmount
      influencer.availableBalance = parseFloat((influencer.availableBalance + commission).toFixed(2));
      influencer.totalEarned = parseFloat((influencer.totalEarned + commission).toFixed(2));
      influencer.totalVolumeGenerated = parseFloat((influencer.totalVolumeGenerated + depositAmount).toFixed(2));
      influencer.referralCount += 1;

      const log: InfluencerDepositLog = {
        id: 'IDEP-' + Math.floor(100000 + Math.random() * 900000),
        influencerId: influencer.id,
        promoCode: influencer.promoCode,
        depositId,
        traderName,
        traderEmail,
        depositAmount,
        bonusPercent: bonusInfo.bonusPercent,
        bonusAmount,
        influencerCommission: commission,
        timestamp: Date.now(),
        status: 'COMPLETED',
      };

      this.depositLogs.unshift(log);
      this.saveInfluencers();
      this.saveDepositLogs();
    }

    // Save trader's active promotional bonus in client storage
    if (bonusAmount > 0) {
      const currentBonus = this.getActivePromoBonus();
      const updatedBonus = currentBonus + bonusAmount;
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROMO_BONUS, updatedBonus.toString());
    }

    return { success: true, bonusAmount, totalCredited };
  }

  // Get active promo bonus for trader
  public getActivePromoBonus(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_PROMO_BONUS);
      return raw ? Math.max(0, parseFloat(raw)) : 0;
    } catch {
      return 0;
    }
  }

  // Clear/forfeit promo bonus on withdrawal
  public forfeitPromoBonus(): number {
    const current = this.getActivePromoBonus();
    localStorage.setItem(STORAGE_KEY_ACTIVE_PROMO_BONUS, '0');
    return current;
  }

  // Influencer Requests Withdrawal
  public requestInfluencerWithdrawal(params: {
    influencerId: string;
    amount: number;
    binanceId: string;
  }): { success: boolean; message: string; withdrawal?: InfluencerWithdrawalRequest } {
    const { influencerId, amount, binanceId } = params;
    const influencer = this.influencers.find((i) => i.id === influencerId);

    if (!influencer) {
      return { success: false, message: 'Influencer profile not found.' };
    }
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Please enter a valid withdrawal amount.' };
    }
    // Influencer balance must be at least $60 before requesting withdrawal
    if (influencer.availableBalance < 60) {
      return {
        success: false,
        message: `Your balance must reach at least $60.00 USD before you can request a withdrawal. Your current balance is $${influencer.availableBalance.toFixed(2)} USD.`,
      };
    }
    if (amount < 60) {
      return { success: false, message: 'Minimum withdrawal amount is $60.00 USD.' };
    }
    if (amount > influencer.availableBalance) {
      return {
        success: false,
        message: `Insufficient balance! Available balance is $${influencer.availableBalance.toFixed(2)} USD.`,
      };
    }
    if (!binanceId.trim()) {
      return { success: false, message: 'Binance Pay ID is required.' };
    }

    // Deduct immediately from influencer balance
    influencer.availableBalance = parseFloat((influencer.availableBalance - amount).toFixed(2));
    influencer.totalWithdrawn = parseFloat((influencer.totalWithdrawn + amount).toFixed(2));

    const newWithdrawal: InfluencerWithdrawalRequest = {
      id: 'IWTH-' + Math.floor(10000 + Math.random() * 90000),
      influencerId,
      influencerName: influencer.name,
      userId: influencer.userId,
      binanceId: binanceId.trim(),
      amount,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    this.withdrawalRequests.unshift(newWithdrawal);
    this.saveInfluencers();
    this.saveWithdrawals();

    // Async sync with server
    try {
      fetch('/api/influencer/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          influencerId,
          amount,
          binanceId: binanceId.trim(),
        }),
      }).catch(() => {});
    } catch {}

    return {
      success: true,
      message: `Withdrawal request for $${amount.toFixed(2)} USD submitted to Admin!`,
      withdrawal: newWithdrawal,
    };
  }

  // Admin approves influencer withdrawal
  public adminApproveWithdrawal(id: string): { success: boolean; message: string } {
    const w = this.withdrawalRequests.find((item) => item.id === id);
    if (!w) return { success: false, message: 'Withdrawal request not found.' };
    if (w.status === 'APPROVED') return { success: false, message: 'Already approved.' };

    w.status = 'APPROVED';
    w.processedAt = Date.now();
    this.saveWithdrawals();
    return { success: true, message: `Influencer withdrawal of $${w.amount.toFixed(2)} marked as Paid.` };
  }

  // Admin rejects influencer withdrawal -> refunds balance
  public adminRejectWithdrawal(id: string, reason?: string): { success: boolean; message: string } {
    const w = this.withdrawalRequests.find((item) => item.id === id);
    if (!w) return { success: false, message: 'Withdrawal request not found.' };
    if (w.status !== 'PENDING') return { success: false, message: 'Request is already processed.' };

    w.status = 'REJECTED';
    w.processedAt = Date.now();
    w.rejectedReason = reason || 'Binance Pay ID invalid or compliance review.';

    // Refund to influencer balance
    const inf = this.influencers.find((i) => i.id === w.influencerId);
    if (inf) {
      inf.availableBalance = parseFloat((inf.availableBalance + w.amount).toFixed(2));
      inf.totalWithdrawn = Math.max(0, parseFloat((inf.totalWithdrawn - w.amount).toFixed(2)));
      this.saveInfluencers();
    }

    this.saveWithdrawals();
    return { success: true, message: `Withdrawal rejected and refunded $${w.amount.toFixed(2)} to influencer.` };
  }

  // Get deposit history for an influencer
  public getDepositLogsForInfluencer(influencerId: string): InfluencerDepositLog[] {
    return this.depositLogs.filter((d) => d.influencerId === influencerId);
  }

  // Get withdrawal history for an influencer
  public getWithdrawalsForInfluencer(influencerId: string): InfluencerWithdrawalRequest[] {
    return this.withdrawalRequests.filter((w) => w.influencerId === influencerId);
  }

  // Get all deposit logs (for admin)
  public getAllDepositLogs(): InfluencerDepositLog[] {
    return [...this.depositLogs];
  }

  // Get all withdrawal requests (for admin)
  public getAllWithdrawalRequests(): InfluencerWithdrawalRequest[] {
    return [...this.withdrawalRequests];
  }

  // Alias for getAllWithdrawalRequests
  public getAllWithdrawals(): InfluencerWithdrawalRequest[] {
    return [...this.withdrawalRequests];
  }

  // Update Binance Pay ID for an influencer
  public updateInfluencerBinanceId(influencerId: string, binanceId: string): boolean {
    const inf = this.influencers.find((i) => i.id === influencerId);
    if (!inf) return false;
    inf.binanceId = binanceId.trim();
    this.saveInfluencers();
    return true;
  }
}

export const influencerService = new InfluencerService();

// Canvas generator for downloadable Credential Pass Card (.jpg / .png)
export function generateInfluencerCardImage(influencer: InfluencerProfile): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Dark Futuristic Background
  const grad = ctx.createLinearGradient(0, 0, 1000, 600);
  grad.addColorStop(0, '#090d16');
  grad.addColorStop(0.5, '#0f172a');
  grad.addColorStop(1, '#050811');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1000, 600);

  // 2. Ambient Gold & Emerald Prismatic Glows
  const goldGlow = ctx.createRadialGradient(850, 100, 10, 850, 100, 300);
  goldGlow.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
  goldGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = goldGlow;
  ctx.fillRect(0, 0, 1000, 600);

  const emeraldGlow = ctx.createRadialGradient(150, 500, 10, 150, 500, 300);
  emeraldGlow.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
  emeraldGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = emeraldGlow;
  ctx.fillRect(0, 0, 1000, 600);

  // 3. Card Border with Double Stroke
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#f59e0b';
  ctx.strokeRect(30, 30, 940, 540);

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(38, 38, 924, 524);

  // 4. Header Badge: Official CryptoBari Influencer Program
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 24px "Chivo Mono", monospace';
  ctx.fillText('CRYPTOBARI • OFFICIAL INFLUENCER PARTNER', 70, 85);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('● 20% LIFETIME DEPOSIT COMMISSION ACTIVE', 70, 115);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.moveTo(70, 135);
  ctx.lineTo(930, 135);
  ctx.stroke();

  // 5. Influencer Full Name & Country
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(influencer.name, 70, 185);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '18px sans-serif';
  ctx.fillText(`Region: ${influencer.country}  •  Email: ${influencer.email}`, 70, 215);

  // 6. Big Promo Code Box (Prominently displayed)
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.fillRect(70, 245, 400, 120);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
  ctx.strokeRect(70, 245, 400, 120);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 16px "Chivo Mono", monospace';
  ctx.fillText('YOUR PROMOTION CODE:', 90, 278);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Chivo Mono", monospace';
  ctx.fillText(influencer.promoCode, 90, 335);

  // 7. Security Credentials Box (User ID + Password)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(510, 245, 420, 120);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.strokeRect(510, 245, 420, 120);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px "Chivo Mono", monospace';
  ctx.fillText('PORTAL ACCESS CREDENTIALS', 530, 278);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px monospace';
  ctx.fillText('User ID:   ', 530, 310);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(influencer.userId, 630, 310);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px monospace';
  ctx.fillText('Password:  ', 530, 342);
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(influencer.password, 630, 342);

  // 8. Payout & Binance Pay UID Details
  ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
  ctx.fillRect(70, 390, 860, 80);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
  ctx.strokeRect(70, 390, 860, 80);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('PAYOUT DETAILS:', 90, 422);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`Binance Pay ID: ${influencer.binanceId}`, 90, 452);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Commission: 20% Instant Net on All Deposits', 520, 452);

  // 9. Footer Security Watermark
  ctx.fillStyle = '#64748b';
  ctx.font = '14px monospace';
  const issueDate = new Date(influencer.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  ctx.fillText(`ISSUED: ${issueDate}  •  PORTAL: cryptobari.com  •  KEEP CREDENTIALS CONFIDENTIAL`, 70, 520);

  return canvas.toDataURL('image/jpeg', 0.95);
}
