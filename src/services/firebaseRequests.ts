import { doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface FirebaseDepositData {
  id: string;
  amount: number;
  currency?: string;
  method?: string;
  senderBinanceId: string;
  binanceId?: string;
  receiverBinanceId?: string;
  txHash?: string;
  promoCode?: string;
  bonusAmount?: number;
  totalCredited?: number;
  userName?: string;
  userEmail?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string | number;
}

export interface FirebaseWithdrawalData {
  id: string;
  amount: number;
  currency?: string;
  method?: string;
  address?: string;
  binanceId?: string;
  receiverBinanceId?: string;
  network?: string;
  userName?: string;
  userEmail?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string | number;
}

/**
 * Record a deposit request into Firestore collection 'deposit_requests'
 */
export async function recordDepositToFirebase(data: FirebaseDepositData): Promise<boolean> {
  try {
    const currentUid = auth.currentUser?.uid || `guest_${data.senderBinanceId || Math.random().toString(36).substring(2, 9)}`;
    const currentEmail = auth.currentUser?.email || data.userEmail || 'trader@cryptobari.com';
    const currentName = auth.currentUser?.displayName || data.userName || 'Trader';

    const cleanId = data.id.replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'deposit_requests', cleanId);

    const payload = {
      id: data.id,
      userId: currentUid,
      userName: currentName,
      userEmail: currentEmail,
      amount: Number(data.amount) || 0,
      currency: data.currency || 'USD',
      method: data.method || 'Binance Pay',
      senderBinanceId: data.senderBinanceId || data.binanceId || '',
      binanceId: data.binanceId || data.senderBinanceId || '',
      receiverBinanceId: data.receiverBinanceId || '794380283',
      txHash: data.txHash || `BPAY-${Date.now().toString(36).toUpperCase()}`,
      promoCode: data.promoCode || null,
      bonusAmount: Number(data.bonusAmount) || 0,
      totalCredited: Number(data.totalCredited) || Number(data.amount) || 0,
      status: data.status || 'PENDING',
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date(data.createdAt || Date.now()).toISOString(),
      updatedAt: new Date().toISOString(),
      storageProvider: 'FIRESTORE',
    };

    await setDoc(docRef, payload, { merge: true });

    // Also mirror to localStorage for instant local tab responsiveness
    try {
      const existingRaw = localStorage.getItem('cb_admin_shared_deposits');
      const list = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [payload, ...list.filter((x: any) => x.id !== payload.id)].slice(0, 100);
      localStorage.setItem('cb_admin_shared_deposits', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cb_deposits_updated', { detail: payload }));
    } catch {
      // ignore localstorage error
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `deposit_requests/${data.id}`);
    return false;
  }
}

/**
 * Record a withdrawal request into Firestore collection 'withdrawal_requests'
 */
export async function recordWithdrawalToFirebase(data: FirebaseWithdrawalData): Promise<boolean> {
  try {
    const targetBinanceId = data.receiverBinanceId || data.binanceId || data.address || '';
    const currentUid = auth.currentUser?.uid || `guest_${targetBinanceId || Math.random().toString(36).substring(2, 9)}`;
    const currentEmail = auth.currentUser?.email || data.userEmail || 'trader@cryptobari.com';
    const currentName = auth.currentUser?.displayName || data.userName || 'Trader';

    const cleanId = data.id.replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'withdrawal_requests', cleanId);

    const payload = {
      id: data.id,
      userId: currentUid,
      userName: currentName,
      userEmail: currentEmail,
      amount: Number(data.amount) || 0,
      currency: data.currency || 'USD',
      method: data.method || 'Binance Pay',
      address: targetBinanceId,
      binanceId: targetBinanceId,
      receiverBinanceId: targetBinanceId,
      network: data.network || 'Binance Pay UID Transfer',
      status: data.status || 'PENDING',
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date(data.createdAt || Date.now()).toISOString(),
      updatedAt: new Date().toISOString(),
      storageProvider: 'FIRESTORE',
    };

    await setDoc(docRef, payload, { merge: true });

    // Also mirror to localStorage for instant local tab responsiveness
    try {
      const existingRaw = localStorage.getItem('cb_admin_shared_withdrawals');
      const list = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [payload, ...list.filter((x: any) => x.id !== payload.id)].slice(0, 100);
      localStorage.setItem('cb_admin_shared_withdrawals', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cb_withdrawals_updated', { detail: payload }));
    } catch {
      // ignore localstorage error
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `withdrawal_requests/${data.id}`);
    return false;
  }
}

/**
 * Fetch all deposit requests directly from Firestore (for Admin or synchronization)
 */
export async function fetchDepositsFromFirebase(): Promise<any[]> {
  try {
    const colRef = collection(db, 'deposit_requests');
    let docs: any[] = [];
    try {
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(150));
      const snap = await getDocs(q);
      docs = snap.docs.map(d => d.data());
    } catch {
      // Fallback without ordering in case index or field sorting issues
      const snap = await getDocs(colRef);
      docs = snap.docs.map(d => d.data());
    }
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'deposit_requests');
    return [];
  }
}

