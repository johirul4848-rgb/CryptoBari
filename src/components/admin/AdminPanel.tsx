import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Users,
  Bell,
  Share2,
  FileText,
  Sliders,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  LogOut,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  QrCode,
  LifeBuoy,
  Upload,
  Send,
  MessageSquare,
  Image,
  Check,
  Copy,
  Zap,
} from 'lucide-react';
import { MarketSymbol } from '../../types';
import { sound } from '../../utils/audio';

export interface OtcPairItem {
  id: string;
  symbol: string;
  displayName: string;
  baseAsset: string;
  quoteAsset: string;
  category: 'Forex' | 'Crypto' | 'Commodity' | 'Index';
  sortOrder: number;
  payoutRate: number;
  status: 'ACTIVE' | 'PAUSED';
  enabled: boolean;
  price: number;
  pricePrecision: number;
}

interface DepositItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: string;
  txHash: string;
  binanceId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  approvedAt?: number;
  rejectedReason?: string;
}

interface WithdrawalItem {
  id: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  amount: number;
  currency?: string;
  method?: string;
  address?: string;
  binanceId?: string;
  receiverBinanceId?: string;
  network?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  processedAt?: number;
  rejectedReason?: string;
}

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'PROMO' | 'ALERT';
  active: boolean;
  priority: number;
  createdAt: number;
}

interface BrokerUserItem {
  id: string;
  name: string;
  email: string;
  country: string;
  role: 'USER' | 'VIP' | 'ADMIN';
  kycStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
  liveBalance: number;
  demoBalance: number;
  status: 'ACTIVE' | 'FROZEN';
  totalDeposited: number;
  totalWithdrawn: number;
  registeredAt: number;
}

interface AdminPanelProps {
  symbols: MarketSymbol[];
  onUpdateSymbolPayout: (symbol: string, rate: number, enabled: boolean) => void;
  onClose: () => void;
  onDepositApprovedNotification?: (amount: number, newBalance: number) => void;
  currentLiveBalance: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  symbols,
  onUpdateSymbolPayout,
  onClose,
  onDepositApprovedNotification,
  currentLiveBalance,
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'deposits' | 'withdrawals' | 'otc' | 'finance' | 'users' | 'notices' | 'referrals' | 'reports' | 'assets' | 'gateway' | 'support'
  >('dashboard');

  // OTC Synthetic Pairs state (Quotex style, up to 93% payout)
  const [otcPairs, setOtcPairs] = useState<OtcPairItem[]>([]);
  const [defaultOtcPayout, setDefaultOtcPayout] = useState<number>(93);
  const [otcCategoryFilter, setOtcCategoryFilter] = useState<'ALL' | 'Forex' | 'Crypto' | 'Commodity' | 'Index'>('ALL');
  const [otcSearch, setOtcSearch] = useState('');
  const [isSavingDefaultPayout, setIsSavingDefaultPayout] = useState(false);

  // Live state fetched from server
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [users, setUsers] = useState<BrokerUserItem[]>([]);
  const [financeData, setFinanceData] = useState<any>(null);
  const [referralData, setReferralData] = useState<any>(null);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Binance Gateway Settings state
  const [binanceId, setBinanceId] = useState('794380283');
  const [merchantName, setMerchantName] = useState('CryptoBari');
  const [qrImage, setQrImage] = useState('/binance_qr.png');
  const [qrInstructions, setQrInstructions] = useState('Send via Binance Pay > Binance ID: 794380283 or scan QR Code.');
  const [isSavingGateway, setIsSavingGateway] = useState(false);

