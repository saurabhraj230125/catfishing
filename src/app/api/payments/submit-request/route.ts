import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '@/lib/firebase';
import { PaymentRequest } from '@/types/pond';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, userEmail, payerName, planTier, utr } = body;

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
    const secret = process.env.ADMIN_ACTION_SECRET || 'catfisher_pond_hmac_secret_98421_live';
    const approveToken = crypto.createHmac('sha256', secret).update(`${cleanUtr}:approve`).digest('hex');
    const rejectToken = crypto.createHmac('sha256', secret).update(`${cleanUtr}:reject`).digest('hex');

    // Production Vercel Base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://catfisher.vercel.app';

    const approveUrl = `${baseUrl}/api/payments/email-action?utr=${cleanUtr}&action=approve&token=${approveToken}`;
    const rejectUrl = `${baseUrl}/api/payments/email-action?utr=${cleanUtr}&action=reject&token=${rejectToken}`;
    const dashboardUrl = `${baseUrl}/admin/payments`;

    // 4. Send Instant Admin Email via Nodemailer (Explicit Gmail SMTP)
    const rawGmailUser = process.env.ADMIN_GMAIL_USER || '';
    const gmailUser = rawGmailUser.trim();
    const appPass = (process.env.ADMIN_GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
    const adminRecipient = (process.env.ADMIN_NOTIFICATION_EMAIL || gmailUser || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'saurabhraj230125@gmail.com').trim();

    if (gmailUser && appPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: gmailUser,
            pass: appPass,
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
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 16px; color: #0F172A;">
              <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 2px solid #0F172A; border-radius: 24px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
                <div style="display: inline-block; padding: 4px 12px; background: #E0F7FA; border-radius: 9999px; font-size: 11px; font-weight: 800; color: #006064; text-transform: uppercase; letter-spacing: 0.5px;">
                  Catfisher Direct UPI Alert 🎣
                </div>
                <h1 style="font-size: 24px; font-weight: 900; margin: 12px 0 6px 0; color: #0F172A;">
                  New ₹${verifiedAmount} Payment Received!
                </h1>
                <p style="font-size: 13px; color: #64748B; margin: 0 0 20px 0; line-height: 1.4;">
                  User has submitted their 12-digit UPI reference number. Verify in your bank statement and tap below to instantly unlock their plan.
                </p>

                <div style="background: #F1F5F9; border-radius: 16px; padding: 18px; margin-bottom: 24px; font-size: 13px; line-height: 1.7;">
                  <div style="margin-bottom: 8px;">
                    <span style="color: #64748B; font-weight: 600;">Plan:</span>
                    <strong style="color: #0F172A; float: right;">${planName}</strong>
                    <div style="clear: both;"></div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <span style="color: #64748B; font-weight: 600;">Amount:</span>
                    <strong style="color: #059669; font-size: 18px; float: right;">₹${verifiedAmount}</strong>
                    <div style="clear: both;"></div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <span style="color: #64748B; font-weight: 600;">12-Digit UTR:</span>
                    <code style="background: #FFFFFF; border: 1px solid #CBD5E1; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-family: monospace; font-size: 15px; color: #0F172A; float: right;">${cleanUtr}</code>
                    <div style="clear: both;"></div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <span style="color: #64748B; font-weight: 600;">Payer Name:</span>
                    <strong style="color: #0F172A; float: right;">${payerName || 'Not specified'}</strong>
                    <div style="clear: both;"></div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <span style="color: #64748B; font-weight: 600;">User Email:</span>
                    <span style="color: #0F172A; float: right;">${userEmail || 'N/A'}</span>
                    <div style="clear: both;"></div>
                  </div>
                  <div>
                    <span style="color: #64748B; font-weight: 600;">Timestamp (IST):</span>
                    <span style="color: #64748B; float: right;">${istTime}</span>
                    <div style="clear: both;"></div>
                  </div>
                </div>

                <!-- 1-Click Action Buttons -->
                <div style="text-align: center; margin-bottom: 20px;">
                  <a href="${approveUrl}" style="display: block; width: 100%; box-sizing: border-box; background: #059669; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 900; padding: 15px 20px; border-radius: 14px; margin-bottom: 12px; text-align: center; letter-spacing: 0.3px;">
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

        // STRICTLY AWAIT transporter.sendMail before returning response
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