/**
 * Subscribe to real-time deposit requests in Firestore
 */
export function subscribeDepositsFromFirebase(onUpdate: (deposits: any[]) => void): () => void {
  try {
    const colRef = collection(db, 'deposit_requests');
    const unsubscribe = onSnapshot(
      colRef,
      (snap) => {
        const docs = snap.docs.map((d) => d.data());
        onUpdate(docs);
      },
      (error) => {
        console.warn('Realtime deposit subscription notice:', error.message);
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Subscribe to real-time withdrawal requests in Firestore
 */
export function subscribeWithdrawalsFromFirebase(onUpdate: (withdrawals: any[]) => void): () => void {
  try {
    const colRef = collection(db, 'withdrawal_requests');
    const unsubscribe = onSnapshot(
      colRef,
      (snap) => {
        const docs = snap.docs.map((d) => d.data());
        onUpdate(docs);
      },
      (error) => {
        console.warn('Realtime withdrawal subscription notice:', error.message);
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Fetch all withdrawal requests directly from Firestore (for Admin or synchronization)
 */
export async function fetchWithdrawalsFromFirebase(): Promise<any[]> {
  try {
    const colRef = collection(db, 'withdrawal_requests');
    let docs: any[] = [];
    try {
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(150));
      const snap = await getDocs(q);
      docs = snap.docs.map(d => d.data());
    } catch {
      // Fallback without ordering in case index or field sorting issues
      const snap = await getDocs(colRef);
      docs = snap.docs.map(d => d.data());
    }
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'withdrawal_requests');
    return [];
  }
}

/**
 * Update request status in Firestore (e.g. APPROVED or REJECTED)
 */
export async function updateFirebaseRequestStatus(
  collectionName: 'deposit_requests' | 'withdrawal_requests',
  id: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
): Promise<boolean> {
  try {
    const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, collectionName, cleanId);
    await updateDoc(docRef, {
      status,
      reviewedAt: new Date().toISOString(),
      ...(reason ? { rejectedReason: reason } : {}),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    return false;
  }
}

/**
 * Approve a deposit request in Firebase Firestore and synchronize real-time crediting
 */
export async function approveDepositInFirebase(deposit: {
  id: string;
  amount: number;
  bonusAmount?: number;
  totalCredited?: number;
  userId?: string;
  userEmail?: string;
  userName?: string;
}): Promise<boolean> {
  try {
    const cleanId = deposit.id.replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'deposit_requests', cleanId);
    const amount = Number(deposit.amount) || 0;
    const bonusAmount = Number(deposit.bonusAmount) || 0;
    const totalCredited = Number(deposit.totalCredited) || (amount + bonusAmount);

    // 1. Update deposit request in Firestore
    await updateDoc(docRef, {
      status: 'APPROVED',
      reviewedAt: new Date().toISOString(),
      approvedAt: Date.now(),
      credited: true,
      amount,
      bonusAmount,
      totalCredited,
    }).catch(async () => {
      // In case doc needed merge or set
      await setDoc(docRef, {
        id: deposit.id,
        status: 'APPROVED',
        reviewedAt: new Date().toISOString(),
        approvedAt: Date.now(),
        credited: true,
        amount,
        bonusAmount,
        totalCredited,
        userEmail: deposit.userEmail || '',
        userId: deposit.userId || '',
      }, { merge: true });
    });

    // 2. If user document exists, increment live balance and bonus balance in Firestore
    if (deposit.userId && !deposit.userId.startsWith('guest_')) {
      try {
        const userDocRef = doc(db, 'users', deposit.userId);
        await updateDoc(userDocRef, {
          'wallet.liveBalance': increment(amount),
          'wallet.bonusBalance': increment(bonusAmount),
          'wallet.lastDepositApprovedAt': Date.now(),
        }).catch(() => {});
      } catch (err) {
        console.warn('Firestore user wallet increment note:', err);
      }
    }

    // 3. Mirror to localStorage for instant same-browser & tab-to-tab sync
    const approvalPayload = {
      id: deposit.id,
      amount,
      bonusAmount,
      totalCredited,
      userId: deposit.userId,
      userEmail: deposit.userEmail,
      userName: deposit.userName,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('cb_latest_approved_deposit', JSON.stringify(approvalPayload));

      const sharedRaw = localStorage.getItem('cb_admin_shared_deposits');
      if (sharedRaw) {
        const arr = JSON.parse(sharedRaw);
        const updated = arr.map((item: any) =>
          item.id === deposit.id
            ? { ...item, status: 'APPROVED', approvedAt: Date.now(), credited: true }
            : item
        );
        localStorage.setItem('cb_admin_shared_deposits', JSON.stringify(updated));
      }

      window.dispatchEvent(new CustomEvent('cb_deposit_approved', { detail: approvalPayload }));
      window.dispatchEvent(new CustomEvent('cb_deposits_updated'));
    } catch {
      // ignore
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `deposit_requests/${deposit.id}`);
    return false;
  }
}

/**
 * Persist user wallet state to Firestore user document so page refreshes never revert balance
 */
export async function syncUserWalletToFirebase(
  userId: string | undefined,
  walletUpdates: {
    liveBalance?: number;
    bonusBalance?: number;
    demoBalance?: number;
    lockedBalance?: number;
  }
): Promise<boolean> {
  try {
    const targetUid = userId || auth.currentUser?.uid;
    if (!targetUid || targetUid.startsWith('guest_')) {
      return false;
    }
    const userDocRef = doc(db, 'users', targetUid);
    const updates: Record<string, any> = {};
    if (typeof walletUpdates.liveBalance === 'number') {
      updates['wallet.liveBalance'] = walletUpdates.liveBalance;
    }
    if (typeof walletUpdates.bonusBalance === 'number') {
      updates['wallet.bonusBalance'] = walletUpdates.bonusBalance;
    }
    if (typeof walletUpdates.demoBalance === 'number') {
      updates['wallet.demoBalance'] = walletUpdates.demoBalance;
    }
    if (typeof walletUpdates.lockedBalance === 'number') {
      updates['wallet.lockedBalance'] = walletUpdates.lockedBalance;
    }
    updates['wallet.lastSyncedAt'] = Date.now();

    await updateDoc(userDocRef, updates).catch(async () => {
      await setDoc(userDocRef, { wallet: updates }, { merge: true });
    });
    return true;
  } catch (error) {
    console.warn('syncUserWalletToFirebase notice:', error);
    return false;
  }
}

/**
 * Approve a withdrawal request in Firebase Firestore and ensure balance remains deducted
 */
export async function approveWithdrawalInFirebase(withdrawal: {
  id: string;
  amount: number;
  userId?: string;
  userEmail?: string;
  userName?: string;
}): Promise<boolean> {
  try {
    const cleanId = withdrawal.id.replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'withdrawal_requests', cleanId);
    const amount = Number(withdrawal.amount) || 0;

    await updateDoc(docRef, {
      status: 'APPROVED',
      reviewedAt: new Date().toISOString(),
      processedAt: Date.now(),
      amount,
    }).catch(async () => {
      await setDoc(docRef, {
        id: withdrawal.id,
        status: 'APPROVED',
        reviewedAt: new Date().toISOString(),
        processedAt: Date.now(),
        amount,
        userEmail: withdrawal.userEmail || '',
        userId: withdrawal.userId || '',
      }, { merge: true });
    });

    // Wipe any bonus balance in user's profile document upon withdrawal approval
    if (withdrawal.userId && !withdrawal.userId.startsWith('guest_')) {
      const userRef = doc(db, 'users', withdrawal.userId);
      await updateDoc(userRef, {
        'wallet.bonusBalance': 0,
        'wallet.lastWithdrawalApprovedAt': Date.now(),
      }).catch(() => {});
    }

    // Wipe promotional bonus in local session if matching
    try {
      const rawWallet = localStorage.getItem('cb_user_wallet');
      if (rawWallet) {
        const parsed = JSON.parse(rawWallet);
        parsed.bonusBalance = 0;
        localStorage.setItem('cb_user_wallet', JSON.stringify(parsed));
      }
      localStorage.removeItem('cb_user_active_promo_bonus');
    } catch {}

    // Mirror to shared storage
    try {
      const sharedRaw = localStorage.getItem('cb_admin_shared_withdrawals');
      if (sharedRaw) {
        const arr = JSON.parse(sharedRaw);
        const updated = arr.map((item: any) =>
          item.id === withdrawal.id
            ? { ...item, status: 'APPROVED', processedAt: Date.now() }
            : item
        );
        localStorage.setItem('cb_admin_shared_withdrawals', JSON.stringify(updated));
      }
      window.dispatchEvent(new CustomEvent('cb_withdrawals_updated'));
    } catch {}

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `withdrawal_requests/${withdrawal.id}`);
    return false;
  }
}

/**
 * Reject a withdrawal request in Firebase Firestore and refund trader's real balance
 */
export async function rejectWithdrawalInFirebase(withdrawal: {
  id: string;
  amount: number;
  userId?: string;
  reason?: string;
}): Promise<boolean> {
  try {
    const cleanId = withdrawal.id.replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'withdrawal_requests', cleanId);
    const amount = Number(withdrawal.amount) || 0;

    await updateDoc(docRef, {
      status: 'REJECTED',
      reviewedAt: new Date().toISOString(),
      rejectedReason: withdrawal.reason || 'Verification requirement',
    });

    // Refund live balance in Firestore if userId exists
    if (withdrawal.userId && !withdrawal.userId.startsWith('guest_')) {
      try {
        const userDocRef = doc(db, 'users', withdrawal.userId);
        await updateDoc(userDocRef, {
          'wallet.liveBalance': increment(amount),
        });
      } catch (err) {
        console.warn('Refund Firestore update notice:', err);
      }
    }

    try {
      const sharedRaw = localStorage.getItem('cb_admin_shared_withdrawals');
      if (sharedRaw) {
        const arr = JSON.parse(sharedRaw);
        const updated = arr.map((item: any) =>
          item.id === withdrawal.id
            ? { ...item, status: 'REJECTED', rejectedReason: withdrawal.reason }
            : item
        );
        localStorage.setItem('cb_admin_shared_withdrawals', JSON.stringify(updated));
      }
      window.dispatchEvent(new CustomEvent('cb_withdrawals_updated'));
      window.dispatchEvent(
        new CustomEvent('cb_withdrawal_rejected', {
          detail: {
            id: withdrawal.id,
            amount,
            userId: withdrawal.userId,
            reason: withdrawal.reason || 'Verification requirement',
          },
        })
      );
    } catch {}

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `withdrawal_requests/${withdrawal.id}`);
    return false;
  }
}

/**
 * Real-time synchronization for Influencers & Referral Partners
 */
export function subscribeInfluencersFromFirebase(
  onUpdate: (influencers: any[]) => void
): () => void {
  try {
    const colRef = collection(db, 'influencers');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('Realtime influencers subscription notice:', error.message);
      }
    );
  } catch {
    return () => {};
  }
}

