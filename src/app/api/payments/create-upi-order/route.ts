import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '@/lib/firebase';
import { PendingUpiOrder } from '@/types/pond';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, userEmail, planTier } = body;

    if (!uid || (planTier !== 'pro_100' && planTier !== 'unlimited')) {
      return NextResponse.json(
        { ok: false, error: 'Invalid user or plan tier' },
        { status: 400 }
      );
    }

    const baseAmount = planTier === 'pro_100' ? 99 : 249;
    const upiId = process.env.NEXT_PUBLIC_UPI_ID || '6306814355@ptsbi';
    const merchantName = process.env.NEXT_PUBLIC_UPI_MERCHANT_NAME || 'Catfisher Pond';
    const isMerchant = process.env.NEXT_PUBLIC_UPI_IS_MERCHANT === 'true';

    // Collect currently reserved amounts for pending active orders (single-field query, 0 index needed)
    const reservedAmounts = new Set<number>();
    const now = Date.now();

    if (isLiveFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'pending_upi_orders'),
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const data = d.data();
          if (data && typeof data.expiresAt === 'number' && data.expiresAt > now) {
            if (typeof data.exactAmount === 'number') {
              // Store as rounded integer cents to avoid floating point issues
              reservedAmounts.add(Math.round(data.exactAmount * 100));
            }
          }
        });
      } catch (err: any) {
        console.warn('Error reading pending orders, generating fresh paise offset:', err);
      }
    }

    // Pick a unique unused decimal suffix between .01 and .99
    let chosenPaise = Math.floor(Math.random() * 99) + 1;
    let exactAmount = Number((baseAmount + chosenPaise / 100).toFixed(2));
    let roundedCents = Math.round(exactAmount * 100);

    // If collision with active pending order in the last 15 minutes, find next open slot
    let attempts = 0;
    while (reservedAmounts.has(roundedCents) && attempts < 100) {
      chosenPaise = (chosenPaise % 99) + 1;
      exactAmount = Number((baseAmount + chosenPaise / 100).toFixed(2));
      roundedCents = Math.round(exactAmount * 100);
      attempts++;
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderCode = `CAT_${Date.now().toString(36).toUpperCase()}_${randomSuffix}`;
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes window

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
    
    // Block-free UPI URI for personal UPI accounts (NO &am= and NO &tn= so GPay/PhonePe/Paytm never block scan!)
    const blockFreeUpiUri = `upi://pay?pa=${upiId}&pn=${encodedMerchant}&cu=INR`;
    
    // Merchant UPI URI with amount & transaction note (if merchant account verified)
    const merchantUpiUri = `upi://pay?pa=${upiId}&pn=${encodedMerchant}&am=${exactAmount.toFixed(2)}&cu=INR&tn=${orderCode}`;
    
    // Active URI based on config
    const upiUri = isMerchant ? merchantUpiUri : blockFreeUpiUri;

    return NextResponse.json({
      ok: true,
      orderCode,
      exactAmount,
      baseAmount,
      upiId,
      upiUri,
      blockFreeUpiUri,
      merchantUpiUri,
      isMerchant,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Create UPI order error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to create UPI order' },
      { status: 500 }
    );
  }
}
