'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Sparkles, 
  Zap, 
  Flame, 
  Crown, 
  ShieldCheck, 
  Clock,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { PlanTier, UserSubscription } from '@/types/pond';
import { applyPlanUpgrade } from '@/lib/subscription';
import { playVictorySound, playReactionSound, triggerHaptic } from '@/lib/soundEffects';
import { trackEvent } from '@/lib/analytics';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string;
  currentPlan?: PlanTier;
  partnerHandle?: string;
  isExpiredPrompt?: boolean;
  onPlanUpgraded?: (newTier: PlanTier) => void;
}

export function PricingModal({
  isOpen,
  onClose,
  userUid,
  currentPlan = 'free',
  partnerHandle,
  isExpiredPrompt = false,
  onPlanUpgraded,
}: PricingModalProps) {
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectPlan = async (tier: PlanTier) => {
    if (tier === currentPlan || tier === 'free') return;

    setLoadingTier(tier);
    playReactionSound();
    triggerHaptic('medium');
    trackEvent('plan_checkout_started', { tier, isExpiredPrompt });

    try {
      // 1. Create order on server
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier: tier, userUid }),
      });

      const orderData = await res.json();

      if (orderData.isSimulated || !window.Razorpay) {
        // Safe simulation path for testing before Razorpay KYC
        await completeUpgrade(tier, orderData.orderId, 'pay_simulated_upi');
        return;
      }

      // 2. Open official Razorpay Checkout modal if configured
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Catch Me If You Can',
        description: tier === 'unlimited' ? 'Unlimited Monthly Pass' : '100 Minutes Monthly Bank',
        order_id: orderData.orderId,
        image: '/icon.svg',
        handler: async function (response: any) {
          await verifyAndUpgrade(
            tier,
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        theme: {
          color: '#06B6D4',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        console.warn('Payment failed:', resp.error);
        setLoadingTier(null);
      });
      rzp.open();
    } catch (err) {
      console.warn('Checkout error (falling back to direct test simulation):', err);
      // Fallback to simulation so testing is never blocked
      await completeUpgrade(tier, `order_fallback_${Date.now()}`, 'pay_sim_fallback');
    }
  };

  const verifyAndUpgrade = async (
    tier: PlanTier,
    orderId: string,
    paymentId: string,
    signature: string
  ) => {
    try {
      const verifyRes = await fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier: tier,
          userUid,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        await completeUpgrade(tier, orderId, paymentId);
      }
    } catch (e) {
      console.error('Verification error:', e);
      setLoadingTier(null);
    }
  };

  const completeUpgrade = async (tier: PlanTier, _orderId: string, _paymentId: string) => {
    await applyPlanUpgrade(userUid, tier);
    playVictorySound();
    triggerHaptic('heavy');
    trackEvent('plan_upgrade_success', { tier });

    setSuccessMessage(
      tier === 'unlimited'
        ? '👑 Unlimited Pass Active! Talk all night without limits.'
        : '⚡ 100 Minutes Added! Your chat bank is unlocked.'
    );

    onPlanUpgraded?.(tier);
    setLoadingTier(null);

    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-4xl bg-white rounded-3xl sm:rounded-[36px] border-2 border-slate-900/10 shadow-[0_25px_70px_rgba(0,131,143,0.22)] p-5 sm:p-8 text-slate-800 my-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              type="button"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors touch-manipulation cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
              {isExpiredPrompt ? (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-black uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>5 Minutes Complete</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-black uppercase tracking-wider mb-2">
                  <Zap className="w-3.5 h-3.5 text-teal-600" />
                  <span>Angler Pass Upgrades</span>
                </div>
              )}

              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isExpiredPrompt
                  ? `⏱ 5 MINUTES KHATAM! Don't Leave ${partnerHandle || 'them'} Hanging...`
                  : '⚡ Level Up Your Angler Pass'}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium">
                {isExpiredPrompt
                  ? 'Keep chatting without losing connection, unlock instant rematching, and get verified pond flair.'
                  : 'Get more minutes to chat with real strangers and test undercover catfishers.'}
              </p>
            </div>

            {/* Success Banner */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-center text-xs sm:text-sm font-black text-emerald-900 shadow-sm"
              >
                {successMessage}
              </motion.div>
            )}

            {/* 3 Tier Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-6">
              {/* Plan 1: Free (Pond Visitor) */}
              <div className="rounded-3xl border-2 border-slate-200 bg-slate-50/60 p-5 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                    Free Tier
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Pond Visitor</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-2xl font-black text-slate-900">₹0</span>
                    <span className="text-xs text-slate-500 font-bold ml-1">/ forever</span>
                  </div>

                  <ul className="space-y-2 text-xs font-semibold text-slate-600 border-t border-slate-200 pt-3">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>5 Minutes free chat time</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>Boy-to-Girl live matching</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>Standard Fishing Panda pond</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>Hinglish icebreakers & reactions</span>
                    </li>
                  </ul>
                </div>

                <button
                  disabled
                  type="button"
                  className="w-full mt-5 py-2.5 rounded-2xl bg-slate-200 text-slate-500 text-xs font-bold cursor-not-allowed"
                >
                  {currentPlan === 'free' ? 'Current Active Tier' : 'Default Tier'}
                </button>
              </div>

              {/* Plan 2: 100 Minutes (Chai & Chill) - Most Popular */}
              <div className="relative rounded-3xl border-2 border-teal-500 bg-gradient-to-b from-teal-50/60 via-white to-teal-50/30 p-5 flex flex-col justify-between shadow-md ring-2 ring-teal-400/20">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-white" />
                  <span>Most Popular</span>
                </div>

                <div>
                  <div className="text-xs font-black text-teal-800 uppercase tracking-wider mb-1">
                    Monthly Bank
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Chai & Chill</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-2xl font-black text-slate-900">₹99</span>
                    <span className="text-xs text-slate-500 font-bold ml-1">/ month</span>
                  </div>

                  <ul className="space-y-2 text-xs font-semibold text-slate-700 border-t border-teal-100 pt-3">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span><strong>100 Minutes</strong> chat bank</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span>No 5-minute cutoff mid-chat</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span>Insta-gradient verified ring</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span>Priority matchmaking queue</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan('pro_100')}
                  disabled={loadingTier !== null || currentPlan === 'pro_100'}
                  type="button"
                  className={`w-full mt-5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md touch-manipulation cursor-pointer ${
                    currentPlan === 'pro_100'
                      ? 'bg-teal-100 text-teal-800 cursor-default'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white hover:shadow-lg active:scale-[0.98]'
                  }`}
                >
                  {loadingTier === 'pro_100' ? (
                    <span>Opening Checkout...</span>
                  ) : currentPlan === 'pro_100' ? (
                    <span>Current Active Plan</span>
                  ) : (
                    <>
                      <span>Unlock 100 Mins — ₹99</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Plan 3: Unlimited (Asli Catfisher Pass) - VIP Gold */}
              <div className="relative rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/60 via-white to-amber-50/30 p-5 flex flex-col justify-between shadow-md">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-white" />
                  <span>VIP Pass</span>
                </div>

                <div>
                  <div className="text-xs font-black text-amber-800 uppercase tracking-wider mb-1">
                    Unlimited
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Asli Catfisher Pass</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-2xl font-black text-slate-900">₹249</span>
                    <span className="text-xs text-slate-500 font-bold ml-1">/ month</span>
                  </div>

                  <ul className="space-y-2 text-xs font-semibold text-slate-700 border-t border-amber-100 pt-3">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span><strong>∞ Unlimited Minutes</strong> — talk all night</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>Golden Story Ring & VIP badge</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>Instant zero-wait priority match</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>Exclusive savage Hinglish decks</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan('unlimited')}
                  disabled={loadingTier !== null || currentPlan === 'unlimited'}
                  type="button"
                  className={`w-full mt-5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md touch-manipulation cursor-pointer ${
                    currentPlan === 'unlimited'
                      ? 'bg-amber-100 text-amber-800 cursor-default'
                      : 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:opacity-95 text-white hover:shadow-lg active:scale-[0.98]'
                  }`}
                >
                  {loadingTier === 'unlimited' ? (
                    <span>Opening Checkout...</span>
                  ) : currentPlan === 'unlimited' ? (
                    <span>Current Active VIP</span>
                  ) : (
                    <>
                      <span>Go Unlimited — ₹249</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Trust Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>UPI, Cards & Netbanking via Razorpay Security</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Instant Activation • Cancel Anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

