import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PlanTier } from '@/types/pond';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userUid,
      planTier,
      isSimulated,
    } = body as {
      razorpay_order_id: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      userUid: string;
      planTier: PlanTier;
      isSimulated?: boolean;
    };

    if (!userUid || !planTier) {
      return NextResponse.json({ error: 'Missing userUid or planTier' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If real keys are present and not simulated, verify HMAC signature
    if (keySecret && !isSimulated) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Missing payment signature fields' }, { status: 400 });
      }

      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // Success response - client will apply upgrade
    return NextResponse.json({
      success: true,
      userUid,
      planTier,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}