export async function saveInfluencerToFirebase(influencer: any): Promise<boolean> {
  try {
    const cleanId = String(influencer.id || influencer.userId).replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'influencers', cleanId);
    await setDoc(docRef, { ...influencer, updatedAt: new Date().toISOString() }, { merge: true });

    // Also register promo code entry
    if (influencer.promoCode) {
      const codeClean = influencer.promoCode.trim().toUpperCase().replace(/[^a-zA-Z0-9_-]/g, '');
      const codeDocRef = doc(db, 'promo_codes', codeClean);
      await setDoc(
        codeDocRef,
        {
          code: influencer.promoCode.toUpperCase(),
          influencerId: influencer.id,
          influencerName: influencer.name,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `influencers/${influencer.id}`);
    return false;
  }
}

/**
 * Real-time synchronization for System Notices & News
 */
export function subscribeNoticesFromFirebase(
  onUpdate: (notices: any[]) => void
): () => void {
  try {
    const colRef = collection(db, 'notices');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('Realtime notices subscription notice:', error.message);
      }
    );
  } catch {
    return () => {};
  }
}

export async function saveNoticeToFirebase(notice: any): Promise<boolean> {
  try {
    const cleanId = String(notice.id).replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'notices', cleanId);
    await setDoc(docRef, { ...notice, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `notices/${notice.id}`);
    return false;
  }
}

