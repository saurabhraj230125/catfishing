import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { PlanTier, UserSubscription } from '@/types/pond';

const DEFAULT_FREE_SECONDS = 300; // 5 minutes daily allowance
const PRO_100_SECONDS = 6000; // 100 minutes

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetch or initialize a user's subscription record in Firestore users/{uid}.
 * Automatically refills daily 5 minutes for free tier if a new day has arrived.
 */
export async function getUserSubscription(
  uid: string,
  email?: string
): Promise<UserSubscription> {
  const localCacheKey = `__pond_sub_${uid}`;
  const today = getTodayDateString();

  // 1. Check local cache first for instant hydration
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(localCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.remainingSeconds === 'number') {
          // Instant daily 5-minute refill from local cache if date changed
          if (parsed.planTier === 'free' && parsed.lastDailyResetDate !== today) {
            parsed.remainingSeconds = DEFAULT_FREE_SECONDS;
            parsed.lastDailyResetDate = today;
            parsed.lastDailyResetAt = Date.now();
            localStorage.setItem(localCacheKey, JSON.stringify(parsed));
          }

          // Asynchronously revalidate with Firestore in background
          syncWithFirestore(uid, email).catch(() => {});
          return parsed as UserSubscription;
        }
      }
    } catch {}
  }

  return syncWithFirestore(uid, email);
}

async function syncWithFirestore(uid: string, email?: string): Promise<UserSubscription> {
  const localCacheKey = `__pond_sub_${uid}`;
  const today = getTodayDateString();

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const planTier: PlanTier = (data.planTier as PlanTier) || 'free';
      let remainingSeconds = typeof data.remainingSeconds === 'number' ? data.remainingSeconds : DEFAULT_FREE_SECONDS;
      let lastDailyResetDate = data.lastDailyResetDate || today;
      let lastDailyResetAt = data.lastDailyResetAt || Date.now();

      // AUTOMATIC DAILY 5-MINUTE REFILL FOR FREE TIER
      if (planTier === 'free' && data.lastDailyResetDate !== today) {
        remainingSeconds = DEFAULT_FREE_SECONDS;
        lastDailyResetDate = today;
        lastDailyResetAt = Date.now();

        setDoc(
          userDocRef,
          {
            remainingSeconds: DEFAULT_FREE_SECONDS,
            lastDailyResetDate: today,
            lastDailyResetAt: Date.now(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }

      const sub: UserSubscription = {
        uid,
        email: data.email || email || '',
        planTier,
        remainingSeconds,
        monthlyAllowanceSeconds: data.monthlyAllowanceSeconds || DEFAULT_FREE_SECONDS,
        lastDailyResetDate,
        lastDailyResetAt,
        planRenewsAt: data.planRenewsAt,
        createdAt: data.createdAt,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(localCacheKey, JSON.stringify(sub));
      }
      return sub;
    }

    // Initialize document if user is signing in for the first time
    const initialSub: UserSubscription = {
      uid,
      email: email || '',
      planTier: 'free',
      remainingSeconds: DEFAULT_FREE_SECONDS,
      monthlyAllowanceSeconds: DEFAULT_FREE_SECONDS,
      lastDailyResetDate: today,
      lastDailyResetAt: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, initialSub, { merge: true });

    if (typeof window !== 'undefined') {
      localStorage.setItem(localCacheKey, JSON.stringify({
        ...initialSub,
        createdAt: new Date().toISOString(),
      }));
    }

    return initialSub;
  } catch (error) {
    console.warn('Subscription fetch notice (using safe fallback):', error);
    // Safe offline fallback with daily reset check
    const fallbackSub: UserSubscription = {
      uid,
      email: email || '',
      planTier: 'free',
      remainingSeconds: DEFAULT_FREE_SECONDS,
      monthlyAllowanceSeconds: DEFAULT_FREE_SECONDS,
      lastDailyResetDate: today,
      lastDailyResetAt: Date.now(),
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(localCacheKey, JSON.stringify(fallbackSub));
      } catch {}
    }
    return fallbackSub;
  }
}

/**
 * Persist remaining chat seconds to Firestore and local cache.
 */
export async function saveUserRemainingSeconds(
  uid: string,
  remainingSeconds: number
): Promise<void> {
  const localCacheKey = `__pond_sub_${uid}`;

  // Update local cache immediately
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(localCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.remainingSeconds = remainingSeconds;
        localStorage.setItem(localCacheKey, JSON.stringify(parsed));
      }
    } catch {}
  }

  // Update Firestore
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        remainingSeconds,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.debug('Failed to sync remaining seconds to Firestore:', err);
  }
}

/**
 * Upgrade a user's subscription tier.
 */
export async function applyPlanUpgrade(
  uid: string,
  newTier: PlanTier
): Promise<UserSubscription> {
  const localCacheKey = `__pond_sub_${uid}`;

  let newSeconds = DEFAULT_FREE_SECONDS;
  let allowance = DEFAULT_FREE_SECONDS;

  if (newTier === 'pro_100') {
    newSeconds = PRO_100_SECONDS;
    allowance = PRO_100_SECONDS;
  } else if (newTier === 'unlimited') {
    newSeconds = -1; // -1 represents infinite time
    allowance = -1;
  }

  const oneMonthFromNow = new Date();
  oneMonthFromNow.setDate(oneMonthFromNow.getDate() + 30);

  const updatedFields = {
    planTier: newTier,
    remainingSeconds: newSeconds,
    monthlyAllowanceSeconds: allowance,
    planRenewsAt: Timestamp.fromDate(oneMonthFromNow),
    updatedAt: serverTimestamp(),
  };

  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, updatedFields, { merge: true });
  } catch (err) {
    console.warn('Firestore upgrade sync notice:', err);
  }

  const resultSub: UserSubscription = {
    uid,
    planTier: newTier,
    remainingSeconds: newSeconds,
    monthlyAllowanceSeconds: allowance,
    planRenewsAt: oneMonthFromNow.toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(localCacheKey, JSON.stringify(resultSub));
    } catch {}
  }

  return resultSub;
}
