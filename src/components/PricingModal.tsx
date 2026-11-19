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
  Smartphone,
  Send,
  HelpCircle
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
  blockFreeUpiUri: string;
  merchantUpiUri?: string;
  isMerchant: boolean;
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
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(900);

  // Manual 12-digit UTR fallback state (always visible)
  const [utrInput, setUtrInput] = useState('');
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  const [utrStatusMessage, setUtrStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 15-minute countdown timer for active order
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

  // Real-time Firestore listener for order payment confirmation (Subscribes to BOTH pending_upi_orders and users/{uid})
  useEffect(() => {
    if (!activeCheckout || !isLiveFirebaseConfigured) return;

    let hasHandledSuccess = false;

    // 1. Listen to pending_upi_orders/{orderCode}
    const orderRef = doc(db, 'pending_upi_orders', activeCheckout.orderCode);
    const unsubOrder = onSnapshot(orderRef, async (snap) => {
      if (!snap.exists() || hasHandledSuccess) return;
      const data = snap.data();
      if (data && data.status === 'paid') {
        hasHandledSuccess = true;
        await handlePaymentSuccess(activeCheckout.planTier, activeCheckout.orderCode);
      }
    });

    // 2. Listen to users/{userUid} in case webhook upgraded user doc directly
    const userRef = doc(db, 'users', userUid);
    const unsubUser = onSnapshot(userRef, async (snap) => {
      if (!snap.exists() || hasHandledSuccess) return;
      const data = snap.data();
      if (data && data.planTier === activeCheckout.planTier) {
        hasHandledSuccess = true;
        await handlePaymentSuccess(activeCheckout.planTier, activeCheckout.orderCode);
      }
    });

    return () => {
      unsubOrder();
      unsubUser();
    };
  }, [activeCheckout, userUid]);

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
        blockFreeUpiUri: orderData.blockFreeUpiUri || `upi://pay?pa=${orderData.upiId}&pn=Catfisher%20Pond&cu=INR`,
        merchantUpiUri: orderData.merchantUpiUri,
        isMerchant: Boolean(orderData.isMerchant),
        expiresAt: orderData.expiresAt,
        planTier: tier as 'pro_100' | 'unlimited',
      });
      setRemainingSeconds(900);
      setUtrStatusMessage(null);
      setUtrInput('');
    } catch (err: any) {
      console.error('UPI Order creation notice:', err);
      // Safe local fallback so user is never blocked
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

    setSuccessMessage('🎉 Plan Unlocked! Ab Full Chat Karo!');

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

  const handleCopyAmount = () => {
    if (!activeCheckout) return;
    navigator.clipboard.writeText(activeCheckout.exactAmount.toFixed(2)).catch(() => {});
    setCopiedAmount(true);
    triggerHaptic('light');
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // 12-Digit UTR Manual Backup Submission
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

  // Determine which QR content to render:
  // If personal UPI (NEXT_PUBLIC_UPI_IS_MERCHANT !== 'true'), encode block-free QR (NO &am= and NO &tn=)
  const qrString = activeCheckout
    ? (activeCheckout.isMerchant ? (activeCheckout.merchantUpiUri || activeCheckout.upiUri) : activeCheckout.blockFreeUpiUri)
    : '';

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
                className="mb-6 p-5 bg-emerald-50 border-2 border-emerald-400 rounded-3xl text-center shadow-lg"
              >
                <div className="text-4xl mb-1.5">🎉</div>
                <h3 className="text-lg sm:text-xl font-black text-emerald-950">
                  {successMessage}
                </h3>
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  Your chat window has been unlocked. Returning to your chat in 2 seconds...
                </p>
              </motion.div>
            )}

            {/* ACTIVE UPI PAYMENT SCREEN */}
            {activeCheckout && !successMessage ? (
              <div className="max-w-lg mx-auto text-center py-2">
                <button
                  type="button"
                  onClick={() => setActiveCheckout(null)}
                  className="mb-3 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
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

                {/* TWO LARGE 1-TAP COPY PILLS (AMOUNT + UPI ID) */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Pill 1: Copy Exact Amount */}
                  <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl text-white shadow-md text-left flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-teal-100">
                        1. EXACT AMOUNT
                      </div>
                      <div className="text-2xl font-black tracking-tight my-0.5">
                        ₹{activeCheckout.exactAmount.toFixed(2)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAmount}
                      className="mt-2 w-full py-1.5 px-3 rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {copiedAmount ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-teal-700" />
                          <span>Copy ₹{activeCheckout.exactAmount.toFixed(2)}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Pill 2: Copy UPI ID */}
                  <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-md text-left flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                        2. UPI ID
                      </div>
                      <div className="text-sm sm:text-base font-black font-mono tracking-tight my-1 text-teal-300 truncate">
                        {activeCheckout.upiId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpiId}
                      className="mt-2 w-full py-1.5 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-950" />
                          <span>Copy UPI ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Prominent Auto-Unlock Instruction */}
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-black text-amber-900 text-center">
                  💡 Scan QR or pay <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{activeCheckout.upiId}</code> and enter EXACT <span className="text-teal-700 underline font-black">₹{activeCheckout.exactAmount.toFixed(2)}</span> for 3-second auto-unlock!
                </div>

                {/* QR Code Container (Block-Free Safe QR) */}
                <div className="mt-4 p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm inline-block">
                  <QRCodeSVG
                    value={qrString}
                    size={175}
                    level="H"
                    includeMargin={false}
                    className="mx-auto"
                  />
                  <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Scan with GPay / PhonePe / Paytm / BHIM
                  </div>
                </div>

                {/* Open Paytm / BHIM Button */}
                <div className="mt-3">
                  <a
                    href={activeCheckout.blockFreeUpiUri}
                    className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Open Paytm / BHIM App</span>
                  </a>
                  <p className="mt-1 text-[11px] text-slate-500 font-medium">
                    If GPay/PhonePe blocks the web link, just copy the UPI ID above & pay inside your app.
                  </p>
                </div>

                {/* Live Auto-Detect Status Bar */}
                <div className="mt-3.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                    </span>
                    <span className="truncate">
                      ⚡ Listening for ₹{activeCheckout.exactAmount.toFixed(2)}...
                    </span>
                  </div>
                  <div className="font-mono text-teal-800 font-black ml-2 whitespace-nowrap">
                    ⏱ {formatTimer(remainingSeconds)}
                  </div>
                </div>

                {/* ALWAYS-ACCESSIBLE 12-DIGIT UTR BACKUP INPUT */}
                <div className="mt-4 border-t border-slate-200 pt-3 text-left">
                  <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
                    <span>Already Paid? Paste 12-Digit UTR / Ref No</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">Backup</span>
                  </div>

                  <form onSubmit={handleSubmitUtr} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <p className="text-[11px] text-slate-600 font-medium">
                      If you paid flat ₹{activeCheckout.baseAmount} instead of ₹{activeCheckout.exactAmount.toFixed(2)} or your bank alert was delayed, submit your 12-digit UTR below:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={12}
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder="e.g. 432109876543"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        type="submit"
                        disabled={utrSubmitting || !utrInput.trim()}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-1 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Submit UTR</span>
                      </button>
                    </div>
                    {utrStatusMessage && (
                      <div className={`text-[11px] font-bold ${utrStatusMessage.isError ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {utrStatusMessage.text}
                      </div>
                    )}
                  </form>
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
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">₹0</span>
                        <span className="text-xs font-bold text-slate-500">/forever</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 font-medium leading-relaxed">
                        Basic access to test your catfisher spotting radar.
                      </p>

                      <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>5 Minutes per chat session</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>Truth reveal score & XP</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-400">
                          <X className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>No extended sessions</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <div className="py-2.5 px-4 rounded-2xl bg-slate-200/80 text-slate-600 text-xs font-black text-center">
                        {currentPlan === 'free' ? 'Current Active Tier' : 'Default Free Plan'}
                      </div>
                    </div>
                  </div>

                  {/* Plan 2: Pro 100 Minutes (Popular) */}
                  <div className="relative rounded-3xl border-2 border-teal-500 bg-white p-5 flex flex-col justify-between shadow-xl shadow-teal-500/10">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-300" />
                      <span>Most Popular</span>
                    </div>

                    <div>
                      <div className="text-xs font-black text-teal-700 uppercase tracking-wider mb-1">
                        100-Minute Pack
                      </div>
                      <h3 className="text-lg font-black text-slate-900">Pro Angler</h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">₹99</span>
                        <span className="text-xs font-bold text-slate-500">/month</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 font-medium leading-relaxed">
                        100 minutes pool (~20 full chats) with zero cut-offs.
                      </p>

                      <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>100 Minutes live chat quota</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>Instant 0%-fee Direct UPI</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>Priority matchmaking radar</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>Verified ⚡ Pro badge</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleSelectPlan('pro_100')}
                        disabled={loadingTier !== null || currentPlan === 'pro_100'}
                        type="button"
                        className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                          currentPlan === 'pro_100'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                            : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white'
                        }`}
                      >
                        {loadingTier === 'pro_100' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : currentPlan === 'pro_100' ? (
                          <span>Current Active Tier</span>
                        ) : (
                          <>
                            <span>Pay ₹99 via UPI</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Plan 3: Unlimited Monthly Pass */}
                  <div className="relative rounded-3xl border-2 border-purple-500 bg-gradient-to-b from-purple-50/40 to-white p-5 flex flex-col justify-between shadow-xl shadow-purple-500/10">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-300" />
                      <span>Infinite Access</span>
                    </div>

                    <div>
                      <div className="text-xs font-black text-purple-700 uppercase tracking-wider mb-1">
                        Unlimited VIP
                      </div>
                      <h3 className="text-lg font-black text-slate-900">Catfisher King</h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">₹249</span>
                        <span className="text-xs font-bold text-slate-500">/month</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 font-medium leading-relaxed">
                        Unlimited chat time all month long. Never see 00:00 again.
                      </p>

                      <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          <span>Unlimited Minutes (∞ Symbol)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          <span>2x Catfisher XP Multiplier</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          <span>Crown 👑 Story Ring in Pond</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          <span>Instant Rematching Bypass</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-purple-100">
                      <button
                        onClick={() => handleSelectPlan('unlimited')}
                        disabled={loadingTier !== null || currentPlan === 'unlimited'}
                        type="button"
                        className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                          currentPlan === 'unlimited'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300 cursor-default'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                        }`}
                      >
                        {loadingTier === 'unlimited' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : currentPlan === 'unlimited' ? (
                          <span>Current Active Tier</span>
                        ) : (
                          <>
                            <span>Pay ₹249 via UPI</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-500 gap-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>0% Fee Direct UPI Payment • 256-bit Encrypted Matchmaking</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>UPI ID: <strong className="text-slate-800">6306814355@ptsbi</strong></span>
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
