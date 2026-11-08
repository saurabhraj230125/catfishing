'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, PresentedGender } from '@/types/pond';
import { isLiveFirebaseConfigured } from '@/lib/firebase';
import { ArrowLeft, Users, Lightbulb, SlidersHorizontal, Globe2 } from 'lucide-react';

interface MatchmakingRadarProps {
  currentUser: UserProfile;
  statusText: string;
  isBite: boolean;
  ignoreGenderFilter: boolean;
  onToggleIgnoreGender: () => void;
  onCancel: () => void;
}

const HINGLISH_LOADING_TIPS = [
  "Pro Tip: Ask them 'Aap mujhe pehle kyu nahi mile?' to test their loyalty... 👀",
  "Did you know? Catfishers delete their message 3x more when asked about their real city... 📚",
  "Loyalty Rule #1: Agar bol rahe hai 'I have a BF par aap cute ho', pakka katega... 💀",
  "Quick Test: 'Pani Puri, Golgappa, ya Puchka?' Sahi choice se character pata chalta hai! 💥",
  "Catfisher Alert: Agar bol rahe hai 'Mera ex rude tha aur kamata bhi nahi tha', run! 🏃",
];

export function MatchmakingRadar({
  currentUser,
  statusText,
  isBite,
  ignoreGenderFilter,
  onToggleIgnoreGender,
  onCancel,
}: MatchmakingRadarProps) {
  const oppositeGender: PresentedGender =
    currentUser.presentedGender === 'boy' ? 'girl' : 'boy';

  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % HINGLISH_LOADING_TIPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative z-10 w-full max-w-md mx-auto px-4 py-5 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: isBite ? [-6, 6, -6, 6, 0] : 0,
        }}
        transition={{ duration: isBite ? 0.3 : 0.4 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-900/10 shadow-[0_20px_50px_rgba(0,131,143,0.18)] p-6 sm:p-8"
      >
        {/* Animated Ripple Water Rings in Center of Card */}
        <div className="relative w-36 h-36 mx-auto mb-3 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 2.3], opacity: [0.75, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full border-2 border-teal-400/60"
          />
          <motion.div
            animate={{ scale: [1, 2.7], opacity: [0.55, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.7 }}
            className="absolute inset-0 rounded-full border border-cyan-400/40"
          />

          {/* User Avatar with Story Ring */}
          <div className="relative z-10 p-1.5 rounded-full insta-story-ring shadow-lg">
            <div className="w-20 h-20 rounded-full bg-white p-1">
              <img
                src={currentUser.avatar}
                alt={currentUser.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-sm shadow">
              {isBite ? '🐟' : '🎣'}
            </div>
          </div>
        </div>

        {/* Dynamic Status Text */}
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {isBite ? 'MACHHLI FAS GAYI! REELING IN...' : 'FISHING IN THE POND...'}
        </h3>

        {/* Gender pairing info */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-black text-teal-800">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>
              {ignoreGenderFilter
                ? 'ANY ↔ ANY (Filter Off)'
                : `${currentUser.presentedGender.toUpperCase()} ↔ ${oppositeGender.toUpperCase()} Pairing`}
            </span>
          </div>

          {/* Connectivity Badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-white shadow-2xs">
            <Globe2 className="w-3 h-3 text-indigo-500" />
            {isLiveFirebaseConfigured ? (
              <span className="text-emerald-700 font-extrabold">Live Firebase Online</span>
            ) : (
              <span className="text-sky-700 font-extrabold">Local Multi-Tab Mesh</span>
            )}
          </div>
        </div>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xs mx-auto font-semibold leading-relaxed">
          {statusText}
        </p>

        {/* Testing Fallback Toggle: Match with Anyone (Ignore Gender Filter) */}
        {!isBite && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-center">
            <button
              onClick={onToggleIgnoreGender}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                ignoreGenderFilter
                  ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3 text-purple-600" />
              <span>
                {ignoreGenderFilter
                  ? '✓ Gender Filter Ignored (Matching with Anyone)'
                  : '⚡ Match with Anyone (Ignore Gender Filter)'}
              </span>
            </button>
          </div>
        )}

        {/* Rotating Hinglish Tips */}
        {!isBite && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-left min-h-[58px] flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <AnimatePresence>
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs text-amber-900 font-semibold leading-relaxed"
              >
                {HINGLISH_LOADING_TIPS[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        )}

        {/* Cancel Button */}
        {!isBite && (
          <div className="mt-3.5 pt-2">
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-1.5 px-3.5 rounded-xl hover:bg-slate-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Reel Line Back In</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
