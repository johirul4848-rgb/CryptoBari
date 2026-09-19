import { doc, setDoc, getDocs, collection, query, orderBy, limit, updateDoc, onSnapshot, increment } from 'firebase/firestore';
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
    } catch {}

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `withdrawal_requests/${withdrawal.id}`);
    return false;
  }
}