export async function deleteNoticeFromFirebase(id: string): Promise<boolean> {
  try {
    const cleanId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'notices', cleanId);
    await setDoc(docRef, { active: false, deleted: true, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function fetchNoticesFromFirebase(): Promise<any[]> {
  try {
    const colRef = collection(db, 'notices');
    const snap = await getDocs(colRef);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list
      .filter((n: any) => n.active !== false && !n.deleted)
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'notices');
    return [];
  }
}

/**
 * Real-time synchronization for 24/7 Live Support Tickets & Messages
 */
export function subscribeSupportTicketsFromFirebase(
  onUpdate: (tickets: any[]) => void
): () => void {
  try {
    const colRef = collection(db, 'support_tickets');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('Realtime support tickets subscription notice:', error.message);
      }
    );
  } catch {
    return () => {};
  }
}

export async function fetchSupportTicketsFromFirebase(): Promise<any[]> {
  try {
    const colRef = collection(db, 'support_tickets');
    const snap = await getDocs(colRef);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'support_tickets');
    return [];
  }
}

export async function saveSupportTicketToFirebase(ticket: any): Promise<boolean> {
  try {
    const cleanId = String(ticket.id).replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'support_tickets', cleanId);
    await setDoc(docRef, { ...ticket, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `support_tickets/${ticket.id}`);
    return false;
  }
}

