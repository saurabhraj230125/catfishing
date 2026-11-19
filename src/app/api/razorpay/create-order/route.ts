import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { PlanTier } from '@/types/pond';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planTier, userUid } = body as { planTier: PlanTier; userUid: string };

    if (!planTier || !userUid) {
      return NextResponse.json({ error: 'Missing planTier or userUid' }, { status: 400 });
    }

    // Determine amount in paise (100 paise = 1 INR)
    let amountInPaise = 0;
    if (planTier === 'pro_100') {
      amountInPaise = 9900; // ₹99
    } else if (planTier === 'unlimited') {
      amountInPaise = 24900; // ₹249
    } else {
      return NextResponse.json({ error: 'Free tier does not require checkout' }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If live/test Razorpay keys are configured, create real order
    if (keyId && keySecret) {
      try {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${userUid.slice(0, 10)}_${Date.now()}`,
          notes: {
            userUid,
            planTier,
          },
        });

        return NextResponse.json({
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId,
          isSimulated: false,
        });
      } catch (razorpayErr) {
        console.warn('Razorpay order creation fallback:', razorpayErr);
      }
    }

    // Safe dev simulation fallback if Razorpay keys are pending in .env.local
    const simulatedOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return NextResponse.json({
      orderId: simulatedOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: keyId || 'rzp_test_simulated',
      isSimulated: true,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

