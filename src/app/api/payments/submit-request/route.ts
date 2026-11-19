import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '@/lib/firebase';
import { PaymentRequest } from '@/types/pond';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, userEmail, payerName, planTier, amount, utr } = body;

    const cleanUtr = typeof utr === 'string' ? utr.trim().replace(/\s+/g, '') : '';
    if (!cleanUtr || !/^\d{12}$/.test(cleanUtr)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid UTR format. Must be exactly 12 numeric digits.' },
        { status: 400 }
      );
    }

    if (!uid || (planTier !== 'pro_100' && planTier !== 'unlimited')) {
      return NextResponse.json(
        { ok: false, error: 'Invalid plan selected or missing user authentication.' },
        { status: 400 }
      );
    }

    const verifiedAmount = planTier === 'pro_100' ? 99 : 249;
    const planName = planTier === 'pro_100' ? '100 Minutes (Chai & Chill)' : 'Unlimited (Asli Catfisher Pass)';
    const now = Date.now();

    // 1. Check if UTR already submitted in Firestore (block duplicate reuse)
    if (isLiveFirebaseConfigured) {
      const reqRef = doc(db, 'payment_requests', cleanUtr);
      const existingSnap = await getDoc(reqRef);
      if (existingSnap.exists()) {
        const data = existingSnap.data();
        if (data.status === 'approved') {
          return NextResponse.json(
            { ok: false, error: 'This 12-digit UTR has already been approved and credited.' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { ok: false, error: 'This 12-digit UTR has already been submitted and is currently being verified.' },
          { status: 409 }
        );
      }

      // 2. Write new pending payment request
      const requestData: PaymentRequest = {
        utr: cleanUtr,
        uid,
        userEmail: userEmail || undefined,
        payerName: payerName ? String(payerName).trim() : undefined,
        planTier,
        amount: verifiedAmount,
        status: 'pending',
        createdAt: now,
      };

      await setDoc(reqRef, requestData);

      // Also set pendingPaymentUtr on the user's profile
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { pendingPaymentUtr: cleanUtr, updatedAt: now }, { merge: true });
    }

    // 3. Generate HMAC-SHA256 signed 1-click Approve & Reject tokens
    const secret = process.env.ADMIN_ACTION_SECRET || 'catfisher_secret_admin_token_key_2026';
    const approveToken = crypto.createHmac('sha256', secret).update(`${cleanUtr}:approve`).digest('hex');
    const rejectToken = crypto.createHmac('sha256', secret).update(`${cleanUtr}:reject`).digest('hex');

    const rawHost = req.headers.get('host') || 'catfisher.vercel.app';
    const protocol = req.headers.get('x-forwarded-proto') || (rawHost.includes('localhost') ? 'http' : 'https');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${rawHost}`;

    const approveUrl = `${baseUrl}/api/payments/email-action?utr=${cleanUtr}&action=approve&token=${approveToken}`;
    const rejectUrl = `${baseUrl}/api/payments/email-action?utr=${cleanUtr}&action=reject&token=${rejectToken}`;
    const dashboardUrl = `${baseUrl}/admin/payments`;

    // 4. Send Instant Admin Email via Nodemailer (Gmail SMTP)
    const gmailUser = process.env.ADMIN_GMAIL_USER;
    const gmailPass = process.env.ADMIN_GMAIL_APP_PASSWORD;
    const adminRecipient = process.env.ADMIN_NOTIFICATION_EMAIL || gmailUser || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'saurabhraj230125@gmail.com';

    if (gmailUser && gmailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
        });

        const istTime = new Date(now).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #0F172A;">
              <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 2px solid #0F172A; border-radius: 24px; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
                <div style="display: inline-block; padding: 4px 12px; background: #E0F7FA; border-radius: 9999px; font-size: 11px; font-weight: 800; color: #006064; text-transform: uppercase; letter-spacing: 0.5px;">
                  Catfisher Direct UPI Alert 🎣
                </div>
                <h1 style="font-size: 24px; font-weight: 900; margin: 12px 0 6px 0; color: #0F172A;">
                  New ₹${verifiedAmount} Payment Received!
                </h1>
                <p style="font-size: 13px; color: #64748B; margin: 0 0 20px 0;">
                  User has submitted their 12-digit UPI reference number. Verify in your bank statement and click below to instantly unlock their plan.
                </p>

                <div style="background: #F1F5F9; border-radius: 16px; padding: 18px; margin-bottom: 24px; font-size: 13px; line-height: 1.6;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748B; font-weight: 600;">Plan:</span>
                    <strong style="color: #0F172A;">${planName}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748B; font-weight: 600;">Amount:</span>
                    <strong style="color: #059669; font-size: 16px;">₹${verifiedAmount}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748B; font-weight: 600;">12-Digit UTR:</span>
                    <code style="background: #FFFFFF; border: 1px solid #CBD5E1; padding: 2px 8px; border-radius: 6px; font-weight: 800; font-family: monospace; font-size: 14px; color: #0F172A;">${cleanUtr}</code>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748B; font-weight: 600;">Payer Name:</span>
                    <strong style="color: #0F172A;">${payerName || 'Not specified'}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748B; font-weight: 600;">User Google Email:</span>
                    <span style="color: #0F172A;">${userEmail || 'N/A'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #64748B; font-weight: 600;">Timestamp (IST):</span>
                    <span style="color: #64748B;">${istTime}</span>
                  </div>
                </div>

                <!-- 1-Click Action Buttons -->
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${approveUrl}" style="display: block; width: 100%; box-sizing: border-box; background: #059669; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 20px; border-radius: 14px; margin-bottom: 10px; text-align: center;">
                    ✅ APPROVE & UNLOCK PLAN
                  </a>
                  <a href="${rejectUrl}" style="display: block; width: 100%; box-sizing: border-box; background: #E11D48; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 20px; border-radius: 14px; text-align: center;">
                    ❌ REJECT (NOT RECEIVED)
                  </a>
                </div>

                <div style="border-top: 1px solid #E2E8F0; padding-top: 14px; text-align: center; font-size: 11px; color: #94A3B8;">
                  Or manage manually on the dashboard: <a href="${dashboardUrl}" style="color: #00838F; font-weight: 700;">Admin Payments Console</a>
                </div>
              </div>
            </body>
          </html>
        `;

        await transporter.sendMail({
          from: `"Catfisher Pond" <${gmailUser}>`,
          to: adminRecipient,
          subject: `💰 New ₹${verifiedAmount} Catfisher Payment — UTR ${cleanUtr}`,
          html: htmlContent,
        });
      } catch (mailError) {
        console.warn('Failed to send admin notification email:', mailError);
        // Do not fail the API call if mail fails, request is safely recorded in Firestore
      }
    } else {
      console.info('ADMIN_GMAIL_USER/ADMIN_GMAIL_APP_PASSWORD not configured. UTR saved to Firestore.');
    }

    return NextResponse.json({
      ok: true,
      utr: cleanUtr,
      amount: verifiedAmount,
      planTier,
      message: 'Payment request recorded. Will be reviewed in less than 24 hours.',
    });
  } catch (error: any) {
    console.error('Submit payment request error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to submit payment request' },
      { status: 500 }
    );
  }
}

