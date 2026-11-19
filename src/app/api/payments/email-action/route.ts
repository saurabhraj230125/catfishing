import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '@/lib/firebase';
import { PaymentRequest } from '@/types/pond';

export const dynamic = 'force-dynamic';

function renderHtmlResponse(title: string, message: string, isSuccess: boolean, utr: string, planTier?: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title} | Catfisher Admin</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #E0F7FA;
            margin: 0;
            padding: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            box-sizing: border-box;
          }
          .card {
            background: #FFFFFF;
            border: 2px solid #0F172A;
            border-radius: 28px;
            max-width: 440px;
            width: 100%;
            padding: 32px 24px;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0, 131, 143, 0.2);
          }
          .icon {
            width: 68px;
            height: 68px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-bottom: 16px;
            background: ${isSuccess ? '#ECFDF5' : '#FFF1F2'};
            border: 2px solid ${isSuccess ? '#10B981' : '#F43F5E'};
          }
          h1 {
            font-size: 22px;
            font-weight: 900;
            margin: 0 0 10px 0;
            color: #0F172A;
          }
          p {
            font-size: 14px;
            color: #475569;
            line-height: 1.5;
            margin: 0 0 20px 0;
          }
          .details {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            padding: 14px;
            font-size: 13px;
            font-family: monospace;
            font-weight: 700;
            color: #0F172A;
            margin-bottom: 24px;
          }
          .btn {
            display: inline-block;
            background: #0F172A;
            color: #FFFFFF;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 14px;
            font-weight: 800;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${isSuccess ? '✅' : '❌'}</div>
          <h1>${title}</h1>
          <p>${message}</p>
          <div class="details">
            <div>UTR: ${utr}</div>
            ${planTier ? `<div style="margin-top: 4px; color: #0284C7;">Plan: ${planTier === 'pro_100' ? '₹99 (100 Mins)' : '₹249 (Unlimited)'}</div>` : ''}
          </div>
          <a href="/admin/payments" class="btn">Open Admin Dashboard →</a>
        </div>
      </body>
    </html>
  `;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const utr = searchParams.get('utr')?.trim() || '';
  const action = searchParams.get('action')?.trim();
  const token = searchParams.get('token')?.trim() || '';

  if (!utr || !action || !token || (action !== 'approve' && action !== 'reject')) {
    return new NextResponse(
      renderHtmlResponse('Invalid Action Request', 'Missing or malformed parameters.', false, utr || 'N/A'),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // 1. Verify cryptographic HMAC signature
  const secret = process.env.ADMIN_ACTION_SECRET || 'catfisher_secret_admin_token_key_2026';
  const expectedToken = crypto.createHmac('sha256', secret).update(`${utr}:${action}`).digest('hex');

  const tokenBuffer = Buffer.from(token, 'hex');
  const expectedBuffer = Buffer.from(expectedToken, 'hex');

  if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    return new NextResponse(
      renderHtmlResponse('Security Verification Failed', 'The 1-click token is invalid or has expired.', false, utr),
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!isLiveFirebaseConfigured) {
    return new NextResponse(
      renderHtmlResponse('Action Simulated', `Action ${action.toUpperCase()} processed in test environment.`, true, utr),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const reqRef = doc(db, 'payment_requests', utr);
    const snap = await getDoc(reqRef);

    if (!snap.exists()) {
      return new NextResponse(
        renderHtmlResponse('Payment Record Not Found', `No pending payment request found for UTR #${utr}.`, false, utr),
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const data = snap.data() as PaymentRequest;

    // Check if already finalized
    if (data.status === 'approved') {
      return new NextResponse(
        renderHtmlResponse('Already Approved', `This payment request was already approved and credited previously.`, true, utr, data.planTier),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (data.status === 'rejected') {
      return new NextResponse(
        renderHtmlResponse('Already Rejected', `This payment request was already rejected previously.`, false, utr, data.planTier),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const now = Date.now();

    if (action === 'approve') {
      // 1. Update payment request in Firestore
      await updateDoc(reqRef, {
        status: 'approved',
        reviewedAt: now,
      });

      // 2. Unlock plan on users/{uid}
      const userRef = doc(db, 'users', data.uid);
      const secondsUnlocked = data.planTier === 'pro_100' ? 6000 : -1;
      const renewsAt = now + 30 * 24 * 60 * 60 * 1000;

      await updateDoc(userRef, {
        planTier: data.planTier,
        remainingSeconds: secondsUnlocked,
        monthlyAllowanceSeconds: secondsUnlocked,
        planRenewsAt: renewsAt,
        pendingPaymentUtr: null,
        updatedAt: now,
      });

      return new NextResponse(
        renderHtmlResponse(
          'Payment Approved! 🎉',
          `Plan ${data.planTier === 'pro_100' ? '100 Minutes (₹99)' : 'Unlimited (₹249)'} has been unlocked immediately for user ${data.userEmail || data.uid}.`,
          true,
          utr,
          data.planTier
        ),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    } else {
      // action === 'reject'
      await updateDoc(reqRef, {
        status: 'rejected',
        reviewedAt: now,
      });

      const userRef = doc(db, 'users', data.uid);
      await updateDoc(userRef, {
        pendingPaymentUtr: null,
        lastRejectedUtr: utr,
        updatedAt: now,
      });

      return new NextResponse(
        renderHtmlResponse(
          'Payment Rejected',
          `UTR #${utr} has been marked rejected. The user has been notified to re-verify their reference number.`,
          false,
          utr,
          data.planTier
        ),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }
  } catch (error: any) {
    console.error('Email action execution error:', error);
    return new NextResponse(
      renderHtmlResponse('Processing Error', error?.message || 'Failed to update payment status in database.', false, utr),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

