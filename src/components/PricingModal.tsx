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
  CheckCircle2, 
  Smartphone,
  Send,
  ArrowLeft
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '@/lib/firebase';
import { PlanTier } from '@/types/pond';
import { applyPlanUpgrade } from '@/lib/subscription';
import { playVictorySound, playReactionSound, triggerHaptic } from '@/lib/soundEffects';
import { showToast } from '@/components/Toast';

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
  // Navigation within modal: 'plans' | 'checkout' | 'confirmation'
  const [modalStage, setModalStage] = useState<'plans' | 'checkout' | 'confirmation'>('plans');
  const [selectedTier, setSelectedTier] = useState<'pro_100' | 'unlimited'>('pro_100');
  
  // Checkout inputs
  const [utrInput, setUtrInput] = useState('');
  const [payerNameInput, setPayerNameInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Copy feedbacks
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Submitted UTR for tracking in confirmation stage
  const [submittedUtr, setSubmittedUtr] = useState<string>('');
  const [isLiveApproved, setIsLiveApproved] = useState(false);

  const blockFreeUpiUri = 'upi://pay?pa=6306814355@ptsbi&pn=Catfisher%20Pond&cu=INR';
  const upiId = '6306814355@ptsbi';

  // Amount per plan
  const planAmount = selectedTier === 'pro_100' ? 99 : 249;
  const planName = selectedTier === 'pro_100' ? 'Chai & Chill (100 Mins)' : 'Asli Catfisher Pass (Unlimited)';

  // Reset when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setModalStage('plans');
      setErrorMessage(null);
      setIsLiveApproved(false);
      setUtrInput('');
      setPayerNameInput('');
    }
  }, [isOpen]);

  // Real-time listener for the submitted UTR and user document (auto-unlock when approved)
  useEffect(() => {
    if (!isOpen || !submittedUtr || !isLiveFirebaseConfigured) return;

    let handled = false;

    // 1. Listen to payment_requests/{submittedUtr}
    const reqRef = doc(db, 'payment_requests', submittedUtr);
    const unsubReq = onSnapshot(reqRef, async (snap) => {
      if (!snap.exists() || handled) return;
      const data = snap.data();
      if (data && data.status === 'approved') {
        handled = true;
        await triggerApprovalSuccess(selectedTier);
      }
    });

    // 2. Also listen to users/{userUid}
    const userRef = doc(db, 'users', userUid);
    const unsubUser = onSnapshot(userRef, async (snap) => {
      if (!snap.exists() || handled) return;
      const data = snap.data();
      if (data && data.planTier === selectedTier) {
        handled = true;
        await triggerApprovalSuccess(selectedTier);
      }
    });

    return () => {
      unsubReq();
      unsubUser();
    };
  }, [isOpen, submittedUtr, selectedTier, userUid]);

  const triggerApprovalSuccess = async (tier: PlanTier) => {
    setIsLiveApproved(true);
    playVictorySound();
    triggerHaptic('heavy');
    showToast('🎉 Plan Approved & Unlocked! Full chat access ready.', 'success');

    await applyPlanUpgrade(userUid, tier);
    onPlanUpgraded?.(tier);

    setTimeout(() => {
      onClose();
    }, 2500);
  };

  const handleOpenCheckout = (tier: 'pro_100' | 'unlimited') => {
    playReactionSound();
    triggerHaptic('light');
    setSelectedTier(tier);
    setErrorMessage(null);
    setModalStage('checkout');
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(upiId).catch(() => {});
    setCopiedUpi(true);
    triggerHaptic('light');
    showToast('📋 UPI ID Copied: 6306814355@ptsbi', 'success');
    setTimeout(() => setCopiedUpi(false), 2200);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrInput.trim().replace(/\s+/g, '');

    if (!cleanUtr || !/^\d{12}$/.test(cleanUtr)) {
      setErrorMessage('Please enter a valid 12-digit numeric UTR / Ref Number.');
      triggerHaptic('heavy');
      return;
    }

    setErrorMessage(null);
    setIsSubmittingUtr(true);
    triggerHaptic('medium');

    try {
      const res = await fetch('/api/payments/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userUid,
          userEmail,
          payerName: payerNameInput.trim() || undefined,
          planTier: selectedTier,
          amount: planAmount,
          utr: cleanUtr,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit payment request.');
      }

      setSubmittedUtr(cleanUtr);
      setModalStage('confirmation');
      playReactionSound();
      showToast('⏳ UTR Submitted — Approval in <24 hours!', 'info');
    } catch (err: any) {
      console.error('Payment submission failed:', err);
      setErrorMessage(err?.message || 'Submission failed. Please check your network and try again.');
    } finally {
      setIsSubmittingUtr(false);
    }
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
            className="relative w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl sm:rounded-[36px] border-2 border-slate-900 shadow-[0_25px_70px_rgba(0,131,143,0.22)] p-5 sm:p-8 text-slate-900 my-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              type="button"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors touch-manipulation cursor-pointer z-10"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ========================================================
                STAGE 1: 3-TIER PLAN CARDS SELECTION
                ======================================================== */}
            {modalStage === 'plans' && (
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
                      ? 'Upgrade your monthly pass to keep chatting, test catfishers, and unlock infinite pond minutes.'
                      : 'Choose a monthly pass for priority queue matchmaking and instant verification.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-6">
                  {/* Plan 1: Free (Pond Visitor) */}
                  <div className="rounded-3xl border-2 border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                        Free Tier
                      </div>
                      <h3 className="text-lg font-black text-slate-900">Pond Visitor</h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">₹0</span>
                        <span className="text-xs font-bold text-slate-500">/month</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 font-medium leading-relaxed">
                        Basic access to test your catfisher spotting radar.
                      </p>

                      <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>5 Minutes free chat session</span>
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
                      <div className="py-2.5 px-4 rounded-2xl bg-slate-200 text-slate-600 text-xs font-black text-center">
                        {currentPlan === 'free' ? 'Current Active Tier' : 'Default Free Plan'}
                      </div>
                    </div>
                  </div>

                  {/* Plan 2: 100 Minutes — Chai & Chill (₹99 / month) */}
                  <div className="relative rounded-3xl border-2 border-teal-500 bg-white p-5 flex flex-col justify-between shadow-xl shadow-teal-500/10 hover:-translate-y-1 transition-transform">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-300" />
                      <span>Most Popular</span>
                    </div>

                    <div>
                      <div className="text-xs font-black text-teal-700 uppercase tracking-wider mb-1">
                        100-Minute Pack
                      </div>
                      <h3 className="text-lg font-black text-slate-900">Chai & Chill</h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">₹99</span>
                        <span className="text-xs font-bold text-slate-500">/month</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 font-medium leading-relaxed">
                        100 minutes live chat bank with priority matching.
                      </p>

                      <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>100 Minutes live chat quota</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>Priority queue matchmaking</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>Insta-gradient avatar ring</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>Direct UPI • Approved in &lt;24h</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenCheckout('pro_100')}
                        type="button"
                        className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <span>Upgrade for ₹99</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Plan 3: Unlimited — Asli Catfisher Pass (₹249 / month) */}
                  <div className="relative rounded-3xl border-2 border-purple-500 bg-gradient-to-b from-purple-50/40 to-white p-5 flex flex-col justify-between shadow-xl shadow-purple-500/10 hover:-translate-y-1 transition-transform">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-300" />
                      <span>Best Value</span>
                    </div>

                    <div>
                      <div className="text-xs font-black text-purple-700 uppercase tracking-wider mb-1">
                        Unlimited VIP
                      </div>
                      <h3 className="text-lg font-black text-slate-900">Asli Catfisher Pass</h3>
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
                          <span>Golden Story Ring in Pond</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          <span>Exclusive savage Hinglish icebreakers</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          <span>Direct UPI • Approved in &lt;24h</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-purple-100">
                      <button
                        onClick={() => handleOpenCheckout('unlimited')}
                        type="button"
                        className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <span>Upgrade for ₹249</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-500 gap-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>0% Fee Direct UPI Payment • Approved within minutes (&lt;24 hours guaranteed)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>UPI ID: <strong className="text-slate-900 font-mono">6306814355@ptsbi</strong></span>
                  </div>
                </div>
              </>
            )}

            {/* ========================================================
                STAGE 2: SCAN & PAY + SUBMIT 12-DIGIT UTR
                ======================================================== */}
            {modalStage === 'checkout' && (
              <div className="max-w-md mx-auto text-center py-1">
                <button
                  type="button"
                  onClick={() => setModalStage('plans')}
                  className="mb-3 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to all plans</span>
                </button>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-black uppercase tracking-wider mb-2">
                  <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                  <span>Direct UPI QR Checkout</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Scan & Pay ₹{planAmount}
                </h3>
                <p className="text-xs text-slate-600 font-semibold mt-0.5 mb-3">
                  Upgrading to: <strong className="text-teal-700">{planName}</strong>
                </p>

                {/* Block-Free Safe QR Code */}
                <div className="p-4 bg-white rounded-3xl border-2 border-slate-900 shadow-sm inline-block mb-3">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                    Pay Exactly <span className="text-slate-900 font-extrabold text-sm">₹{planAmount}</span>
                  </div>
                  <QRCodeSVG
                    value={blockFreeUpiUri}
                    size={180}
                    level="H"
                    includeMargin={false}
                    className="mx-auto"
                  />
                  <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Scan with any UPI App (GPay / PhonePe / Paytm)
                  </div>
                </div>

                {/* Two High-Clarity 1-Tap Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {/* Button 1: Copy UPI ID */}
                  <button
                    type="button"
                    onClick={handleCopyUpiId}
                    className="min-h-[44px] py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {copiedUpi ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied! ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-teal-300" />
                        <span>Copy UPI ID</span>
                      </>
                    )}
                  </button>

                  {/* Button 2: Open UPI App */}
                  <a
                    href={blockFreeUpiUri}
                    className="min-h-[44px] py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Open UPI App</span>
                  </a>
                </div>

                <div className="text-[11px] text-slate-500 font-medium mb-4">
                  💡 On phone? Copy UPI ID above & pay directly inside GPay, PhonePe, or Paytm.
                </div>

                {/* Step 2 Form: Enter 12-Digit UTR */}
                <form onSubmit={handleSubmitPayment} className="p-4 bg-slate-50 rounded-3xl border-2 border-slate-200 text-left space-y-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      12-Digit UTR / UPI Ref No. <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      value={utrInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setUtrInput(val);
                      }}
                      placeholder="e.g. 432109876543"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Your UPI / Payer Name <span className="text-slate-400 font-normal">(Optional, helps fast verify)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={payerNameInput}
                      onChange={(e) => setPayerNameInput(e.target.value)}
                      placeholder="e.g. Rohan Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingUtr || utrInput.length !== 12}
                    className="w-full min-h-[46px] py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {isSubmittingUtr ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>✅ I Have Paid — Submit for Approval</span>
                      </>
                    )}
                  </button>

                  <div className="text-[11px] text-slate-500 text-center font-medium">
                    ⚡ Verified & unlocked in <strong>less than 24 hours</strong> (usually within 5–15 minutes).
                  </div>
                </form>
              </div>
            )}

            {/* ========================================================
                STAGE 3: PENDING CONFIRMATION SCREEN (<24 HOURS)
                ======================================================== */}
            {modalStage === 'confirmation' && (
              <div className="max-w-md mx-auto text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-400 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-3 shadow-md">
                  {isLiveApproved ? '🎉' : '🎣'}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {isLiveApproved ? 'Plan Approved & Unlocked! 🎉' : 'Payment Submitted! 🎣'}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                  {isLiveApproved ? (
                    'Your plan is active now. Returning to chat...'
                  ) : (
                    <>
                      We have received your UTR <code className="bg-slate-100 font-mono font-bold px-1.5 py-0.5 rounded text-slate-900">#{submittedUtr}</code> for <strong>₹{planAmount} ({planName})</strong>. Once confirmed in our bank account, your plan will be approved and unlocked in <strong>less than 24 hours</strong> (usually within minutes!).
                    </>
                  )}
                </p>

                {/* Real-time Status Badge */}
                <div className="my-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-2.5">
                  {isLiveApproved ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>🎉 Approved & Unlocked!</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-xs font-black text-amber-800">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                      </span>
                      <span>⏳ Waiting for Bank Verification</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => onClose()}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-md transition-all cursor-pointer"
                  >
                    Got It, Continue Chatting →
                  </button>

                  <div className="text-[11px] text-slate-400 font-medium">
                    You can check your status anytime via the <strong>⏳ Plan Pending</strong> badge in the top bar.
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