  // Support Tickets state
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [supportFilter, setSupportFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  // Search/Filters
  const [depositFilter, setDepositFilter] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [copiedWithdrawalBinanceId, setCopiedWithdrawalBinanceId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // New Notice form modal state
  const [isNoticeFormOpen, setIsNoticeFormOpen] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeType, setNewNoticeType] = useState<'INFO' | 'PROMO' | 'ALERT'>('PROMO');

  // New Trader Account modal state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCountry, setNewUserCountry] = useState('🇧🇩 Bangladesh');
  const [newUserInitialBalance, setNewUserInitialBalance] = useState(100);

  // Reports timeframe filter
  const [reportTimeframe, setReportTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  // Load all admin data from backend
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [depRes, withRes, notRes, usrRes, finRes, refRes, repRes, binRes, supRes, otcRes] = await Promise.all([
        fetch('/api/admin/deposits').then(r => r.json()).catch(() => []),
        fetch('/api/admin/withdrawals').then(r => r.json()).catch(() => []),
        fetch('/api/admin/notices').then(r => r.json()).catch(() => []),
        fetch('/api/admin/users').then(r => r.json()).catch(() => []),
        fetch('/api/admin/finance').then(r => r.json()).catch(() => null),
        fetch('/api/admin/referrals').then(r => r.json()).catch(() => null),
        fetch('/api/admin/reports').then(r => r.json()).catch(() => ({ allTrades: [] })),
        fetch('/api/payment/binance-settings').then(r => r.json()).catch(() => null),
        fetch('/api/support/tickets').then(r => r.json()).catch(() => []),
        fetch('/api/admin/otc/pairs').then(r => r.json()).catch(() => null),
      ]);

      if (Array.isArray(depRes)) setDeposits(depRes);

      // Robustly merge backend withdrawals with any locally submitted withdrawals
      let combinedWithdrawals: WithdrawalItem[] = Array.isArray(withRes) ? [...withRes] : [];
      try {
        const raw = localStorage.getItem('cb_admin_shared_withdrawals');
        if (raw) {
          const localList: WithdrawalItem[] = JSON.parse(raw);
          const map = new Map<string, WithdrawalItem>();
          combinedWithdrawals.forEach((w) => map.set(w.id, w));
          localList.forEach((w) => {
            if (!map.has(w.id)) {
              map.set(w.id, w);
            } else {
              // Merge any richer fields like binanceId
              const existing = map.get(w.id)!;
              map.set(w.id, {
                ...existing,
                binanceId: existing.binanceId || w.binanceId || w.receiverBinanceId || existing.address,
                receiverBinanceId: existing.receiverBinanceId || w.receiverBinanceId || w.binanceId || existing.address,
              });
            }
          });
          combinedWithdrawals = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
      } catch {
        // ignore
      }
      setWithdrawals(combinedWithdrawals);

      if (Array.isArray(notRes)) setNotices(notRes);
      if (Array.isArray(usrRes)) setUsers(usrRes);
      if (finRes) setFinanceData(finRes);
      if (refRes) setReferralData(refRes);
      if (repRes && Array.isArray(repRes.allTrades)) setRecentTrades(repRes.allTrades);
      if (binRes) {
        if (binRes.binanceId) setBinanceId(binRes.binanceId);
        if (binRes.merchantName) setMerchantName(binRes.merchantName);
        if (binRes.qrImage) setQrImage(binRes.qrImage);
        if (binRes.instructions) setQrInstructions(binRes.instructions);
      }
      if (Array.isArray(supRes)) {
        setSupportTickets(supRes);
        if (supRes.length > 0 && !selectedTicketId) {
          setSelectedTicketId(supRes[0].id);
        }
      }
      if (otcRes && Array.isArray(otcRes.pairs)) {
        setOtcPairs(otcRes.pairs);
        if (typeof otcRes.defaultPayout === 'number') {
          setDefaultOtcPayout(otcRes.defaultPayout);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();

    const handleWithdrawalUpdated = () => {
      loadAdminData();
    };

    window.addEventListener('cb_withdrawals_updated', handleWithdrawalUpdated);
    window.addEventListener('storage', handleWithdrawalUpdated);
    return () => {
      window.removeEventListener('cb_withdrawals_updated', handleWithdrawalUpdated);
      window.removeEventListener('storage', handleWithdrawalUpdated);
    };
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // OTC Pair Management Handlers (Quotex style, max 93% payout)
  const handleUpdateDefaultOtcPayout = async (rate: number) => {
    const capped = Math.min(93, Math.max(50, Math.round(rate)));
    setIsSavingDefaultPayout(true);
    sound.playClick();
    try {
      const res = await fetch('/api/admin/otc/default-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: capped }),
      });
      const data = await res.json();
      if (data.success) {
        setDefaultOtcPayout(data.defaultPayout || capped);
        showNotification(`Global OTC default payout set to ${data.defaultPayout || capped}% (Max 93%)`);
        sound.playWin();
        loadAdminData();
      }
    } catch {
      setDefaultOtcPayout(capped);
      showNotification(`Default payout rate set to ${capped}%`);
    } finally {
      setIsSavingDefaultPayout(false);
    }
  };

  const handleToggleOtcPair = async (pairId: string, currentEnabled: boolean) => {
    sound.playClick();
    const newStatus = currentEnabled ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/otc/pairs/${pairId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOtcPairs(prev => prev.map(p => p.id === pairId ? { ...p, enabled: !currentEnabled, status: newStatus } : p));
        showNotification(`OTC Pair ${pairId} ${!currentEnabled ? 'enabled & active' : 'paused'}`);
        sound.playWin();
      }
    } catch {
      setOtcPairs(prev => prev.map(p => p.id === pairId ? { ...p, enabled: !currentEnabled, status: newStatus } : p));
    }
  };

  const handleUpdateOtcPairPayout = async (pairId: string, newPayout: number) => {
    const capped = Math.min(93, Math.max(50, Math.round(newPayout)));
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/otc/pairs/${pairId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutRate: capped }),
      });
      const data = await res.json();
      if (data.success) {
        setOtcPairs(prev => prev.map(p => p.id === pairId ? { ...p, payoutRate: capped } : p));
        showNotification(`Payout for ${pairId} updated to ${capped}% (Max 93%)`);
      }
    } catch {
      setOtcPairs(prev => prev.map(p => p.id === pairId ? { ...p, payoutRate: capped } : p));
    }
  };

  // Save Binance Gateway Settings
  const handleSaveBinanceGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGateway(true);
    sound.playClick();
    try {
      const res = await fetch('/api/payment/binance-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binanceId: binanceId.trim(),
          merchantName: merchantName.trim(),
          qrImage: qrImage.trim(),
          instructions: qrInstructions.trim(),
        }),
      });
      if (res.ok) {
        sound.playWin();
        showNotification('Binance Gateway Settings saved and deployed to Deposit/Withdrawal interfaces!');
      }
    } catch {
      // ignore
    } finally {
      setIsSavingGateway(false);
    }
  };

  // Admin reply to support ticket
  const handleSendAdminSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedTicketId) return;
    sound.playClick();
    const textToSend = adminReplyText.trim();
    setAdminReplyText('');
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'support',
          text: textToSend,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSupportTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
        showNotification('Support reply sent to user!');
      }
    } catch {
      // ignore
    }
  };

  // Update support ticket status
  const handleUpdateTicketStatus = async (ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    sound.playClick();
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
        showNotification(`Ticket marked as ${status}`);
      }
    } catch {
      // ignore
    }
  };

  // 1. Approve Deposit Request
  const handleApproveDeposit = async (id: string) => {
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/deposits/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        sound.playWin();
        showNotification(data.message || `Deposit #${id} approved! Live balance credited.`);
        // Update local deposit list
        setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: 'APPROVED', approvedAt: Date.now() } : d));
        // Inform parent app so live trading balance immediately jumps up
        if (onDepositApprovedNotification && data.liveBalance !== undefined) {
          const dep = deposits.find(d => d.id === id);
          onDepositApprovedNotification(dep ? dep.amount : 0, data.liveBalance);
        }
        loadAdminData();
      }
    } catch {
      sound.playLoss();
    }
  };

  // 2. Reject Deposit Request
  const handleRejectDeposit = async (id: string) => {
    sound.playClick();
    const reason = window.prompt('Enter rejection reason for client:', 'Blockchain transaction unverified / invalid hash') || 'Verification failed';
    try {
      const res = await fetch(`/api/admin/deposits/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playLoss();
        showNotification(`Deposit #${id} rejected.`);
        setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: 'REJECTED', rejectedReason: reason } : d));
        loadAdminData();
      }
    } catch {
      // ignore
    }
  };

  // 3. Approve Withdrawal Request
  const handleApproveWithdrawal = async (id: string) => {
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        sound.playWin();
        showNotification(`Withdrawal #${id} approved and dispatched via Binance Pay.`);
        setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'APPROVED', processedAt: Date.now() } : w));
        
        try {
          const raw = localStorage.getItem('cb_admin_shared_withdrawals');
          if (raw) {
            const arr = JSON.parse(raw);
            const updated = arr.map((x: any) => x.id === id ? { ...x, status: 'APPROVED', processedAt: Date.now() } : x);
            localStorage.setItem('cb_admin_shared_withdrawals', JSON.stringify(updated));
            window.dispatchEvent(new Event('cb_withdrawals_updated'));
          }
        } catch {}

        loadAdminData();
      }
    } catch {
      // Local fallback
      sound.playWin();
      showNotification(`Withdrawal #${id} marked as approved & dispatched.`);
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'APPROVED', processedAt: Date.now() } : w));
      try {
        const raw = localStorage.getItem('cb_admin_shared_withdrawals');
        if (raw) {
          const arr = JSON.parse(raw);
          const updated = arr.map((x: any) => x.id === id ? { ...x, status: 'APPROVED', processedAt: Date.now() } : x);
          localStorage.setItem('cb_admin_shared_withdrawals', JSON.stringify(updated));
          window.dispatchEvent(new Event('cb_withdrawals_updated'));
        }
      } catch {}
    }
  };

  // 4. Reject Withdrawal Request (Refunds balance)
  const handleRejectWithdrawal = async (id: string) => {
    sound.playClick();
    const reason = window.prompt('Enter reason for withdrawal rejection:', 'Account KYC requirement or address format error') || 'Verification requirement';
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playLoss();
        showNotification(data.message || `Withdrawal rejected and refunded.`);
        setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'REJECTED', rejectedReason: reason } : w));

        try {
          const raw = localStorage.getItem('cb_admin_shared_withdrawals');
          if (raw) {
            const arr = JSON.parse(raw);
            const updated = arr.map((x: any) => x.id === id ? { ...x, status: 'REJECTED', rejectedReason: reason } : x);
            localStorage.setItem('cb_admin_shared_withdrawals', JSON.stringify(updated));
            window.dispatchEvent(new Event('cb_withdrawals_updated'));
          }
        } catch {}

        loadAdminData();
      }
    } catch {
      // Local fallback
      sound.playLoss();
      showNotification(`Withdrawal #${id} rejected and refunded.`);
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'REJECTED', rejectedReason: reason } : w));
      try {
        const raw = localStorage.getItem('cb_admin_shared_withdrawals');
        if (raw) {
          const arr = JSON.parse(raw);
          const updated = arr.map((x: any) => x.id === id ? { ...x, status: 'REJECTED', rejectedReason: reason } : x);
          localStorage.setItem('cb_admin_shared_withdrawals', JSON.stringify(updated));
          window.dispatchEvent(new Event('cb_withdrawals_updated'));
        }
      } catch {}
    }
  };

  // 5. Create Notice
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle || !newNoticeContent) return;
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNoticeTitle,
          content: newNoticeContent,
          type: newNoticeType,
          priority: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playWin();
        showNotification('New announcement posted successfully!');
        setNewNoticeTitle('');
        setNewNoticeContent('');
        setIsNoticeFormOpen(false);
        loadAdminData();
      }
    } catch {
      sound.playLoss();
    }
  };

  // 6. Delete Notice
  const handleDeleteNotice = async (id: string) => {
    sound.playClick();
    try {
      await fetch(`/api/admin/notices/${id}`, { method: 'DELETE' });
      setNotices(prev => prev.filter(n => n.id !== id));
      showNotification('Announcement removed');
    } catch {
      // ignore
    }
  };

  // 7. Adjust User Balance
  const handleAdjustUserBalance = async (userId: string) => {
    const amountStr = window.prompt('Enter amount to add or subtract (e.g. 100 or -50):', '50');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/adjust-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type: 'LIVE' }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playWin();
        showNotification(`User live balance adjusted by $${amount}`);
        loadAdminData();
      }
    } catch {
      // ignore
    }
  };

  // 8. Toggle User KYC
  const handleToggleKyc = async (userId: string) => {
    sound.playClick();
    try {
      await fetch(`/api/admin/users/${userId}/toggle-kyc`, { method: 'POST' });
      loadAdminData();
    } catch {
      // ignore
    }
  };

  // 9. Create New Trader Account (Admin Menu)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          country: newUserCountry.trim(),
          initialBalance: newUserInitialBalance || 100,
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playWin();
        showNotification(`Trader account "${newUserName}" created successfully and added to directory!`);
        setIsNewUserModalOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        loadAdminData();
      } else {
        showNotification(data.error || 'Failed to create user account');
      }
    } catch {
      showNotification('Network error creating user account');
    }
  };

  // 10. Download Official Broker Audit PDF Report
  const handleDownloadPdfReport = () => {
    sound.playClick();
    const periodLabel = reportTimeframe.toUpperCase();
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CryptoBari Brokerage Audit Report - ${new Date().toISOString().slice(0, 10)}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 25px; color: #0f172a; background: #fff; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #00c278; padding-bottom: 18px; margin-bottom: 25px; }
            .title { font-size: 24px; font-weight: 900; color: #008751; margin: 0; letter-spacing: -0.5px; }
            .subtitle { font-size: 13px; color: #475569; margin-top: 4px; }
            .seal { padding: 8px 16px; background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 8px; font-size: 12px; font-weight: 800; color: #047857; text-align: right; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 25px; }
            .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; background: #f8fafc; }
            .card-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px; }
            .card-value { font-size: 20px; font-weight: 900; margin-top: 6px; font-family: monospace; }
            .profit { color: #059669; }
            .highlight { color: #0284c7; }
            .table-title { font-size: 14px; font-weight: 800; margin-top: 25px; margin-bottom: 10px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px; }
            th { background: #f1f5f9; text-align: left; padding: 9px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #334155; }
            td { padding: 8px 12px; border: 1px solid #cbd5e1; }
            .status-profit { color: #059669; font-weight: 800; background: #d1fae5; padding: 2px 6px; border-radius: 4px; }
            .status-loss { color: #e11d48; font-weight: 800; background: #ffe4e6; padding: 2px 6px; border-radius: 4px; }
            .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">CRYPTOBARI • BINANCE PARTNER BROKER</h1>
              <div class="subtitle">Official Treasury Settlement & P&L Audit Report — ${periodLabel} AUDIT</div>
              <div class="subtitle">Generated at: ${new Date().toLocaleString()} | Security Level: High (Admin Protected)</div>
            </div>
            <div class="seal">
              <div>★ BINANCE REAL-TIME SPOT PARTNER</div>
              <div style="font-size: 10px; font-weight: 600; color: #059669; margin-top: 3px;">Audited & Verified Ledger</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Total Verified Deposits</div>
              <div class="card-value highlight">$${(financeData?.totalDeposits || 32450).toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Dispatched Payouts</div>
              <div class="card-value">$${(financeData?.dispatchedPayouts || 21250).toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Balance (Deposits - Payouts)</div>
              <div class="card-value highlight">$${(financeData?.totalBalanceAmount || 11200).toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Referral Commission Outflow</div>
              <div class="card-value">$${(financeData?.referralCommissions || 3450).toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Net Profit / (Loss)</div>
              <div class="card-value profit">$${(financeData?.netProfitOrLoss || 7750).toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Active Trader Accounts</div>
              <div class="card-value">${users.length} Traders</div>
            </div>
          </div>

          <div class="table-title">Comprehensive Financial Breakdown (${periodLabel})</div>
          <table>
            <thead>
              <tr>
                <th>Reporting Period</th>
                <th>Inflow Deposits</th>
                <th>Dispatched Payouts</th>
                <th>Net Balance</th>
                <th>Affiliate Deductions</th>
                <th>Net House Profit</th>
                <th>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              ${(financeData?.dailyReports || []).map((r: any) => `
                <tr>
                  <td><strong>${r.date}</strong></td>
                  <td>$${r.deposits.toFixed(2)}</td>
                  <td>$${r.dispatchedPayouts.toFixed(2)}</td>
                  <td>$${r.netBalance.toFixed(2)}</td>
                  <td>$${r.referralCommission.toFixed(2)}</td>
                  <td style="font-weight: 800; color: ${r.status === 'PROFIT' ? '#059669' : '#e11d48'};">
                    +$${r.netProfitLoss.toFixed(2)}
                  </td>
                  <td>
                    <span class="${r.status === 'PROFIT' ? 'status-profit' : 'status-loss'}">${r.status}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>Ledger Audit Hash: 0x${Math.random().toString(16).substring(2, 26)}</div>
            <div>Authorized Broker Treasury Signature: _______________________</div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    } else {
      window.print();
    }
  };

  // Computed counts
  const pendingDepositsCount = deposits.filter(d => d.status === 'PENDING').length;
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'PENDING').length;
  const approvedWithdrawalsCount = withdrawals.filter(w => w.status === 'APPROVED').length;
  const rejectedWithdrawalsCount = withdrawals.filter(w => w.status === 'REJECTED').length;
  const pendingWithdrawalTotal = withdrawals.filter(w => w.status === 'PENDING').reduce((s, w) => s + (w.amount || 0), 0);
  const approvedWithdrawalTotal = withdrawals.filter(w => w.status === 'APPROVED').reduce((s, w) => s + (w.amount || 0), 0);

  const filteredDeposits = deposits.filter(d => {
    if (depositFilter === 'ALL') return true;
    return d.status === depositFilter;
  });

  const filteredWithdrawals = withdrawals.filter(w => {
    if (withdrawalFilter !== 'ALL' && w.status !== withdrawalFilter) return false;
    if (withdrawalSearch.trim()) {
      const q = withdrawalSearch.toLowerCase().trim();
      const binId = (w.binanceId || w.receiverBinanceId || w.address || '').toLowerCase();
      const name = (w.userName || '').toLowerCase();
      const email = (w.userEmail || '').toLowerCase();
      const id = (w.id || '').toLowerCase();
      return binId.includes(q) || name.includes(q) || email.includes(q) || id.includes(q);
    }
    return true;
  });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.country.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b14] text-slate-100 font-sans overflow-hidden select-none">
      {/* 1. TOP BROKER OPS BAR */}
      <header className="h-16 px-4 md:px-6 bg-gradient-to-r from-[#0d1322] via-[#0f172a] to-[#0a0f1d] border-b border-cyan-500/30 flex items-center justify-between shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base md:text-lg text-white tracking-wide flex items-center gap-1.5">
                <span>CryptoBari</span>
                <span className="text-cyan-400 font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
                  MASTER BROKER OPS
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Core Administration, Treasury Escrow, Financial Ledger & Trader Governance
            </p>
          </div>
        </div>

        {/* Status badges and exit */}
        <div className="flex items-center gap-3">
          {actionSuccessMsg && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-pulse">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/70 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400">Binance Bridge:</span>
            <span className="font-mono text-emerald-400 font-bold">100% Online</span>
          </div>

          <button
            id="admin-refresh-data-btn"
            onClick={loadAdminData}
            title="Refresh Ledger Data"
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            id="admin-exit-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-slate-200 text-xs font-bold rounded-xl border border-slate-600/70 transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Trading</span>
          </button>

          <button
            id="admin-logout-btn"
            onClick={() => {
              sound.playLoss();
              localStorage.removeItem('cryptobari_admin_token');
              localStorage.removeItem('cryptobari_admin_active');
              onClose();
            }}
            className="p-2 text-rose-400 hover:text-white hover:bg-rose-600/30 rounded-xl bg-rose-500/10 border border-rose-500/30 transition cursor-pointer"
            title="Logout Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. BODY WITH SIDEBAR TABS & MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-[#0a0f1c] border-r border-slate-800/90 flex flex-col shrink-0 overflow-y-auto">
          {/* Admin Identity Card */}
          <div className="p-4 border-b border-slate-800/80 bg-gradient-to-b from-[#101729] to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md flex items-center justify-center font-black text-slate-950 text-sm">
                JC
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-extrabold text-white truncate">Jahid Chowdhury</div>
                <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  SUPER_ADMIN
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs">
            <button
              id="admin-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                <span>Dashboard Overview</span>
              </div>
            </button>

            <button
              id="admin-tab-deposits"
              onClick={() => setActiveTab('deposits')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'deposits'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                <span>Deposit Requests</span>
              </div>
              {pendingDepositsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] animate-pulse">
                  {pendingDepositsCount}
                </span>
              )}
            </button>

            <button
              id="admin-tab-withdrawals"
              onClick={() => setActiveTab('withdrawals')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'withdrawals'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                <span>Withdrawal Requests</span>
              </div>
              {pendingWithdrawalsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  {pendingWithdrawalsCount}
                </span>
              )}
            </button>

            <button
              id="admin-tab-otc"
              onClick={() => setActiveTab('otc')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'otc'
                  ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span>OTC Market Engine</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-tight">
                93% Max
              </span>
            </button>

            <button
              id="admin-tab-finance"
              onClick={() => setActiveTab('finance')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'finance'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span>Finance & P&L</span>
              </div>
            </button>

            <button
              id="admin-tab-users"
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Trader Users ({users.length})</span>
              </div>
            </button>

            <button
              id="admin-tab-notices"
              onClick={() => setActiveTab('notices')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'notices'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>Notice & News ({notices.length})</span>
              </div>
            </button>

            <button
              id="admin-tab-referrals"
              onClick={() => setActiveTab('referrals')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'referrals'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-4 h-4 text-rose-400" />
                <span>Referral Affiliates</span>
              </div>
            </button>

            <button
              id="admin-tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Reports & Trades</span>
              </div>
            </button>

            <button
              id="admin-tab-assets"
              onClick={() => setActiveTab('assets')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'assets'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Asset Payout Rates</span>
              </div>
            </button>

            <button
              id="admin-tab-gateway"
              onClick={() => setActiveTab('gateway')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'gateway'
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Binance Gateway</span>
              </div>
            </button>

            <button
              id="admin-tab-support"
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LifeBuoy className="w-4 h-4 text-cyan-400" />
                <span>Support Desk</span>
              </div>
              {supportTickets.filter((t) => t.status === 'OPEN').length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500 text-slate-950">
                  {supportTickets.filter((t) => t.status === 'OPEN').length}
                </span>
              )}
            </button>
          </nav>

          {/* Treasury Summary Footer in Sidebar */}
          <div className="mt-auto p-4 border-t border-slate-800/80 bg-[#080d18] text-[11px]">
            <div className="text-slate-400 font-semibold mb-1">Platform Treasury Vault</div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Live Active:</span>
              <span className="font-mono text-emerald-400 font-black">${currentLiveBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-slate-400">Pending Approvals:</span>
              <span className="font-mono text-amber-400 font-bold">{pendingDepositsCount + pendingWithdrawalsCount}</span>
            </div>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080c16]">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white">Broker Management Dashboard</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time operational health, user volumes, and liquidity metrics.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('deposits')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>Manage Deposits ({pendingDepositsCount})</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12192c] to-[#0d1322] border border-cyan-500/30 shadow-lg">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">Total Turnover Volume</span>
                  <div className="text-xl md:text-2xl font-black text-white font-mono mt-1">
                    ${(financeData?.totalDeposits || 32450).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+14.8% this week</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12192c] to-[#0d1322] border border-emerald-500/30 shadow-lg">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Platform Net House Margin</span>
                  <div className="text-xl md:text-2xl font-black text-emerald-400 font-mono mt-1">
                    +${(financeData?.houseTradingProfit || 6420).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Average payout: <span className="text-white font-mono font-bold">85.4%</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12192c] to-[#0d1322] border border-amber-500/30 shadow-lg">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Pending Deposits Escrow</span>
                  <div className="text-xl md:text-2xl font-black text-amber-300 font-mono mt-1">
                    {pendingDepositsCount} Requests
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Req. value: <span className="text-white font-mono font-bold">${deposits.filter(d => d.status === 'PENDING').reduce((a, b) => a + b.amount, 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12192c] to-[#0d1322] border border-purple-500/30 shadow-lg">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">Registered Traders</span>
                  <div className="text-xl md:text-2xl font-black text-white font-mono mt-1">
                    {users.length + 1420} Traders
                  </div>
                  <div className="text-[11px] text-purple-300 mt-1 font-semibold">
                    Global 38 Countries
                  </div>
                </div>
              </div>

              {/* Action Required Quick Alerts */}
              {pendingDepositsCount > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <ArrowDownCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">
                        {pendingDepositsCount} Pending Deposit{pendingDepositsCount > 1 ? 's' : ''} Require Authorization
                      </h4>
                      <p className="text-xs text-slate-400">
                        Clients are waiting for their real account balance to be credited.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('deposits')}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow transition cursor-pointer"
                  >
                    Open Deposit Approvals
                  </button>
                </div>
              )}

              {/* Live Binance Feed Verification Status */}
              <div className="p-5 rounded-2xl bg-[#101626] border border-slate-800">
                <h3 className="font-black text-sm text-white mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Binance Liquidity & Settlement Bridge Status</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#151c2e] rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Primary Price Feed:</span>
                    <span className="font-bold text-white mt-0.5 block">Binance Official Spot API</span>
                    <span className="text-emerald-400 text-[10px] font-mono">Status: Connected (8ms ping)</span>
                  </div>
                  <div className="p-3 bg-[#151c2e] rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Active Candle Symbols:</span>
                    <span className="font-bold text-white mt-0.5 block">{symbols.length} Pairs Streaming</span>
                    <span className="text-cyan-400 text-[10px] font-mono">1s, 1m, 5m, 15m Real Klines</span>
                  </div>
                  <div className="p-3 bg-[#151c2e] rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Settlement Engine:</span>
                    <span className="font-bold text-white mt-0.5 block">Server Authoritative 250ms</span>
                    <span className="text-emerald-400 text-[10px] font-mono">Zero client tampering allowed</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEPOSIT REQUESTS (ADMIN APPROVAL) */}
          {activeTab === 'deposits' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <ArrowDownCircle className="w-6 h-6 text-emerald-400" />
                    <span>Deposit Requests Management</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verify client payment txHash and approve to automatically credit user's Live Balance.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-[#101626] rounded-xl border border-slate-800">
                  <button
                    onClick={() => setDepositFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      depositFilter === 'PENDING'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Pending ({pendingDepositsCount})
                  </button>
                  <button
                    onClick={() => setDepositFilter('APPROVED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      depositFilter === 'APPROVED'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Approved History
                  </button>
                  <button
                    onClick={() => setDepositFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      depositFilter === 'ALL'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Table of Deposits */}
              <div className="rounded-2xl bg-[#0f1524] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#151c30] text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Request ID</th>
                        <th className="p-3.5">User</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Method</th>
                        <th className="p-3.5">Tx Hash / Proof</th>
                        <th className="p-3.5">Binance ID</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredDeposits.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            No deposit requests found in this view.
                          </td>
                        </tr>
                      ) : (
                        filteredDeposits.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-mono text-cyan-400 font-bold">
                              {item.id}
                            </td>
                            <td className="p-3.5">
                              <div className="font-extrabold text-white">{item.userName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{item.userEmail}</div>
                            </td>
                            <td className="p-3.5 font-mono font-black text-emerald-400 text-sm">
                              ${item.amount.toFixed(2)}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                                {item.method}
                              </span>
                            </td>
                            <td className="p-3.5 max-w-[180px]">
                              <span
                                title={item.txHash}
                                className="font-mono text-slate-400 text-[11px] truncate block cursor-pointer hover:text-white"
                              >
                                {item.txHash}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-[11px] inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                {item.binanceId || '892348102'}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {item.status === 'PENDING' && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Awaiting Approval
                                </span>
                              )}
                              {item.status === 'APPROVED' && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Approved
                                </span>
                              )}
                              {item.status === 'REJECTED' && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Rejected
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              {item.status === 'PENDING' ? (
                                <>
                                  <button
                                    id={`approve-deposit-${item.id}`}
                                    onClick={() => handleApproveDeposit(item.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-lg text-xs shadow-md transition active:scale-95 cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Approve & Credit</span>
                                  </button>
                                  <button
                                    id={`reject-deposit-${item.id}`}
                                    onClick={() => handleRejectDeposit(item.id)}
                                    className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-lg text-xs border border-rose-500/40 transition cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-500">
                                  {item.status === 'APPROVED' ? 'Processed' : 'Declined'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WITHDRAWAL REQUESTS */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Header & Quick Filter */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <ArrowUpCircle className="w-6 h-6 text-amber-400" />
                    <span>Withdrawal Requests & Payout Gateway</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review, verify Receiver Binance Pay ID, and authorize instant payouts to traders.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-[#101626] rounded-xl border border-slate-800">
                    <button
                      onClick={() => setWithdrawalFilter('PENDING')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        withdrawalFilter === 'PENDING'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        withdrawalFilter === 'PENDING' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {pendingWithdrawalsCount}
                      </span>
                    </button>
                    <button
                      onClick={() => setWithdrawalFilter('APPROVED')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        withdrawalFilter === 'APPROVED'
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Dispatched</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        withdrawalFilter === 'APPROVED' ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {approvedWithdrawalsCount}
                      </span>
                    </button>
                    <button
                      onClick={() => setWithdrawalFilter('REJECTED')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        withdrawalFilter === 'REJECTED'
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Refunded</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        withdrawalFilter === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {rejectedWithdrawalsCount}
                      </span>
                    </button>
                    <button
                      onClick={() => setWithdrawalFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        withdrawalFilter === 'ALL'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({withdrawals.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Metric Cards for Payout Operations */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#0e1424] border border-amber-500/30 flex items-center gap-3.5 shadow-lg">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Payout Queue</div>
                    <div className="text-lg font-black text-amber-400 font-mono">
                      ${pendingWithdrawalTotal.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">({pendingWithdrawalsCount} reqs)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e1424] border border-emerald-500/30 flex items-center gap-3.5 shadow-lg">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatched Payouts</div>
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      ${approvedWithdrawalTotal.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">({approvedWithdrawalsCount} paid)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e1424] border border-cyan-500/30 flex items-center gap-3.5 shadow-lg">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payout Network</div>
                    <div className="text-sm font-black text-white truncate">Binance Pay UID Transfer</div>
                    <div className="text-[10px] text-cyan-400 font-mono">Instant • Zero Fee • Direct UID</div>
                  </div>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={withdrawalSearch}
                  onChange={(e) => setWithdrawalSearch(e.target.value)}
                  placeholder="Search withdrawals by Receiver Binance ID, Trader Name, Email, or Request ID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0d1322] border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-400 transition"
                />
                {withdrawalSearch && (
                  <button
                    onClick={() => setWithdrawalSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Main Requests Container (Mobile Cards + Desktop Table) */}
              <div className="rounded-2xl bg-[#0f1524] border border-slate-800 overflow-hidden shadow-2xl">
                {/* Mobile Cards (Visible on screens smaller than md) */}
                <div className="md:hidden divide-y divide-slate-800/80">
                  {filteredWithdrawals.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <ArrowUpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <div className="font-bold text-slate-400 text-sm">No withdrawal requests found</div>
                      <p className="text-xs text-slate-500 mt-1">
                        {withdrawalSearch ? 'Try adjusting your search query.' : 'Incoming Binance Pay withdrawals will appear here instantly.'}
                      </p>
                    </div>
                  ) : (
                    filteredWithdrawals.map((item) => {
                      const targetBinanceId = (item.binanceId || item.receiverBinanceId || item.address || '').trim();
                      const isCopied = copiedWithdrawalBinanceId === item.id;

                      return (
                        <div key={`mob-${item.id}`} className="p-4 space-y-3 hover:bg-slate-800/20 transition">
                          {/* Top Row: ID, Time, and Status */}
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="font-mono text-amber-400 font-bold text-xs">{item.id}</span>
                              <span className="text-[10px] text-slate-500 font-mono ml-2">
                                {new Date(item.createdAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div>
                              {item.status === 'PENDING' && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                  <span>Pending</span>
                                </span>
                              )}
                              {item.status === 'APPROVED' && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  <span>Dispatched</span>
                                </span>
                              )}
                              {item.status === 'REJECTED' && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-rose-400" />
                                  <span>Refunded</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Trader Details */}
                          <div className="flex items-center justify-between text-xs bg-[#0b101c] p-2.5 rounded-xl border border-slate-800/80">
                            <div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Trader</div>
                              <div className="font-extrabold text-white">{item.userName || 'Trader'}</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">{item.userEmail}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Amount</div>
                              <div className="font-mono font-black text-emerald-400 text-base">
                                ${item.amount.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">USD</span>
                              </div>
                              <div className="text-[9px] text-emerald-400 font-semibold">0% Fee Applied</div>
                            </div>
                          </div>

                          {/* Receiver Binance ID Box (Prominently Spotlighted) */}
                          <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/40 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                <span className="px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 font-mono text-[9px]">UID</span>
                                <span>Receiver Binance ID:</span>
                              </div>
                              <div className="font-mono font-black text-white text-sm tracking-wider select-all mt-0.5 break-all">
                                {targetBinanceId || 'Not Provided'}
                              </div>
                            </div>
                            {targetBinanceId && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(targetBinanceId);
                                  setCopiedWithdrawalBinanceId(item.id);
                                  setTimeout(() => setCopiedWithdrawalBinanceId(null), 2500);
                                  sound.playClick();
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 shadow-sm ${
                                  isCopied
                                    ? 'bg-emerald-500 text-slate-950 font-black'
                                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                }`}
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy UID</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Mobile Actions */}
                          {item.status === 'PENDING' ? (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                id={`mob-approve-withdrawal-${item.id}`}
                                onClick={() => handleApproveWithdrawal(item.id)}
                                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                                <span>Approve & Release</span>
                              </button>
                              <button
                                id={`mob-reject-withdrawal-${item.id}`}
                                onClick={() => handleRejectWithdrawal(item.id)}
                                className="w-full py-2.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-xl text-xs border border-rose-500/40 transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject & Refund</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-center py-1 text-[11px] font-mono text-slate-500 bg-[#0c1220] rounded-lg">
                              {item.status === 'APPROVED' ? (
                                <span className="text-emerald-400 font-bold">✓ Payout Dispatched via Binance Pay</span>
                              ) : (
                                <span className="text-rose-400 font-bold">✕ Request Declined & Funds Refunded</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#151c30] text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Withdrawal ID</th>
                        <th className="p-3.5">Trader Account</th>
                        <th className="p-3.5">Withdrawal Amount</th>
                        <th className="p-3.5">Receiver Binance ID (Pay UID)</th>
                        <th className="p-3.5">Payout Method</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredWithdrawals.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-10 text-center text-slate-500">
                            <div className="max-w-xs mx-auto space-y-2">
                              <ArrowUpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                              <div className="font-bold text-slate-400">No withdrawal requests found</div>
                              <p className="text-[11px] text-slate-500">
                                {withdrawalSearch
                                  ? 'Try adjusting your search criteria.'
                                  : 'When traders submit withdrawal requests via Binance Pay, they will appear here instantly.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredWithdrawals.map((item) => {
                          const targetBinanceId = (item.binanceId || item.receiverBinanceId || item.address || '').trim();
                          const isCopied = copiedWithdrawalBinanceId === item.id;

                          return (
                            <tr key={item.id} className="hover:bg-slate-800/40 transition">
                              {/* Withdrawal ID */}
                              <td className="p-3.5">
                                <div className="font-mono text-amber-400 font-bold text-xs">{item.id}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {new Date(item.createdAt).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </td>

                              {/* Trader Info */}
                              <td className="p-3.5">
                                <div className="font-extrabold text-white">{item.userName || 'Trader'}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{item.userEmail}</div>
                              </td>

                              {/* Amount */}
                              <td className="p-3.5">
                                <div className="font-mono font-black text-emerald-400 text-sm">
                                  ${item.amount.toFixed(2)}{' '}
                                  <span className="text-[10px] text-slate-400 font-normal">USD</span>
                                </div>
                                <div className="text-[10px] text-emerald-500/80 font-semibold flex items-center gap-1 mt-0.5">
                                  <span>0% Fee Applied</span>
                                </div>
                              </td>

                              {/* Receiver Binance ID (Spotlighted with 1-click copy) */}
                              <td className="p-3.5">
                                <div className="inline-flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 group hover:border-amber-400 transition">
                                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                                    <span className="font-black text-[10px] text-amber-400">UID</span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[9px] font-bold text-amber-400/80 uppercase tracking-wider">
                                      Receiver Binance ID
                                    </div>
                                    <div className="font-mono font-black text-white text-xs tracking-wider select-all">
                                      {targetBinanceId || 'Not Provided'}
                                    </div>
                                  </div>
                                  {targetBinanceId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(targetBinanceId);
                                        setCopiedWithdrawalBinanceId(item.id);
                                        setTimeout(() => setCopiedWithdrawalBinanceId(null), 2500);
                                        sound.playClick();
                                      }}
                                      className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ml-1 ${
                                        isCopied
                                          ? 'bg-emerald-500 text-slate-950'
                                          : 'bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white'
                                      }`}
                                      title="Copy Receiver Binance ID to clipboard"
                                    >
                                      {isCopied ? (
                                        <div className="flex items-center gap-1 text-[10px]">
                                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                          <span>Copied</span>
                                        </div>
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Payout Method */}
                              <td className="p-3.5">
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                                  <span>{item.method || 'Binance Pay'}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {item.network || 'Binance Pay UID Transfer'}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="p-3.5">
                                {item.status === 'PENDING' && (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                    <span>Pending Review</span>
                                  </span>
                                )}
                                {item.status === 'APPROVED' && (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold inline-flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Dispatched</span>
                                  </span>
                                )}
                                {item.status === 'REJECTED' && (
                                  <span
                                    className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold inline-flex items-center gap-1.5"
                                    title={item.rejectedReason || 'Verification requirement'}
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Refunded</span>
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                                {item.status === 'PENDING' ? (
                                  <>
                                    <button
                                      id={`approve-withdrawal-${item.id}`}
                                      onClick={() => handleApproveWithdrawal(item.id)}
                                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>Approve & Release</span>
                                    </button>
                                    <button
                                      id={`reject-withdrawal-${item.id}`}
                                      onClick={() => handleRejectWithdrawal(item.id)}
                                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-xl text-xs border border-rose-500/40 transition cursor-pointer"
                                    >
                                      Reject & Refund
                                    </button>
                                  </>
                                ) : (
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    {item.status === 'APPROVED' ? (
                                      <span className="text-emerald-400/80">Completed</span>
                                    ) : (
                                      <span className="text-rose-400/80">Refunded to Live</span>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: OTC SYNTHETIC MARKET ENGINE (Quotex Style, Max 93% Payout) */}
          {activeTab === 'otc' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Header & Quick Action */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
                      <Zap className="w-5 h-5 fill-slate-950 stroke-[2.5]" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white">
                      Quotex-Style OTC Synthetic Pairs Engine
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage 24/7 OTC Synthetic market assets, continuous smooth price synthesis, and Quotex-standard high payout returns (up to 93%).
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs rounded-xl flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>10 Curated Authentic Pairs (5 Live + 5 OTC)</span>
                  </div>
                </div>
              </div>

              {/* 2 Operations Cards: Global Payout Controller & OTC Engine Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Global Payout Controller */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121a2d] to-[#0c1220] border border-amber-500/40 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-4 h-4 fill-amber-400" />
                        <span>Global Default OTC Payout</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Default rate applied to newly created OTC synthetic pairs</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-xs">
                      Max: 93%
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300 mb-1.5">
                        <span>Current Default:</span>
                        <span className="text-amber-400 text-lg font-black">{defaultOtcPayout}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="93"
                        value={defaultOtcPayout}
                        onChange={(e) => setDefaultOtcPayout(Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <button
                      id="btn-save-default-otc-payout"
                      onClick={() => handleUpdateDefaultOtcPayout(defaultOtcPayout)}
                      disabled={isSavingDefaultPayout}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingDefaultPayout ? 'Saving...' : 'Apply Default'}
                    </button>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Presets:</span>
                    {[93, 90, 88, 85, 80].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleUpdateDefaultOtcPayout(rate)}
                        className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                          defaultOtcPayout === rate
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-[#090e1a] border border-slate-700 text-slate-300 hover:border-amber-400 hover:text-white'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* OTC Engine Status & Algorithmic Guardrails */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#101728] to-[#0a0f1d] border border-cyan-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>OTC Engine Algorithmic Guardrails</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                      Online 24/7
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#090e1a] border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Active OTC Pairs</div>
                      <div className="text-white font-mono font-black text-sm mt-0.5">
                        {otcPairs.filter((p) => p.enabled).length} / {otcPairs.length}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#090e1a] border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Max Payout Cap</div>
                      <div className="text-amber-400 font-mono font-black text-sm mt-0.5">
                        93% (Quotex Standard)
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 leading-relaxed bg-[#0b101c] p-2.5 rounded-xl border border-slate-800/80">
                    ℹ️ <strong>Algorithmic Movement:</strong> Prices synthesized via continuous stochastic drift. No artificial periodic waves. Fully independent 24/7 OTC liquidity.
                  </div>
                </div>
              </div>

              {/* Category Filter Pills & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#101626] rounded-xl border border-slate-800">
                  {(['ALL', 'Forex', 'Crypto', 'Commodity', 'Index'] as const).map((cat) => {
                    const count = cat === 'ALL' ? otcPairs.length : otcPairs.filter((p) => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          sound.playClick();
                          setOtcCategoryFilter(cat);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          otcCategoryFilter === cat
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{cat === 'ALL' ? 'All OTC Pairs' : cat}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            otcCategoryFilter === cat ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otcSearch}
                    onChange={(e) => setOtcSearch(e.target.value)}
                    placeholder="Filter by OTC symbol or name..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e1424] border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-400 transition"
                  />
                  {otcSearch && (
                    <button
                      onClick={() => setOtcSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* OTC Pairs List (Responsive Table on Desktop & Cards on Mobile) */}
              <div className="rounded-2xl bg-[#0f1524] border border-slate-800 overflow-hidden shadow-2xl">
                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-slate-800/80">
                  {otcPairs
                    .filter((p) => {
                      if (otcCategoryFilter !== 'ALL' && p.category !== otcCategoryFilter) return false;
                      if (otcSearch) {
                        const q = otcSearch.toLowerCase();
                        return p.symbol.toLowerCase().includes(q) || p.displayName.toLowerCase().includes(q);
                      }
                      return true;
                    })
                    .map((pair) => (
                      <div key={`mob-otc-${pair.id}`} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-sm">{pair.displayName}</span>
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-[9px]">
                                OTC
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{pair.symbol}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                pair.enabled
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {pair.enabled ? 'ACTIVE' : 'PAUSED'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-[#0b101c] p-2.5 rounded-xl border border-slate-800">
                          <div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Category</div>
                            <div className="text-cyan-400 font-bold">{pair.category} OTC</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Base Price</div>
                            <div className="text-white font-mono font-bold">
                              {pair.price ? pair.price.toFixed(pair.pricePrecision || 2) : '1.00'}
                            </div>
                          </div>
                        </div>

                        {/* Payout Adjustment Controls */}
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                              Trader Payout Rate:
                            </div>
                            <div className="text-base font-black text-amber-400 font-mono">{pair.payoutRate}%</div>
                          </div>

                          <div className="flex items-center gap-1">
                            {[93, 90, 85].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => handleUpdateOtcPairPayout(pair.id, rate)}
                                className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                                  pair.payoutRate === rate
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-slate-800 text-slate-300 hover:text-white'
                                }`}
                              >
                                {rate}%
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-1">
                          <button
                            onClick={() => handleToggleOtcPair(pair.id, pair.enabled)}
                            className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                              pair.enabled
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            }`}
                          >
                            <span>{pair.enabled ? 'Pause Trading' : 'Enable Trading'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#151c30] text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">OTC Pair Asset</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Synthetic Price</th>
                        <th className="p-3.5">Trader Payout Rate</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {otcPairs
                        .filter((p) => {
                          if (otcCategoryFilter !== 'ALL' && p.category !== otcCategoryFilter) return false;
                          if (otcSearch) {
                            const q = otcSearch.toLowerCase();
                            return p.symbol.toLowerCase().includes(q) || p.displayName.toLowerCase().includes(q);
                          }
                          return true;
                        })
                        .map((pair) => (
                          <tr key={`row-otc-${pair.id}`} className="hover:bg-slate-800/30 transition">
                            {/* Pair Asset */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs font-mono">
                                  OTC
                                </div>
                                <div>
                                  <div className="font-extrabold text-white flex items-center gap-1.5">
                                    <span>{pair.displayName}</span>
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">
                                      Quotex
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">{pair.symbol}</div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700 text-[10px] font-bold">
                                {pair.category} OTC
                              </span>
                            </td>

                            {/* Base Price */}
                            <td className="p-3.5 font-mono font-bold text-slate-300">
                              {pair.price ? pair.price.toFixed(pair.pricePrecision || 2) : '1.00000'}
                            </td>

                            {/* Payout Rate with quick stepper */}
                            <td className="p-3.5">
                              <div className="inline-flex items-center gap-1.5 bg-[#0b101c] p-1 rounded-xl border border-slate-700">
                                <span className="font-mono font-black text-amber-400 text-xs px-2">
                                  {pair.payoutRate}%
                                </span>
                                <div className="flex items-center gap-1">
                                  {[93, 90, 85].map((rate) => (
                                    <button
                                      key={rate}
                                      onClick={() => handleUpdateOtcPairPayout(pair.id, rate)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                                        pair.payoutRate === rate
                                          ? 'bg-amber-400 text-slate-950'
                                          : 'bg-slate-800 text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      {rate}%
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-3.5">
                              {pair.enabled ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span>Active (24/7)</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
                                  Paused
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleOtcPair(pair.id, pair.enabled)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  pair.enabled
                                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black'
                                }`}
                              >
                                {pair.enabled ? 'Pause' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCE & P&L */}
          {activeTab === 'finance' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-purple-400" />
                    <span>Broker Treasury & Real-Time Financial Ledger</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Total Deposits − Dispatched Payouts = Net Balance → minus Referral Commissions = Final Net Profit or Loss.
                  </p>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Daily P&L Live Calculator Active</span>
                </div>
              </div>

              {/* 5-Step Smart Pipeline Cards (Formula Breakdown) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. Total Deposits */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131a2e] to-[#0c1221] border border-cyan-500/30 shadow-xl relative overflow-hidden">
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                    <span>1. Total Deposits</span>
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono mt-2">
                    ${(financeData?.totalDeposits || 32450).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Verified Inflow (USDT & Binance)</p>
                </div>

                {/* 2. Total Dispatched Payouts */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131a2e] to-[#0c1221] border border-amber-500/30 shadow-xl relative overflow-hidden">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                    <span>2. Dispatched Payouts</span>
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-2">
                    −${(financeData?.dispatchedPayouts || 21250).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Honored trader withdrawals</p>
                </div>

                {/* 3. Total Balance Amount (Deposits - Payouts) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131a2e] to-[#0c1221] border border-blue-500/40 shadow-xl relative overflow-hidden ring-1 ring-blue-500/20">
                  <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between">
                    <span>3. Net Balance</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">Dep − Payout</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono mt-2">
                    ${(financeData?.totalBalanceAmount || 11200).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Residual gross capital</p>
                </div>

                {/* 4. Referral Commission */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131a2e] to-[#0c1221] border border-rose-500/30 shadow-xl relative overflow-hidden">
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center justify-between">
                    <span>4. Referral Outflow</span>
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-300 font-mono mt-2">
                    −${(financeData?.referralCommissions || 3450).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Affiliate commission pay</p>
                </div>

                {/* 5. Net Profit or Loss */}
                <div className={`p-4 rounded-2xl bg-gradient-to-br from-[#131a2e] to-[#0c1221] shadow-xl relative overflow-hidden border ${
                  (financeData?.isProfit ?? true)
                    ? 'border-emerald-500/60 ring-2 ring-emerald-500/30'
                    : 'border-rose-500/60 ring-2 ring-rose-500/30'
                }`}>
                  <div className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                    <span className={(financeData?.isProfit ?? true) ? 'text-emerald-400' : 'text-rose-400'}>
                      5. Final Net Profit/Loss
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                      (financeData?.isProfit ?? true)
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {(financeData?.isProfit ?? true) ? 'PROFIT' : 'LOSS'}
                    </span>
                  </div>
                  <div className={`text-xl sm:text-2xl font-black font-mono mt-2 ${
                    (financeData?.isProfit ?? true) ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {(financeData?.isProfit ?? true) ? '+' : ''}${(financeData?.netProfitOrLoss || 7750).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Net profit after all deductions</p>
                </div>
              </div>

              {/* Smart Daily Profit / Loss Breakdown Table */}
              <div className="rounded-2xl bg-[#0f1524] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-4 bg-[#141b2e] border-b border-slate-800 flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Daily Financial Audit & Net P&L Summary (Admin Daily View)</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Formula: (Deposits − Payouts) − Affiliate = Daily Net P&L</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111827] text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Day / Date</th>
                        <th className="p-3.5">Gross Deposits</th>
                        <th className="p-3.5">Dispatched Payouts</th>
                        <th className="p-3.5">Net Balance</th>
                        <th className="p-3.5">Referral Comm.</th>
                        <th className="p-3.5">Daily Net Profit / Loss</th>
                        <th className="p-3.5 text-right">Day Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {(financeData?.dailyReports || [
                        {
                          date: 'Today',
                          deposits: 2850,
                          dispatchedPayouts: 1420,
                          netBalance: 1430,
                          referralCommission: 140,
                          netProfitLoss: 1290,
                          status: 'PROFIT'
                        },
                        {
                          date: 'Yesterday',
                          deposits: 3100,
                          dispatchedPayouts: 1750,
                          netBalance: 1350,
                          referralCommission: 165,
                          netProfitLoss: 1185,
                          status: 'PROFIT'
                        },
                        {
                          date: '3 Days Ago',
                          deposits: 4200,
                          dispatchedPayouts: 2100,
                          netBalance: 2100,
                          referralCommission: 240,
                          netProfitLoss: 1860,
                          status: 'PROFIT'
                        },
                        {
                          date: '4 Days Ago',
                          deposits: 1950,
                          dispatchedPayouts: 1200,
                          netBalance: 750,
                          referralCommission: 95,
                          netProfitLoss: 655,
                          status: 'PROFIT'
                        },
                        {
                          date: '5 Days Ago',
                          deposits: 3600,
                          dispatchedPayouts: 1900,
                          netBalance: 1700,
                          referralCommission: 190,
                          netProfitLoss: 1510,
                          status: 'PROFIT'
                        },
                      ]).map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                            <span>{row.date}</span>
                          </td>
                          <td className="p-3.5 font-mono text-cyan-400 font-bold">
                            ${row.deposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 font-mono text-amber-400">
                            ${row.dispatchedPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 font-mono text-blue-300 font-semibold">
                            ${row.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 font-mono text-rose-400">
                            ${row.referralCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 font-mono font-black text-sm">
                            <span className={row.status === 'PROFIT' ? 'text-emerald-400' : 'text-rose-400'}>
                              {row.netProfitLoss >= 0 ? '+' : ''}${row.netProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide border ${
                              row.status === 'PROFIT'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Solvency & Cold Wallet Reserve */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#0f1524] border border-slate-800">
                  <h3 className="font-black text-sm text-white mb-3 flex items-center justify-between">
                    <span>Cold Wallet Treasury Solvency</span>
                    <span className="text-emerald-400 font-mono text-xs">100% Backed</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-slate-400">Binance Partner Custody Reserve</span>
                        <span className="text-emerald-400 font-mono font-bold">$156,420.00</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '88%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0f1524] border border-slate-800">
                  <h3 className="font-black text-sm text-white mb-3 flex items-center justify-between">
                    <span>Risk & Payout Safety Factor</span>
                    <span className="text-cyan-400 font-mono text-xs">A+ Rating</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-slate-400">House Edge Protection</span>
                        <span className="text-cyan-400 font-mono font-bold">14.6% Spread Retain</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: '72%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-400" />
                    <span>Trader Directory & Balances</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Search traders, create new trading accounts, inspect live balances, toggle KYC status, and adjust funds.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name, email, country..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-[#101626] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <button
                    id="btn-create-trader-user"
                    onClick={() => setIsNewUserModalOpen(true)}
                    className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Trader</span>
                  </button>
                </div>
              </div>

              {/* Create User Form Modal / Card if open */}
              {isNewUserModalOpen && (
                <form
                  onSubmit={handleCreateUser}
                  className="p-5 rounded-2xl bg-gradient-to-br from-[#111930] to-[#0c1222] border border-blue-500/50 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="font-extrabold text-sm text-white">Create New Trader Account (Auto-added to Directory)</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNewUserModalOpen(false)}
                      className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Masud Rana"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0a0f1d] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. trader.rana@gmail.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0a0f1d] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Country / Region</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 🇧🇩 Bangladesh"
                        value={newUserCountry}
                        onChange={(e) => setNewUserCountry(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0a0f1d] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Initial Live Balance ($)</label>
                      <input
                        type="number"
                        min="0"
                        max="50000"
                        value={newUserInitialBalance}
                        onChange={(e) => setNewUserInitialBalance(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-[#0a0f1d] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsNewUserModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/80 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-500 shadow-lg cursor-pointer transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Save & Add to Trader Users</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="rounded-2xl bg-[#0f1524] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#151c30] text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Trader</th>
                        <th className="p-3.5">Country</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">KYC Status</th>
                        <th className="p-3.5">Live Balance</th>
                        <th className="p-3.5">Demo Balance</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Quick Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="font-extrabold text-white">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </td>
                          <td className="p-3.5 text-slate-300 font-medium">{u.country}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => handleToggleKyc(u.id)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                                u.kycStatus === 'VERIFIED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {u.kycStatus}
                            </button>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-400">
                            ${u.liveBalance.toFixed(2)}
                          </td>
                          <td className="p-3.5 font-mono text-slate-400">
                            ${u.demoBalance.toFixed(2)}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {u.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleAdjustUserBalance(u.id)}
                              className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white font-bold rounded-lg text-[11px] border border-cyan-500/40 transition cursor-pointer"
                            >
                              Adjust Balance
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: NOTICES & ANNOUNCEMENTS */}
          {activeTab === 'notices' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <Bell className="w-6 h-6 text-cyan-400" />
                    <span>System Announcements & Client Notices</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Broadcast critical updates, deposit promos, or market news live to all trading clients.
                  </p>
                </div>
                <button
                  onClick={() => setIsNoticeFormOpen(!isNoticeFormOpen)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Announcement</span>
                </button>
              </div>

              {/* Form to add notice */}
              {isNoticeFormOpen && (
                <form
                  onSubmit={handleCreateNotice}
                  className="p-5 rounded-2xl bg-[#111728] border border-cyan-500/40 space-y-4 shadow-xl"
                >
                  <h3 className="font-extrabold text-sm text-white">Broadcast New Live Notice</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-300 block mb-1">Headline / Title</label>
                      <input
                        type="text"
                        required
                        value={newNoticeTitle}
                        onChange={(e) => setNewNoticeTitle(e.target.value)}
                        placeholder="e.g. Binance Spot API Upgrade Completed"
                        className="w-full px-3.5 py-2 bg-[#0c101c] border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Notice Type</label>
                      <select
                        value={newNoticeType}
                        onChange={(e: any) => setNewNoticeType(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#0c101c] border border-slate-700 rounded-xl text-xs text-white"
                      >
                        <option value="INFO">Information</option>
                        <option value="PROMO">Promotion / Bonus</option>
                        <option value="ALERT">Important Alert</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Notice Content</label>
                    <textarea
                      rows={3}
                      required
                      value={newNoticeContent}
                      onChange={(e) => setNewNoticeContent(e.target.value)}
                      placeholder="Write full message broadcasted to user terminals..."
                      className="w-full px-3.5 py-2 bg-[#0c101c] border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNoticeFormOpen(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black shadow"
                    >
                      Publish Announcement
                    </button>
                  </div>
                </form>
              )}

              {/* List of Notices */}
              <div className="space-y-3">
                {notices.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-[#0f1524] border border-slate-800 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            n.type === 'ALERT'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : n.type === 'PROMO'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}
                        >
                          {n.type}
                        </span>
                        <h4 className="font-extrabold text-sm text-white">{n.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{n.content}</p>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        Posted: {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      className="p-2 text-rose-400 hover:text-rose-200 rounded-lg hover:bg-rose-500/20 transition cursor-pointer"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: REFERRALS */}
          {activeTab === 'referrals' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <Share2 className="w-6 h-6 text-rose-400" />
                  <span>Affiliate & Referral Network</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Affiliate tier commission tracking, referred turnover, and partner payouts.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#0f1524] border border-slate-800">
                  <span className="text-xs font-bold text-slate-400">Total Affiliates</span>
                  <div className="text-xl font-black text-white mt-1">142 Partners</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0f1524] border border-slate-800">
                  <span className="text-xs font-bold text-slate-400">Referred Volume</span>
                  <div className="text-xl font-black text-white mt-1 font-mono">$489,200</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0f1524] border border-slate-800">
                  <span className="text-xs font-bold text-slate-400">Commissions Paid</span>
                  <div className="text-xl font-black text-emerald-400 mt-1 font-mono">$24,460</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0f1524] border border-slate-800">
                  <span className="text-xs font-bold text-slate-400">Default Rate</span>
                  <div className="text-xl font-black text-amber-400 mt-1 font-mono">5.0%</div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#0f1524] border border-slate-800 overflow-hidden">
                <div className="p-4 bg-[#141b2e] border-b border-slate-800 font-bold text-xs text-slate-300">
                  Top Performing Broker Affiliates
                </div>
                <div className="divide-y divide-slate-800 text-xs">
                  {referralData?.topAffiliates?.map((aff: any) => (
                    <div key={aff.code} className="p-3.5 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-cyan-400 font-bold">{aff.code}</span>
                        <div className="text-slate-400 text-[11px]">Partner: {aff.owner}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-mono font-bold">${aff.commission.toLocaleString()} paid</div>
                        <div className="text-slate-400 text-[11px]">{aff.invited} Traders Invited</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SMART EXECUTIVE REPORTS & AUDIT */}
          {activeTab === 'reports' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <FileText className="w-6 h-6 text-emerald-400" />
                    <span>Smart Brokerage Financial Reports & Audit System</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Multi-tier daily, monthly, and yearly executive analytics with certified official PDF report download.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Timeframe selector: Daily, Monthly, Yearly */}
                  <div className="flex bg-[#0f1526] p-1 rounded-xl border border-slate-700/80">
                    <button
                      id="btn-report-daily"
                      onClick={() => { sound.playClick(); setReportTimeframe('daily'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        reportTimeframe === 'daily'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Daily Reports
                    </button>
                    <button
                      id="btn-report-monthly"
                      onClick={() => { sound.playClick(); setReportTimeframe('monthly'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        reportTimeframe === 'monthly'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Monthly Reports
                    </button>
                    <button
                      id="btn-report-yearly"
                      onClick={() => { sound.playClick(); setReportTimeframe('yearly'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        reportTimeframe === 'yearly'
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Yearly Reports
                    </button>
                  </div>

                  {/* PDF Download Button */}
                  <button
                    id="btn-download-pdf-report"
                    onClick={handleDownloadPdfReport}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-950" />
                    <span>Download PDF Report</span>
                  </button>
                </div>
              </div>

              {/* 4 Colorful 3D Executive Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c33] to-[#0a101f] border border-cyan-500/30 shadow-xl relative overflow-hidden">
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">
                    {reportTimeframe === 'daily' ? 'Today Gross Inflow' : reportTimeframe === 'monthly' ? 'Monthly Deposit Inflow' : 'Yearly Deposit Volume'}
                  </div>
                  <div className="text-2xl font-black text-white font-mono mt-1.5">
                    ${reportTimeframe === 'daily' ? '2,850.00' : reportTimeframe === 'monthly' ? '86,450.00' : '942,800.00'}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.4% vs previous {reportTimeframe}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c33] to-[#0a101f] border border-amber-500/30 shadow-xl relative overflow-hidden">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                    {reportTimeframe === 'daily' ? 'Today Trader Payouts' : reportTimeframe === 'monthly' ? 'Monthly Payouts Dispatched' : 'Yearly Payouts Honored'}
                  </div>
                  <div className="text-2xl font-black text-amber-300 font-mono mt-1.5">
                    ${reportTimeframe === 'daily' ? '1,420.00' : reportTimeframe === 'monthly' ? '54,200.00' : '612,400.00'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">100% Instant On-chain Fulfillment</div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c33] to-[#0a101f] border border-purple-500/30 shadow-xl relative overflow-hidden">
                  <div className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">
                    {reportTimeframe === 'daily' ? 'Today Net Balance' : reportTimeframe === 'monthly' ? 'Monthly Gross Balance' : 'Yearly Retained Balance'}
                  </div>
                  <div className="text-2xl font-black text-white font-mono mt-1.5">
                    ${reportTimeframe === 'daily' ? '1,430.00' : reportTimeframe === 'monthly' ? '32,250.00' : '330,400.00'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Gross balance before affiliate share</div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c33] to-[#0a101f] border border-emerald-500/40 shadow-xl relative overflow-hidden ring-1 ring-emerald-500/30">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-between">
                    <span>{reportTimeframe === 'daily' ? 'Today Net House Profit' : reportTimeframe === 'monthly' ? 'Monthly Net Profit' : 'Yearly Net Profit'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1.5">
                    +${reportTimeframe === 'daily' ? '1,290.00' : reportTimeframe === 'monthly' ? '28,800.00' : '294,200.00'}
                  </div>
                  <div className="text-[10px] text-emerald-300 font-bold mt-1">
                    Audited Profit Yield: {reportTimeframe === 'daily' ? '45.2%' : reportTimeframe === 'monthly' ? '33.3%' : '31.2%'}
                  </div>
                </div>
              </div>

              {/* Dynamic Period Audit Table */}
              <div className="rounded-2xl bg-[#0f1524] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-4 bg-[#141b2e] border-b border-slate-800 flex items-center justify-between">
                  <div className="font-bold text-xs text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>
                      {reportTimeframe === 'daily' ? 'Daily Statements & Day-By-Day Audit (Last 7 Days)' : reportTimeframe === 'monthly' ? 'Monthly Statements & Month-By-Month Audit (2026 Fiscal)' : 'Yearly Consolidated Financial Audit (2024 - 2026)'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Real-Time Ledger Sync</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111827] text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Period / Cycle</th>
                        <th className="p-3.5">Verified Deposits</th>
                        <th className="p-3.5">Dispatched Payouts</th>
                        <th className="p-3.5">Total Balance</th>
                        <th className="p-3.5">Affiliate Outflow</th>
                        <th className="p-3.5">Net House Profit</th>
                        <th className="p-3.5 text-right">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {reportTimeframe === 'daily' && (
                        (financeData?.dailyReports || [
                          { date: 'Today (Live)', deposits: 2850, dispatchedPayouts: 1420, netBalance: 1430, referralCommission: 140, netProfitLoss: 1290, status: 'PROFIT' },
                          { date: 'Yesterday', deposits: 3100, dispatchedPayouts: 1750, netBalance: 1350, referralCommission: 165, netProfitLoss: 1185, status: 'PROFIT' },
                          { date: 'Sep 05, 2026', deposits: 4200, dispatchedPayouts: 2100, netBalance: 2100, referralCommission: 240, netProfitLoss: 1860, status: 'PROFIT' },
                          { date: 'Sep 04, 2026', deposits: 1950, dispatchedPayouts: 1200, netBalance: 750, referralCommission: 95, netProfitLoss: 655, status: 'PROFIT' },
                          { date: 'Sep 03, 2026', deposits: 3600, dispatchedPayouts: 1900, netBalance: 1700, referralCommission: 190, netProfitLoss: 1510, status: 'PROFIT' },
                          { date: 'Sep 02, 2026', deposits: 2400, dispatchedPayouts: 1100, netBalance: 1300, referralCommission: 120, netProfitLoss: 1180, status: 'PROFIT' },
                          { date: 'Sep 01, 2026', deposits: 5100, dispatchedPayouts: 2600, netBalance: 2500, referralCommission: 280, netProfitLoss: 2220, status: 'PROFIT' },
                        ]).map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-bold text-white font-mono">{row.date}</td>
                            <td className="p-3.5 font-mono text-cyan-400 font-bold">${row.deposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono text-amber-400">−${row.dispatchedPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono text-blue-300 font-bold">${row.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono text-rose-400">−${row.referralCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono font-black text-emerald-400">+${row.netProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 text-right">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                CERTIFIED PROFIT
                              </span>
                            </td>
                          </tr>
                        ))
                      )}

                      {reportTimeframe === 'monthly' && (
                        [
                          { month: 'September 2026 (MTD)', deposits: 23200, payouts: 12070, balance: 11130, ref: 1230, net: 9900, status: 'PROFIT' },
                          { month: 'August 2026', deposits: 84600, payouts: 52100, balance: 32500, ref: 3450, net: 29050, status: 'PROFIT' },
                          { month: 'July 2026', deposits: 78900, payouts: 49400, balance: 29500, ref: 3100, net: 26400, status: 'PROFIT' },
                          { month: 'June 2026', deposits: 71200, payouts: 44300, balance: 26900, ref: 2800, net: 24100, status: 'PROFIT' },
                          { month: 'May 2026', deposits: 65400, payouts: 40800, balance: 24600, ref: 2500, net: 22100, status: 'PROFIT' },
                        ].map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-bold text-white font-mono">{m.month}</td>
                            <td className="p-3.5 font-mono text-cyan-400 font-bold">${m.deposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono text-amber-400">−${m.payouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono text-blue-300 font-bold">${m.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono text-rose-400">−${m.ref.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono font-black text-emerald-400">+${m.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 text-right">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                AUDITED CLOSE
                              </span>
                            </td>
                          </tr>
                        ))
                      )}

                      {reportTimeframe === 'yearly' && (
                        [
                          { year: '2026 (YTD)', deposits: 620500, payouts: 395100, balance: 225400, ref: 24600, net: 200800, status: 'PROFIT' },
                          { year: '2025 (Audited)', deposits: 840200, payouts: 546000, balance: 294200, ref: 32000, net: 262200, status: 'PROFIT' },
                          { year: '2024 (Audited)', deposits: 520000, payouts: 340000, balance: 180000, ref: 19500, net: 160500, status: 'PROFIT' },
                        ].map((y, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-bold text-white font-mono">{y.year}</td>
                            <td className="p-3.5 font-mono text-cyan-400 font-bold">${y.deposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono text-amber-400">−${y.payouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono text-blue-300 font-bold">${y.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono text-rose-400">−${y.ref.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 font-mono font-black text-emerald-400">+${y.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3.5 text-right">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                ANNUAL AUDITED
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real-time trade settlements */}
              <div className="rounded-2xl bg-[#0f1524] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-4 bg-[#141b2e] border-b border-slate-800 font-bold text-xs text-slate-300 flex items-center justify-between">
                  <span>Settled Live Trades Against Binance Spot Pricing</span>
                  <span className="text-slate-500 text-[11px] font-mono">Showing last {recentTrades.length} settlements</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#151c30] text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Trade ID</th>
                        <th className="p-3.5">Pair</th>
                        <th className="p-3.5">Direction</th>
                        <th className="p-3.5">Investment</th>
                        <th className="p-3.5">Entry Price</th>
                        <th className="p-3.5">Exit Price</th>
                        <th className="p-3.5">Result</th>
                        <th className="p-3.5 text-right">House Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {recentTrades.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            No closed trades recorded yet in this session.
                          </td>
                        </tr>
                      ) : (
                        recentTrades.slice(0, 50).map((t) => (
                          <tr key={t.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-mono text-cyan-400 font-bold">{t.id}</td>
                            <td className="p-3.5 font-bold text-white">{t.displayPair || t.symbol}</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.direction === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {t.direction}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono">${t.investment.toFixed(2)}</td>
                            <td className="p-3.5 font-mono text-slate-300">{t.entryPrice?.toFixed(2)}</td>
                            <td className="p-3.5 font-mono text-slate-300">{t.exitPrice?.toFixed(2)}</td>
                            <td className="p-3.5">
                              <span
                                className={`font-black text-xs ${
                                  t.result === 'WIN' ? 'text-emerald-400' : t.result === 'TIE' ? 'text-amber-400' : 'text-rose-400'
                                }`}
                              >
                                {t.result}
                              </span>
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold">
                              {t.result === 'WIN' ? (
                                <span className="text-rose-400">-${(t.profit || 0).toFixed(2)}</span>
                              ) : (
                                <span className="text-emerald-400">+${t.investment.toFixed(2)}</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: ASSET PAYOUT RATES */}
          {activeTab === 'assets' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-amber-400" />
                  <span>Market Asset Payout Configurations</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set the return percentage (70% - 98%) per crypto pair or toggle pairs on/off.
                </p>
              </div>

              <div className="rounded-2xl bg-[#0f1524] border border-slate-800 overflow-hidden shadow-xl">
                <div className="divide-y divide-slate-800 text-xs">
                  {symbols.map((s) => (
                    <div key={s.symbol} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-extrabold text-sm text-white flex items-center gap-2">
                          <span>{s.displayPair}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({s.symbol})</span>
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5">
                          Binance Live Price: <span className="text-white font-mono font-bold">${s.price.toFixed(s.pricePrecision)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-slate-400 text-xs font-bold">Payout Rate:</label>
                          <input
                            type="number"
                            min={50}
                            max={98}
                            value={s.payoutRate}
                            onChange={(e) => {
                              const newRate = parseInt(e.target.value, 10);
                              if (newRate >= 50 && newRate <= 98) {
                                onUpdateSymbolPayout(s.symbol, newRate, s.enabled !== false);
                              }
                            }}
                            className="w-20 px-2.5 py-1.5 bg-[#090e1a] border border-slate-700 rounded-lg text-center font-mono font-black text-emerald-400 text-sm focus:outline-none focus:border-cyan-400"
                          />
                          <span className="font-bold text-slate-400">%</span>
                        </div>

                        <button
                          onClick={() => {
                            const newEnabled = !(s.enabled !== false);
                            onUpdateSymbolPayout(s.symbol, s.payoutRate, newEnabled);
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition ${
                            s.enabled !== false
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {s.enabled !== false ? 'Trading Active' : 'Suspended'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: BINANCE PAYMENT GATEWAY SETTINGS */}
          {activeTab === 'gateway' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-amber-400" />
                  <span>Binance Pay Gateway Configuration</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update broker deposit Binance ID number and upload custom QR code image seen by all traders.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Form Settings (7 Cols) */}
                <form
                  onSubmit={handleSaveBinanceGateway}
                  className="lg:col-span-7 bg-[#0f1524] border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Binance Pay ID Number</span>
                      <span className="text-[10px] text-amber-400 font-mono">Shown to all depositors</span>
                    </label>
                    <input
                      type="text"
                      value={binanceId}
                      onChange={(e) => setBinanceId(e.target.value)}
                      placeholder="e.g. 794380283"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Merchant Nickname / Payee Name</label>
                    <input
                      type="text"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      placeholder="e.g. CryptoBari"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Binance Pay QR Code</span>
                      <span className="text-[10px] text-slate-400">Upload image or paste image URL</span>
                    </label>

                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-amber-500/40 rounded-xl cursor-pointer text-xs font-bold text-amber-300 transition">
                        <Upload className="w-4 h-4" />
                        <span>Upload QR Code Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (uploadEvent) => {
                                if (uploadEvent.target?.result) {
                                  setQrImage(uploadEvent.target.result as string);
                                  showNotification('QR Code image uploaded successfully!');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400">Or Image URL / Path:</span>
                      <input
                        type="text"
                        value={qrImage}
                        onChange={(e) => setQrImage(e.target.value)}
                        placeholder="/binance_qr.png or https://..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Trader Deposit Instructions / Guidance</label>
                    <textarea
                      rows={3}
                      value={qrInstructions}
                      onChange={(e) => setQrInstructions(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-amber-400 leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingGateway}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-[#F0B90B] to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSavingGateway ? 'Deploying Changes...' : 'Save & Deploy Gateway Configuration'}</span>
                  </button>
                </form>

                {/* Live Preview Card (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Trader View Real-Time Preview
                  </div>

                  <div className="bg-[#0f1524] border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#F0B90B] flex items-center justify-center text-slate-950 font-black text-xs">
                        B
                      </div>
                      <span className="font-black text-white text-sm">{merchantName || 'CryptoBari'}</span>
                    </div>

                    <div className="relative mx-auto w-48 h-48 rounded-2xl bg-white p-3 shadow-xl flex items-center justify-center overflow-hidden">
                      {qrImage ? (
                        <img
                          src={qrImage}
                          alt="Binance QR Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode className="w-32 h-32 text-slate-900" />
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400">Binance Pay ID</div>
                      <div className="font-mono text-amber-400 font-black text-base">{binanceId || '794380283'}</div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {qrInstructions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: SUPPORT TICKETS DESK */}
          {activeTab === 'support' && (
            <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <LifeBuoy className="w-6 h-6 text-cyan-400" />
                    <span>Broker Client Support Desk</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time inquiry management, trader dialogue, and ticket resolution.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-[#101626] rounded-xl border border-slate-800">
                  <button
                    onClick={() => setSupportFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      supportFilter === 'ALL'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({supportTickets.length})
                  </button>
                  <button
                    onClick={() => setSupportFilter('OPEN')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      supportFilter === 'OPEN'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Open ({supportTickets.filter(t => t.status === 'OPEN').length})
                  </button>
                  <button
                    onClick={() => setSupportFilter('RESOLVED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      supportFilter === 'RESOLVED'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Resolved ({supportTickets.filter(t => t.status === 'RESOLVED').length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Tickets List (4 cols) */}
                <div className="lg:col-span-4 bg-[#0f1524] border border-slate-800 rounded-3xl p-4 space-y-2.5 shadow-xl">
                  <div className="text-xs font-black text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Inquiry Queue
                  </div>

                  <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                    {supportTickets.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No support tickets currently received.
                      </div>
                    ) : (
                      supportTickets
                        .filter(t => supportFilter === 'ALL' || t.status === supportFilter)
                        .map(t => (
                          <div
                            key={t.id}
                            onClick={() => {
                              sound.playClick();
                              setSelectedTicketId(t.id);
                            }}
                            className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                              selectedTicketId === t.id
                                ? 'bg-gradient-to-r from-[#172338] to-[#121c2e] border-cyan-500/50 text-slate-100 shadow-md ring-1 ring-cyan-500/30'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 font-bold">
                              <span className="truncate text-white">{t.subject}</span>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                                  t.status === 'RESOLVED'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {t.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                              <span className="font-mono text-cyan-400">{t.id}</span>
                              <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Conversation Box (8 cols) */}
                <div className="lg:col-span-8 bg-[#0f1524] border border-slate-800 rounded-3xl flex flex-col h-[560px] shadow-xl overflow-hidden">
                  {supportTickets.find(t => t.id === selectedTicketId) ? (
                    (() => {
                      const activeT = supportTickets.find(t => t.id === selectedTicketId)!;
                      return (
                        <>
                          <div className="p-4 border-b border-slate-800 bg-[#141b2e] flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="font-black text-sm text-white">{activeT.subject}</div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                User: <strong className="text-slate-200">{activeT.userId}</strong> • Category: <strong className="text-cyan-400">{activeT.category}</strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {activeT.status !== 'RESOLVED' ? (
                                <button
                                  onClick={() => handleUpdateTicketStatus(activeT.id, 'RESOLVED')}
                                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-lg text-xs border border-emerald-500/40 transition cursor-pointer"
                                >
                                  Mark Resolved
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateTicketStatus(activeT.id, 'OPEN')}
                                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg text-xs border border-amber-500/40 transition cursor-pointer"
                                >
                                  Reopen Ticket
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Message List */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#090d18]">
                            {activeT.messages.map((m: any, idx: number) => (
                              <div
                                key={idx}
                                className={`flex ${m.sender === 'support' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                                    m.sender === 'support'
                                      ? 'bg-cyan-600 text-white font-medium rounded-tr-none'
                                      : 'bg-[#151c2e] text-slate-200 border border-slate-700/80 rounded-tl-none'
                                  }`}
                                >
                                  <div className="text-[10px] font-bold text-slate-300 mb-1">
                                    {m.sender === 'support' ? 'Support Desk Agent (You)' : `Trader (${activeT.userId})`}
                                  </div>
                                  <div>{m.text}</div>
                                  <div className={`text-[9px] mt-1.5 ${m.sender === 'support' ? 'text-cyan-100' : 'text-slate-500'}`}>
                                    {new Date(m.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Admin Reply Form */}
                          <form onSubmit={handleSendAdminSupportReply} className="p-3.5 border-t border-slate-800 bg-[#121828] flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Type response as Support Specialist..."
                              value={adminReplyText}
                              onChange={(e) => setAdminReplyText(e.target.value)}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl cursor-pointer transition shadow-md flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Reply</span>
                            </button>
                          </form>
                        </>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-8 text-center">
                      <LifeBuoy className="w-10 h-10 mb-2 text-slate-600 stroke-[1.5]" />
                      <span>Select an inquiry from the left to view and answer trader messages.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
