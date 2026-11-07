'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithGoogle } from '@/lib/firebase';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      onAuthenticated({
        uid: user.uid,
        displayName: user.displayName || 'Angler',
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
      });
    } catch (err: any) {
      console.warn('Google sign-in popup notice:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled. Please click again to continue.');
      } else {
        // Smooth fallback for offline/demo environment testing
        handleInstantGuestLogin();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInstantGuestLogin = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const guestUid = `user_${Date.now()}_${randomSuffix}`;
    onAuthenticated({
      uid: guestUid,
      displayName: `Player ${randomSuffix}`,
      email: `player_${randomSuffix}@pondchat.app`,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=Pond${randomSuffix}&backgroundColor=b6e3f4`,
    });
  };

  return (
    <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-900/10 shadow-[0_20px_50px_rgba(0,131,143,0.16)] p-5 sm:p-7 text-center flex flex-col items-center"
      >
        {/* Floating Top Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 via-rose-100 to-teal-100 border border-amber-300/60 text-xs font-black text-amber-900 mb-2.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>BOY-MEETS-GIRL • CATFISH & LOYALTY ROULETTE</span>
        </div>

        {/* Top/Center of Hero Headlines */}
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight max-w-xl">
          Fake Rich Boy Banoge ya Loyalty Test Karoge?
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed font-medium">
          Cast your line into the pond. Chat with real strangers, pull off the ultimate Catfish prank, aur dekho kiska kat-ta hai!
        </p>

        {/* ========================================================
            CENTER SHOWCASE CARD: VIRAL KYRA & SIMRAN CHAT PREVIEW
            ======================================================== */}
        <div className="w-full my-4 text-left relative overflow-hidden rounded-2xl border-2 border-slate-200/90 bg-white shadow-md p-3.5 sm:p-4">
          {/* Header of Preview Card */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-0.5 rounded-full insta-story-ring">
                <img
                  src="https://api.dicebear.com/7.x/adventurer/svg?seed=Kyra&backgroundColor=ffd5dc"
                  alt="@kyra.singh_"
                  className="w-9 h-9 rounded-full bg-white p-0.5 object-cover"
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

            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Live Preview
            </span>
          </div>

          {/* Messages Stream Sequence */}
          <div className="space-y-2 text-xs min-h-[175px] flex flex-col justify-end">
            {/* Msg 1 (Left - @kyra.singh_) */}
            <AnimatePresence>
              {previewStep >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#F3F4F6] text-slate-900 px-3.5 py-2 rounded-2xl rounded-bl-xs max-w-[85%] sm:max-w-[78%] shadow-sm leading-relaxed">
                    Oh ye aap ho post mein? Aap toh bahut cool ho 😍
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Msg 2 (Right - You) */}
            <AnimatePresence>
              {previewStep >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-end"
                >
                  <div className="insta-chat-gradient text-white px-3.5 py-2 rounded-2xl rounded-br-xs max-w-[85%] sm:max-w-[78%] shadow-sm leading-relaxed">
                    Yes, age 20. Are you single?
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Msg 3 (Left - @kyra.singh_) */}
            <AnimatePresence>
              {previewStep >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#F3F4F6] text-slate-900 px-3.5 py-2 rounded-2xl rounded-bl-xs max-w-[85%] sm:max-w-[78%] shadow-sm leading-relaxed">
                    No I have a BF... par aap mujhe pehle nahi mile warna aapko hi bana leti 😭
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Msg 4 (Right - You) */}
            <AnimatePresence>
              {previewStep >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-end"
                >
                  <div className="insta-chat-gradient text-white px-3.5 py-2 rounded-2xl rounded-br-xs max-w-[85%] sm:max-w-[78%] shadow-sm leading-relaxed">
                    Accha aapka BF accha nahi hai kya?
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Msg 5 (Left - @kyra.singh_) */}
            <AnimatePresence>
              {previewStep >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#F3F4F6] text-slate-900 px-3.5 py-2 rounded-2xl rounded-bl-xs max-w-[85%] sm:max-w-[78%] shadow-sm leading-relaxed">
                    Accha hai par thoda rude hai aur kamata bhi nahi hai 💀
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating Reaction Pill */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-teal-200 text-[11px] font-black text-slate-800 shadow-xs">
              <span>🍀 Dil Garden Garden Ho Raha Hai!</span>
              <span>|</span>
              <span>🤝 Bhaichara On Top</span>
            </span>
          </div>
        </div>

        {/* ========================================================
            FRONT-AND-CENTER BOTTOM CTA: GOOGLE SIGN-IN BUTTON
            ======================================================== */}
        <div className="w-full space-y-2.5 pt-1 flex flex-col items-center">
          {/* Massive Tactile Google Pill Button with subtle glow ring */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="relative group w-full sm:w-[85%] flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-[#111111] hover:bg-black text-white font-extrabold text-sm sm:text-base shadow-xl transition-all disabled:opacity-50 ring-4 ring-emerald-400/20 hover:ring-emerald-400/40"
          >
            {/* Google 'G' SVG Icon */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
              {loading ? 'Connecting with Google...' : 'Continue with Google — Start Fishing 🎣'}
            </span>
            <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          {/* Discrete 1-Click Guest/Test Login for multi-browser testing */}
          <button
            onClick={handleInstantGuestLogin}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold py-1 px-3 rounded-full hover:bg-slate-100 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Or quick-enter as Guest for multi-browser testing</span>
          </button>
        </div>

        {errorMsg && (
          <p className="mt-2 text-xs text-rose-500 font-medium">{errorMsg}</p>
        )}

        <div className="mt-3 text-[11px] text-slate-500 font-semibold">
          🔒 Real-time Firestore matching • 100% Anonymous • Boy ↔ Girl live connections
        </div>
      </motion.div>
    </div>
  );
}
