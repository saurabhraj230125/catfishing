import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '@/lib/firebase';
import { PendingUpiOrder } from '@/types/pond';

export async function POST(req: NextRequest) {
  try {
    const secretHeader = req.headers.get('x-webhook-secret');
    const expectedSecret = process.env.UPI_WEBHOOK_SECRET;

    if (!expectedSecret || secretHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized webhook request' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const notificationText: string = body.notificationText || '';
    const appName: string = body.appName || '';

    if (!notificationText) {
      return NextResponse.json(
        { error: 'Missing notificationText' },
        { status: 400 }
      );
    }

    // 1. Reject outgoing/debit alerts
    const isDebit = /\b(debited|paid to|sent to|withdrawn|spent)\b/i.test(notificationText);
    const isCredit = /\b(credited|received|added|deposited)\b/i.test(notificationText);

    if (isDebit && !isCredit) {
      return NextResponse.json(
        { error: 'Ignored debit or outgoing alert' },
        { status: 200 }
      );
    }

    // 2. Extract exact Rupee + Paise amount (supports Paytm, Paytm Business, SBI SMS)
    const amountMatch = notificationText.match(/(?:rs\.?|inr|₹)\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
    if (!amountMatch) {
      return NextResponse.json(
        { error: 'No monetary amount detected in notification' },
        { status: 200 }
      );
    }

    const parsedAmount = parseFloat(amountMatch[1]);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount parsed' },
        { status: 200 }
      );
    }

    // 3. Extract 12-digit UTR if present
    const utrMatch = notificationText.match(/\b(\d{12})\b/);
    const detectedUtr = utrMatch ? utrMatch[1] : undefined;

    if (!isLiveFirebaseConfigured) {
      return NextResponse.json({
        ok: true,
        amount: parsedAmount,
        detectedUtr,
        note: 'Firebase not configured in live setting',
      });
    }

    // 4. Query pending order with matching exactAmount
    const now = Date.now();
    const ordersCol = collection(db, 'pending_upi_orders');
    const q = query(
      ordersCol,
      where('status', '==', 'pending'),
      where('exactAmount', '==', parsedAmount),
      where('expiresAt', '>', now)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({
        ok: false,
        message: `No active pending order found for exact amount ₹${parsedAmount}`,
        parsedAmount,
        detectedUtr,
      });
    }

    // Take the oldest active matching pending order
    const matchedDoc = snapshot.docs[0];
    const orderData = matchedDoc.data() as PendingUpiOrder;

    const batch = writeBatch(db);

    // Atomically update order to paid
    batch.update(matchedDoc.ref, {
      status: 'paid',
      paidAt: now,
      detectedUtr: detectedUtr || null,
      rawNotification: notificationText,
      appName: appName || null,
    });

    // Atomically upgrade user in users/{uid}
    const userRef = doc(db, 'users', orderData.uid);
    const secondsUnlocked = orderData.planTier === 'pro_100' ? 6000 : -1;
    const renewsAt = now + 30 * 24 * 60 * 60 * 1000;

    batch.set(
      userRef,
      {
        uid: orderData.uid,
        email: orderData.userEmail || null,
        planTier: orderData.planTier,
        remainingSeconds: secondsUnlocked,
        monthlyAllowanceSeconds: secondsUnlocked,
        planRenewsAt: renewsAt,
        updatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();

    return NextResponse.json({
      ok: true,
      matchedOrder: orderData.orderCode,
      unlockedUid: orderData.uid,
      planTier: orderData.planTier,
      amount: parsedAmount,
      detectedUtr,
    });
  } catch (error: any) {
    console.error('UPI webhook processing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