export async function addMessageToTicketInFirebase(ticketId: string, message: any): Promise<boolean> {
  try {
    const cleanId = String(ticketId).replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'support_tickets', cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const existing = snap.data();
      const messages = Array.isArray(existing.messages) ? existing.messages : [];
      messages.push(message);
      await setDoc(docRef, { messages, updatedAt: new Date().toISOString() }, { merge: true });
    } else {
      await setDoc(docRef, {
        id: ticketId,
        messages: [message],
        status: 'OPEN',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `support_tickets/${ticketId}/messages`);
    return false;
  }
}

export async function updateTicketStatusInFirebase(ticketId: string, status: string): Promise<boolean> {
  try {
    const cleanId = String(ticketId).replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'support_tickets', cleanId);
    await setDoc(docRef, { status, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `support_tickets/${ticketId}`);
    return false;
  }
}

/**
 * Binance Gateway QR Code and Pay Settings stored persistently in Firestore 'system_settings/binance_gateway'
 */
export async function saveBinanceGatewaySettingsToFirebase(settings: {
  binanceId: string;
  merchantName?: string;
  qrCodeUrl?: string;
  qrImage?: string;
  notes?: string;
  instructions?: string;
}): Promise<boolean> {
  try {
    const docRef = doc(db, 'system_settings', 'binance_gateway');
    const payload = {
      binanceId: settings.binanceId || '794380283',
      merchantName: settings.merchantName || 'CryptoBari',
      qrCodeUrl: settings.qrCodeUrl || settings.qrImage || '',
      qrImage: settings.qrImage || settings.qrCodeUrl || '',
      notes: settings.notes || settings.instructions || 'Official verified Binance Pay Receiver for CryptoBari Trading Platform.',
      instructions: settings.instructions || settings.notes || 'Official verified Binance Pay Receiver for CryptoBari Trading Platform.',
      updatedAt: Date.now(),
    };
    await setDoc(docRef, payload, { merge: true });
    try {
      localStorage.setItem('cb_binance_gateway_settings', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('cb_gateway_updated', { detail: payload }));
    } catch {}
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_settings/binance_gateway');
    return false;
  }
}

export async function fetchBinanceGatewaySettingsFromFirebase(): Promise<any> {
  try {
    const docRef = doc(db, 'system_settings', 'binance_gateway');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      try {
        localStorage.setItem('cb_binance_gateway_settings', JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (error) {
    console.warn('fetchBinanceGatewaySettingsFromFirebase notice:', error);
  }
  try {
    const raw = localStorage.getItem('cb_binance_gateway_settings');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function subscribeBinanceGatewaySettingsFromFirebase(
  onUpdate: (settings: any) => void
): () => void {
  try {
    const docRef = doc(db, 'system_settings', 'binance_gateway');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        try {
          localStorage.setItem('cb_binance_gateway_settings', JSON.stringify(data));
        } catch {}
        onUpdate(data);
      }
    }, (err) => console.warn('subscribeBinanceGatewaySettings error:', err));
  } catch {
    return () => {};
  }
}

/**
 * Fetch all registered users & trader profiles across Firestore collections
 */
export async function fetchAllUsersFromFirebase(): Promise<any[]> {
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    const usersMap = new Map<string, any>();

    snap.forEach((d) => {
      const data = d.data();
      const email = data.email || `${d.id}@cryptobari.com`;
      usersMap.set(email.toLowerCase(), {
        id: d.id,
        name: data.displayName || data.name || email.split('@')[0],
        email,
        country: data.country || 'International',
        role: data.role || (email.toLowerCase() === 'johirul4848@gmail.com' ? 'ADMIN' : 'USER'),
        kycStatus: data.kycStatus || 'VERIFIED',
        liveBalance: typeof data.wallet?.liveBalance === 'number' ? data.wallet.liveBalance : 0,
        demoBalance: typeof data.wallet?.demoBalance === 'number' ? data.wallet.demoBalance : 10000,
        status: data.status || 'ACTIVE',
        totalDeposited: typeof data.totalDeposited === 'number' ? data.totalDeposited : 0,
        totalWithdrawn: typeof data.totalWithdrawn === 'number' ? data.totalWithdrawn : 0,
        registeredAt: data.createdAt || Date.now(),
      });
    });

    // Also scan deposit requests to include depositors who registered
    try {
      const depSnap = await getDocs(collection(db, 'deposit_requests'));
      depSnap.forEach((d) => {
        const data = d.data();
        if (data.userEmail) {
          const key = data.userEmail.toLowerCase();
          if (!usersMap.has(key)) {
            usersMap.set(key, {
              id: data.userId || `usr_${data.userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
              name: data.userName || data.userEmail.split('@')[0],
              email: data.userEmail,
              country: 'International',
              role: 'USER',
              kycStatus: 'VERIFIED',
              liveBalance: data.status === 'APPROVED' ? Number(data.amount) || 0 : 0,
              demoBalance: 10000,
              status: 'ACTIVE',
              totalDeposited: data.status === 'APPROVED' ? Number(data.amount) || 0 : 0,
              totalWithdrawn: 0,
              registeredAt: new Date(data.createdAt || Date.now()).getTime(),
            });
          } else {
            const existing = usersMap.get(key);
            if (data.status === 'APPROVED') {
              existing.totalDeposited = (existing.totalDeposited || 0) + (Number(data.amount) || 0);
            }
          }
        }
      });
    } catch {}

    return Array.from(usersMap.values());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

export async function saveUserToFirebase(user: any): Promise<boolean> {
  try {
    const cleanId = String(user.id || (user.email ? user.email.replace(/[^a-zA-Z0-9_-]/g, '_') : 'usr_' + Date.now()));
    const userRef = doc(db, 'users', cleanId);
    await setDoc(userRef, {
      ...user,
      updatedAt: Date.now(),
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.id || 'new'}`);
    return false;
  }
}

/**
 * Record an influencer withdrawal request to Firestore 'influencer_withdrawals'
 * and sync across local storage and broadcast events for the Admin Panel
 */
export async function recordInfluencerWithdrawalToFirebase(data: {
  id: string;
  influencerId: string;
  influencerName?: string;
  userId?: string;
  binanceId: string;
  amount: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: number | string;
}): Promise<boolean> {
  try {
    const cleanId = String(data.id).replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'influencer_withdrawals', cleanId);

    const payload = {
      id: data.id,
      influencerId: data.influencerId,
      influencerName: data.influencerName || 'Influencer Partner',
      userId: data.userId || data.influencerId,
      binanceId: data.binanceId.trim(),
      amount: Number(data.amount) || 0,
      status: data.status || 'PENDING',
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      createdAtIso: new Date(typeof data.createdAt === 'number' ? data.createdAt : Date.now()).toISOString(),
      updatedAt: new Date().toISOString(),
      storageProvider: 'FIRESTORE',
    };

    await setDoc(docRef, payload, { merge: true });

    // Sync to shared storage keys so all tabs & admin view update synchronously
    try {
      const keys = ['cb_admin_shared_influencer_withdrawals', 'cb_influencer_withdrawals_v1'];
      keys.forEach((key) => {
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        const filtered = Array.isArray(list) ? list.filter((x: any) => x.id !== payload.id) : [];
        filtered.unshift(payload);
        localStorage.setItem(key, JSON.stringify(filtered.slice(0, 100)));
      });
      window.dispatchEvent(new CustomEvent('cb_influencer_withdrawals_updated', { detail: payload }));
    } catch {}

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `influencer_withdrawals/${data.id}`);
    return false;
  }
}

/**
 * Subscribe to real-time influencer withdrawal requests in Firestore
 */
export function subscribeInfluencerWithdrawalsFromFirebase(
  onUpdate: (withdrawals: any[]) => void
): () => void {
  try {
    const colRef = collection(db, 'influencer_withdrawals');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        list.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        onUpdate(list);
      },
      (error) => {
        console.warn('Realtime influencer withdrawals subscription notice:', error.message);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Fetch all influencer withdrawal requests from Firestore
 */
export async function fetchInfluencerWithdrawalsFromFirebase(): Promise<any[]> {
  try {
    const colRef = collection(db, 'influencer_withdrawals');
    const snap = await getDocs(colRef);
    const list: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return list.sort((a: any, b: any) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'influencer_withdrawals');
    return [];
  }
}

/**
 * Approve influencer withdrawal request in Firestore
 */
export async function approveInfluencerWithdrawalInFirebase(id: string): Promise<boolean> {
  try {
    const cleanId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'influencer_withdrawals', cleanId);
    const now = Date.now();
    await updateDoc(docRef, {
      status: 'APPROVED',
      processedAt: now,
      updatedAt: new Date().toISOString(),
    }).catch(async () => {
      await setDoc(docRef, { id, status: 'APPROVED', processedAt: now }, { merge: true });
    });

    try {
      const keys = ['cb_admin_shared_influencer_withdrawals', 'cb_influencer_withdrawals_v1'];
      keys.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const updated = list.map((item: any) =>
              item.id === id ? { ...item, status: 'APPROVED', processedAt: now } : item
            );
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      });
      window.dispatchEvent(new CustomEvent('cb_influencer_withdrawals_updated', { detail: { id, status: 'APPROVED' } }));
    } catch {}

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `influencer_withdrawals/${id}`);
    return false;
  }
}

/**
 * Reject influencer withdrawal request in Firestore
 */
export async function rejectInfluencerWithdrawalInFirebase(id: string, reason?: string): Promise<boolean> {
  try {
    const cleanId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
    const docRef = doc(db, 'influencer_withdrawals', cleanId);
    const now = Date.now();
    await updateDoc(docRef, {
      status: 'REJECTED',
      rejectedReason: reason || 'Binance Pay ID unverified or compliance check',
      processedAt: now,
      updatedAt: new Date().toISOString(),
    }).catch(async () => {
      await setDoc(docRef, {
        id,
        status: 'REJECTED',
        rejectedReason: reason || 'Binance Pay ID unverified or compliance check',
        processedAt: now,
      }, { merge: true });
    });

    try {
      const keys = ['cb_admin_shared_influencer_withdrawals', 'cb_influencer_withdrawals_v1'];
      keys.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const updated = list.map((item: any) =>
              item.id === id ? { ...item, status: 'REJECTED', rejectedReason: reason, processedAt: now } : item
            );
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      });
      window.dispatchEvent(new CustomEvent('cb_influencer_withdrawals_updated', { detail: { id, status: 'REJECTED', reason } }));
    } catch {}

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `influencer_withdrawals/${id}`);
    return false;
  }
}




