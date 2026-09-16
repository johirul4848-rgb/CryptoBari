import { doc, setDoc, getDocs, collection, query, orderBy, limit, updateDoc } from 'firebase/firestore';
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
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'deposit_requests');
    return [];
  }
}

/**
 * Fetch all withdrawal requests directly from Firestore (for Admin or synchronization)
 */
export async function fetchWithdrawalsFromFirebase(): Promise<any[]> {
  try {
    const colRef = collection(db, 'withdrawal_requests');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
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
