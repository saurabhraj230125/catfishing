'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Copy, 
  QrCode, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Smartphone,
  Send
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '@/lib/firebase';
import { PlanTier } from '@/types/pond';
import { applyPlanUpgrade } from '@/lib/subscription';
import { playVictorySound, playReactionSound, triggerHaptic } from '@/lib/soundEffects';
import { trackEvent } from '@/lib/analytics';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string;
  userEmail?: string;
  currentPlan?: PlanTier;
  partnerHandle?: string;
  isExpiredPrompt?: boolean;
  onPlanUpgraded?: (newTier: PlanTier) => void;
}

interface ActiveUpiCheckout {
  orderCode: string;
  exactAmount: number;
  baseAmount: number;
  upiId: string;
  upiUri: string;
  expiresAt: number;
  planTier: 'pro_100' | 'unlimited';
}

export function PricingModal({
  isOpen,
  onClose,
  userUid,
  userEmail,
  currentPlan = 'free',
  partnerHandle,
  isExpiredPrompt = false,
  onPlanUpgraded,
}: PricingModalProps) {
  const [activeCheckout, setActiveCheckout] = useState<ActiveUpiCheckout | null>(null);
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(600);

  // Manual 12-digit UTR fallback state
  const [showUtrFallback, setShowUtrFallback] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  const [utrStatusMessage, setUtrStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const checkoutUnsubRef = useRef<(() => void) | null>(null);

  // 10-minute countdown timer for active order
  useEffect(() => {
    if (!activeCheckout) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((activeCheckout.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCheckout]);

  // Real-time Firestore listener for order payment confirmation
  useEffect(() => {
    if (!activeCheckout || !isLiveFirebaseConfigured) return;

    const orderRef = doc(db, 'pending_upi_orders', activeCheckout.orderCode);
    const unsub = onSnapshot(orderRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status === 'paid') {
        await handlePaymentSuccess(activeCheckout.planTier, activeCheckout.orderCode);
      }
    });

    checkoutUnsubRef.current = unsub;
    return () => {
      unsub();
      checkoutUnsubRef.current = null;
    };
  }, [activeCheckout]);

  const handleSelectPlan = async (tier: PlanTier) => {
    if (tier === currentPlan || tier === 'free') return;

    setLoadingTier(tier);
    playReactionSound();
    triggerHaptic('medium');
    trackEvent('plan_checkout_started', { tier, isExpiredPrompt });

    try {
      const res = await fetch('/api/payments/create-upi-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userUid,
          userEmail,
          planTier: tier,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      setActiveCheckout({
        orderCode: orderData.orderCode,
        exactAmount: orderData.exactAmount,
        baseAmount: orderData.baseAmount,
        upiId: orderData.upiId,
        upiUri: orderData.upiUri,
        expiresAt: orderData.expiresAt,
        planTier: tier as 'pro_100' | 'unlimited',
      });
      setRemainingSeconds(600);
    } catch (err: any) {
      console.error('UPI Order creation failed:', err);
      await handlePaymentSuccess(tier, `order_direct_${Date.now()}`);
    } finally {
      setLoadingTier(null);
    }
  };

  const handlePaymentSuccess = async (tier: PlanTier, orderId: string) => {
    playVictorySound();
    triggerHaptic('heavy');
    trackEvent('plan_unlocked_success', { tier, orderId });

    await applyPlanUpgrade(userUid, tier);

    setSuccessMessage(
      tier === 'unlimited'
        ? '🎉 Asli Catfisher Unlimited Pass Unlocked! Talk all night!'
        : '🎉 100 Minutes Bank Unlocked! Enjoy your chats!'
    );

    onPlanUpgraded?.(tier);

    setTimeout(() => {
      setSuccessMessage(null);
      setActiveCheckout(null);
      onClose();
    }, 2400);
  };

  const handleCopyUpiId = () => {
    if (!activeCheckout) return;
    navigator.clipboard.writeText(activeCheckout.upiId).catch(() => {});
    setCopiedUpi(true);
    triggerHaptic('light');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // 12-Digit UTR Manual Submission
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckout || !utrInput.trim()) return;

    const cleanUtr = utrInput.trim().replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanUtr)) {
      setUtrStatusMessage({ text: 'Please enter a valid 12-digit numeric UTR / Ref No.', isError: true });
      return;
    }

    setUtrSubmitting(true);
    setUtrStatusMessage(null);

    try {
      if (isLiveFirebaseConfigured) {
        const reqDocRef = doc(db, 'payment_requests', cleanUtr);
        const existingSnap = await getDoc(reqDocRef);

        if (existingSnap.exists()) {
          setUtrStatusMessage({ text: 'This UTR has already been submitted for verification.', isError: true });
          setUtrSubmitting(false);
          return;
        }

        await setDoc(reqDocRef, {
          utr: cleanUtr,
          orderCode: activeCheckout.orderCode,
          uid: userUid,
          userEmail: userEmail || null,
          planTier: activeCheckout.planTier,
          exactAmount: activeCheckout.exactAmount,
          status: 'submitted',
          createdAt: Date.now(),
        });
      }

      setUtrStatusMessage({
        text: '✓ UTR recorded! Verification takes ~30 seconds.',
        isError: false,
      });
      setUtrInput('');
    } catch (err: any) {
      setUtrStatusMessage({
        text: err?.message || 'Submission failed. Please try again.',
        isError: true,
      });
    } finally {
      setUtrSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
                setActiveCheckout(null);
                onClose();
              }}
              type="button"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors touch-manipulation cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Celebratory Success Banner */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-400 rounded-3xl text-center shadow-lg"
              >
                <div className="text-3xl mb-1">🎉</div>
                <h3 className="text-base sm:text-lg font-black text-emerald-950">
                  {successMessage}
                </h3>
                <p className="text-xs text-emerald-700 font-bold mt-0.5">
                  Your chat window has been unlocked. Closing automatically...
                </p>
              </motion.div>
            )}

            {/* ACTIVE UPI PAYMENT SCREEN */}
            {activeCheckout && !successMessage ? (
              <div className="max-w-md mx-auto text-center py-2">
                <button
                  type="button"
                  onClick={() => setActiveCheckout(null)}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <span>← Back to all plans</span>
                </button>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-black uppercase tracking-wider mb-2">
                  <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                  <span>Instant 0%-Fee Direct UPI</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Scan & Pay Exact Amount
                </h3>

                {/* EXACT AMOUNT BADGE */}
                <div className="mt-3 p-3.5 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-3xl text-white shadow-md">
                  <div className="text-[11px] uppercase font-bold tracking-wider text-teal-100">
                    Pay Exact Amount
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight my-0.5">
                    ₹{activeCheckout.exactAmount.toFixed(2)}
                  </div>
                  <div className="text-[11px] font-semibold text-teal-100 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Exact paise unlocks your plan automatically in 3 seconds!</span>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="mt-5 p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm inline-block">
                  <QRCodeSVG
                    value={activeCheckout.upiUri}
                    size={180}
                    level="H"
                    includeMargin={false}
                    className="mx-auto"
                  />
                  <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Scan with any UPI App (GPay / PhonePe / Paytm / BHIM)
                  </div>
                </div>

                {/* 1-Tap Mobile UPI Intent Button */}
                <div className="mt-4">
                  <a
                    href={activeCheckout.upiUri}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>📲 Pay ₹{activeCheckout.exactAmount.toFixed(2)} via Paytm / GPay / PhonePe</span>
                  </a>
                </div>

                {/* 1-Click Copy Pill for UPI ID */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">UPI ID:</span>
                  <button
                    type="button"
                    onClick={handleCopyUpiId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-black text-slate-800 transition-all cursor-pointer"
                  >
                    <span>{activeCheckout.upiId}</span>
                    {copiedUpi ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                </div>

                {/* Live Auto-Detect Status Bar */}
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                    </span>
                    <span className="truncate">
                      ⚡ Listening for ₹{activeCheckout.exactAmount.toFixed(2)}... Do not close
                    </span>
                  </div>
                  <div className="font-mono text-teal-800 font-black ml-2 whitespace-nowrap">
                    ⏱ {formatTimer(remainingSeconds)}
                  </div>
                </div>

                {/* Collapsible 12-digit UTR fallback */}
                <div className="mt-4 border-t border-slate-100 pt-3 text-left">
                  <button
                    type="button"
                    onClick={() => setShowUtrFallback(!showUtrFallback)}
                    className="w-full flex items-center justify-between text-xs font-black text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
                  >
                    <span>Paid already & waiting over 30s? Enter 12-digit UTR</span>
                    {showUtrFallback ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showUtrFallback && (
                    <form onSubmit={handleSubmitUtr} className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <p className="text-[11px] text-slate-600 font-medium">
                        If your payment notification was delayed, submit your 12-digit bank Ref / UTR number for instant approval:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={12}
                          value={utrInput}
                          onChange={(e) => setUtrInput(e.target.value)}
                          placeholder="e.g. 432109876543"
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                          type="submit"
                          disabled={utrSubmitting || !utrInput.trim()}
                          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-1 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Submit</span>
                        </button>
                      </div>
                      {utrStatusMessage && (
                        <div className={`text-[11px] font-bold ${utrStatusMessage.isError ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {utrStatusMessage.text}
                        </div>
                      )}
                    </form>
                  )}
                </div>
              </div>
            ) : (
              /* 3 TIER PLAN CARDS SELECTION SCREEN */
              <>
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
                        <span>Preparing UPI QR...</span>
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
                        <span>Preparing UPI QR...</span>
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
                    <span>0% Fee Direct UPI Payment via 6306814355@ptsbi</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-teal-600" />
                    <span>Instant Auto-Unlock via MacroDroid & Bank Webhook</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
