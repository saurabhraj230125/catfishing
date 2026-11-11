'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithGoogle } from '@/lib/firebase';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Download, 
  ShieldCheck, 
  Fish, 
  MessageCircle, 
  Trophy 
} from 'lucide-react';
import { playCastSound, playReactionSound } from '@/lib/soundEffects';
import { trackEvent } from '@/lib/analytics';
import { InstallAppModal } from '@/components/InstallAppModal';

interface LandingHeroProps {
  onAuthenticated: (user: { uid: string; displayName: string; email?: string; photoURL?: string }) => void;
}

export function LandingHero({ onAuthenticated }: LandingHeroProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Smooth 3-step viral Hinglish chat preview loop
  const [previewStep, setPreviewStep] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewStep((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 2800);

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
    trackEvent('login_google_click');

    try {
      const user = await signInWithGoogle();
      const tabSuffix = getTabSuffix();
      playCastSound();
      trackEvent('login_google_success', { uid: user.uid });
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
    trackEvent('login_guest_click');
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

  const handleOpenInstallModal = () => {
    playReactionSound();
    trackEvent('hero_install_app_clicked');
    setIsInstallModalOpen(true);
  };

  return (
    <div className="relative z-10 w-full max-w-xl mx-auto px-3 sm:px-5 py-3 sm:py-6 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full bg-white/95 backdrop-blur-xl rounded-3xl sm:rounded-[32px] border-2 border-slate-900/10 shadow-[0_20px_60px_rgba(0,131,143,0.18)] p-5 sm:p-8 text-center flex flex-col items-center space-y-4 sm:space-y-5"
      >
        {/* ========================================================
            1. TOP BADGE & HERO HEADLINE
            ======================================================== */}
        <div className="flex flex-col items-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-100 via-rose-100 to-teal-100 border border-amber-300/70 text-[11px] sm:text-xs font-black text-amber-950 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>BOY ↔ GIRL • CATFISH & LOYALTY ROULETTE</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Pehchano Kaun Hai Screen Ke Peeche? 🎣
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md font-medium leading-relaxed">
            Cast your line into the pond. Chat with real strangers, spot the undercover Catfisher, or deceive them to win XP!
          </p>
        </div>

        {/* ========================================================
            2. VIBRANT, CLEAN VIRAL CHAT PREVIEW (UN-CONGESTED & ATTRACTIVE)
            ======================================================== */}
        <div className="w-full text-left rounded-2xl border-2 border-slate-200/90 bg-gradient-to-b from-slate-50/70 to-white shadow-xs p-3.5 sm:p-4 overflow-hidden">
          {/* Header of Chat Preview */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="p-0.5 rounded-full insta-story-ring flex-shrink-0">
                <img
                  src="https://api.dicebear.com/7.x/adventurer/svg?seed=Kyra&backgroundColor=ffd5dc"
                  alt="@kyra.singh_"
                  className="w-8 h-8 rounded-full bg-white p-0.5 object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Kyra (@kyra.singh_)
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                  <span className="bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded border border-rose-200 font-bold text-[9px]">
                    GIRL
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">🟢 Active in Pond</span>
                </div>
              </div>
            </div>

            <span className="text-[10px] uppercase font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Live Demo
            </span>
          </div>

          {/* Messages Stream: 3 Clean, Entertaining Hinglish Bubbles */}
          <div className="space-y-2 text-xs min-h-[120px] flex flex-col justify-end">
            {/* Bubble 1: Left */}
            <AnimatePresence>
              {previewStep >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-slate-200 text-slate-900 px-3 py-1.5 rounded-2xl rounded-bl-xs max-w-[85%] sm:max-w-[80%] shadow-2xs leading-relaxed text-xs font-medium">
                    Aap mujhe pehle nahi mile warna aapko hi bana leti 😭
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bubble 2: Right (You) */}
            <AnimatePresence>
              {previewStep >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-end"
                >
                  <div className="insta-chat-gradient text-white px-3 py-1.5 rounded-2xl rounded-br-xs max-w-[85%] sm:max-w-[80%] shadow-xs leading-relaxed text-xs font-semibold">
                    Accha? BF accha nahi hai kya aapka? 👀
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bubble 3: Left */}
            <AnimatePresence>
              {previewStep >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-slate-200 text-slate-900 px-3 py-1.5 rounded-2xl rounded-bl-xs max-w-[85%] sm:max-w-[80%] shadow-2xs leading-relaxed text-xs font-medium">
                    Accha hai par thoda rude hai aur kamata bhi nahi hai 💀
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Deduction Prediction Banner */}
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-500">Your Deduction:</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-extrabold">
                ✨ Asli (72%)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-extrabold">
                🎭 Catfish (28%)
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            3. HOW IT WORKS (3 CLEAR, SPACIOUS STEPS)
            ======================================================== */}
        <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 py-1 text-center">
          <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200/80 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mb-1 text-sm">
              🎣
            </div>
            <span className="font-extrabold text-xs text-slate-900">1. Cast Line</span>
            <span className="text-[10px] text-slate-500 font-medium">Boy ↔ Girl match</span>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200/80 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-1 text-sm">
              💬
            </div>
            <span className="font-extrabold text-xs text-slate-900">2. Chat & Flirt</span>
            <span className="text-[10px] text-slate-500 font-medium">Loyalty test</span>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200/80 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center mb-1 text-sm">
              🏆
            </div>
            <span className="font-extrabold text-xs text-slate-900">3. Deduce</span>
            <span className="text-[10px] text-slate-500 font-medium">Win +50 XP</span>
          </div>
        </div>

        {/* ========================================================
            4. THE GRAND CALL-TO-ACTION (LITTLE BIG & DOWN AS REQUESTED)
            ======================================================== */}
        <div className="w-full space-y-3 pt-1 flex flex-col items-center">
          {/* Big, Luxurious Google Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            className="relative group w-full max-w-md mx-auto flex items-center justify-center gap-3.5 px-6 py-4 rounded-full bg-slate-900 hover:bg-black text-white font-extrabold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 ring-4 ring-emerald-400/30 hover:ring-emerald-400/50 touch-manipulation cursor-pointer"
          >
            {/* Google 'G' SVG Icon */}
            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" viewBox="0 0 24 24">
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
            <span className="tracking-tight">
              {loading ? 'Connecting Google...' : 'Sign In with Google — Enter Pond 🎣'}
            </span>
            <ArrowRight className="w-5 h-5 ml-0.5 opacity-80 group-hover:translate-x-1.5 transition-transform" />
          </motion.button>

          {/* Quick Sub-Actions (Clean & Airy) */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              onClick={handleInstantGuestLogin}
              type="button"
              className="inline-flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-full hover:bg-slate-100 transition-colors touch-manipulation cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Or 1-Tap Guest Pass (Instant Test)</span>
            </button>

            <span className="hidden sm:inline text-slate-300">•</span>

            <button
              onClick={handleOpenInstallModal}
              type="button"
              className="inline-flex items-center gap-1.5 font-bold text-teal-700 hover:text-teal-900 px-3 py-1.5 rounded-full hover:bg-teal-50 transition-colors touch-manipulation cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Install App / Icon</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-500 font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            {errorMsg}
          </p>
        )}

        {/* ========================================================
            5. FOOTER TRUST & STATUS BADGES
            ======================================================== */}
        <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Pond Matchmaking
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            100% Anonymous
          </span>
          <span>•</span>
          <span>Zero Download Required</span>
        </div>
      </motion.div>

      {/* App Install & Icon Download Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
