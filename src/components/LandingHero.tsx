'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithGoogle } from '@/lib/firebase';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { playCastSound } from '@/lib/soundEffects';

interface LandingHeroProps {
  onAuthenticated: (user: { uid: string; displayName: string; email?: string; photoURL?: string }) => void;
}

export function LandingHero({ onAuthenticated }: LandingHeroProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-playing Kyra & Simran Hinglish Viral Chat Preview Sequence (Step 1 to 5)
  const [previewStep, setPreviewStep] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewStep((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 2600);

    return () => clearInterval(timer);
  }, []);

  const getTabSuffix = () => {
    if (typeof window === 'undefined') return Math.random().toString(36).substring(2, 6);
    let tabId = sessionStorage.getItem('__pond_tab_session_id');
    if (!tabId) {
      tabId = Math.random().toString(36).substring(2, 6);
      sessionStorage.setItem('__pond_tab_session_id', tabId);
    }
    return tabId;
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      const tabSuffix = getTabSuffix();
      playCastSound();
      onAuthenticated({
        uid: `${user.uid}_${tabSuffix}`,
        displayName: user.displayName || 'Angler',
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
      });
    } catch (err: any) {
      console.warn('Google sign-in popup notice:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed. Click below to retry.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMsg('Authorized domain required in Firebase Console. Connecting as Guest...');
        handleInstantGuestLogin();
      } else {
        // Direct fallback to guest for offline or testing purposes
        handleInstantGuestLogin();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInstantGuestLogin = () => {
    playCastSound();
    const tabSuffix = getTabSuffix();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const guestUid = `guest_${tabSuffix}_${randomSuffix}`;
    onAuthenticated({
      uid: guestUid,
      displayName: `Angler ${randomSuffix}`,
      email: `angler_${randomSuffix}@pondchat.app`,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=Pond${randomSuffix}&backgroundColor=b6e3f4`,
    });
  };

  return (
    <div className="relative z-10 w-full max-w-xl mx-auto px-3 sm:px-4 py-2 sm:py-4 flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-900/10 shadow-[0_20px_50px_rgba(0,131,143,0.16)] p-4 sm:p-7 text-center flex flex-col items-center"
      >
        {/* Floating Arcade Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 via-rose-100 to-teal-100 border border-amber-300/60 text-[10px] sm:text-xs font-black text-amber-900 mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>BOY ↔ GIRL • CATFISH & LOYALTY ROULETTE</span>
        </div>

        {/* Punchy Gamified Headline */}
        <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          Pehchano Kaun Hai Screen Ke Peeche?
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-md font-medium leading-relaxed">
          Cast your line into the pond. Chat with real strangers, spot the fake rich boy or loyalty test!
        </p>

        {/* ========================================================
            CENTER SHOWCASE CARD: VIRAL KYRA & SIMRAN CHAT PREVIEW
            ======================================================== */}
        <div className="w-full my-3 text-left relative overflow-hidden rounded-2xl border-2 border-slate-200/90 bg-white shadow-xs p-3 sm:p-4">
          {/* Header of Preview Card */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="p-0.5 rounded-full insta-story-ring flex-shrink-0">
                <img
                  src="https://api.dicebear.com/7.x/adventurer/svg?seed=Kyra&backgroundColor=ffd5dc"
                  alt="@kyra.singh_"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white p-0.5 object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                    @kyra.singh_
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                  <span className="bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded border border-rose-200">
                    @simran_yadav
                  </span>
                  <span>•</span>
                  <span className="text-emerald-600 font-bold">🟢 Online</span>
                </div>
              </div>
            </div>

            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Live Preview
            </span>
          </div>

          {/* Messages Stream Sequence */}
          <div className="space-y-1.5 text-xs min-h-[150px] sm:min-h-[160px] flex flex-col justify-end">
            {/* Msg 1 (Left - @kyra.singh_) */}
            <AnimatePresence>
              {previewStep >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#F3F4F6] text-slate-900 px-3 py-1.5 rounded-2xl rounded-bl-xs max-w-[85%] sm:max-w-[78%] shadow-xs leading-relaxed text-xs">
                    Oh ye aap ho post mein? Aap toh bahut cool ho 😍
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Msg 2 (Right - You) */}
            <AnimatePresence>
              {previewStep >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-end"
                >
                  <div className="insta-chat-gradient text-white px-3 py-1.5 rounded-2xl rounded-br-xs max-w-[85%] sm:max-w-[78%] shadow-xs leading-relaxed text-xs">
                    Yes, age 20. Are you single?
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Msg 3 (Left - @kyra.singh_) */}
            <AnimatePresence>
              {previewStep >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#F3F4F6] text-slate-900 px-3 py-1.5 rounded-2xl rounded-bl-xs max-w-[85%] sm:max-w-[78%] shadow-xs leading-relaxed text-xs">
                    No I have a BF... par aap mujhe pehle nahi mile warna aapko hi bana leti 😭
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Msg 4 (Right - You) */}
            <AnimatePresence>
              {previewStep >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-end"
                >
                  <div className="insta-chat-gradient text-white px-3 py-1.5 rounded-2xl rounded-br-xs max-w-[85%] sm:max-w-[78%] shadow-xs leading-relaxed text-xs">
                    Accha aapka BF accha nahi hai kya?
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Msg 5 (Left - @kyra.singh_) */}
            <AnimatePresence>
              {previewStep >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#F3F4F6] text-slate-900 px-3 py-1.5 rounded-2xl rounded-bl-xs max-w-[85%] sm:max-w-[78%] shadow-xs leading-relaxed text-xs">
                    Accha hai par thoda rude hai aur kamata bhi nahi hai 💀
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating Reaction Pill */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-700">
              <span>🍀 Dil Garden Garden</span>
              <span>•</span>
              <span>🤝 Bhaichara On Top</span>
            </span>
          </div>
        </div>

        {/* ========================================================
            FRONT-AND-CENTER BOTTOM CTA: GOOGLE SIGN-IN BUTTON
            ======================================================== */}
        <div className="w-full space-y-2 pt-1 flex flex-col items-center">
          {/* Tactile Google Pill Button with subtle glow ring */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            className="relative group w-full sm:w-[90%] flex items-center justify-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 rounded-full bg-[#111111] hover:bg-black text-white font-extrabold text-xs sm:text-base shadow-lg transition-all disabled:opacity-50 ring-4 ring-emerald-400/20 hover:ring-emerald-400/40 touch-manipulation"
          >
            {/* Google 'G' SVG Icon */}
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="tracking-wide">
              {loading ? 'Connecting Google...' : 'Continue with Google — Start Fishing 🎣'}
            </span>
            <ArrowRight className="w-4 h-4 ml-0.5 opacity-70 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          {/* 1-Click Guest Pass */}
          <button
            onClick={handleInstantGuestLogin}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold py-1.5 px-3 rounded-full hover:bg-slate-100 transition-colors touch-manipulation"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Or 1-Tap Guest Pass (Instant Test)</span>
          </button>
        </div>

        {errorMsg && (
          <p className="mt-2 text-xs text-rose-500 font-medium">{errorMsg}</p>
        )}

        <div className="mt-2 text-[10px] sm:text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-2">
          <span>🟢 Live Firestore Queue</span>
          <span>•</span>
          <span>Anonymous 1-on-1 Chat</span>
        </div>
      </motion.div>
    </div>
  );
}
