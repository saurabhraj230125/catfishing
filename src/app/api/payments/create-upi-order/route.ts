import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '@/lib/firebase';
import { PendingUpiOrder } from '@/types/pond';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, userEmail, planTier } = body;

    if (!uid || (planTier !== 'pro_100' && planTier !== 'unlimited')) {
      return NextResponse.json(
        { error: 'Invalid user or plan tier' },
        { status: 400 }
      );
    }

    const baseAmount = planTier === 'pro_100' ? 99 : 249;
    const upiId = process.env.NEXT_PUBLIC_UPI_ID || '6306814355@ptsbi';
    const merchantName = process.env.NEXT_PUBLIC_UPI_MERCHANT_NAME || 'Catfisher Pond';

    // Collect currently reserved amounts for pending active orders
    const reservedAmounts = new Set<number>();
    const now = Date.now();

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'pending_upi_orders'),
          where('status', '==', 'pending'),
          where('expiresAt', '>', now)
        );
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const data = d.data();
          if (typeof data.exactAmount === 'number') {
            reservedAmounts.add(data.exactAmount);
          }
        });
      } catch (err) {
        console.warn('Error reading pending orders, generating fresh paise offset:', err);
      }
    }

    // Pick a random unique paise suffix between .01 and .99
    let chosenPaise = Math.floor(Math.random() * 99) + 1;
    let exactAmount = Number((baseAmount + chosenPaise / 100).toFixed(2));

    // If collision with active pending order, find next open slot
    let attempts = 0;
    while (reservedAmounts.has(exactAmount) && attempts < 100) {
      chosenPaise = (chosenPaise % 99) + 1;
      exactAmount = Number((baseAmount + chosenPaise / 100).toFixed(2));
      attempts++;
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderCode = `CAT_${Date.now().toString(36).toUpperCase()}_${randomSuffix}`;
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes window

    const orderData: PendingUpiOrder = {
      orderCode,
      uid,
      userEmail: userEmail || undefined,
      planTier,
      baseAmount,
      exactAmount,
      status: 'pending',
      createdAt: now,
      expiresAt,
    };

    if (isLiveFirebaseConfigured) {
      const orderDocRef = doc(db, 'pending_upi_orders', orderCode);
      await setDoc(orderDocRef, orderData);
    }

    const encodedMerchant = encodeURIComponent(merchantName);
    const upiUri = `upi://pay?pa=${upiId}&pn=${encodedMerchant}&am=${exactAmount.toFixed(2)}&cu=INR&tn=${orderCode}`;

    return NextResponse.json({
      ok: true,
      orderCode,
      exactAmount,
      baseAmount,
      upiId,
      upiUri,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Create UPI order error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create UPI order' },
      { status: 500 }
    );
  }
}

