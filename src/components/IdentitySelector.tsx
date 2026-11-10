'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SecretIdentity } from '@/types/pond';
import { Sparkles, ArrowLeft, UserCheck, VenetianMask } from 'lucide-react';

interface IdentitySelectorProps {
  onIdentitySelected: (identity: SecretIdentity) => void;
  onBack: () => void;
}

export function IdentitySelector({ onIdentitySelected, onBack }: IdentitySelectorProps) {
  const [normalImgError, setNormalImgError] = useState(false);
  const [catfisherImgError, setCatfisherImgError] = useState(false);

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-900/10 shadow-[0_20px_50px_rgba(0,131,143,0.16)] p-4 sm:p-7"
      >
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <button
            onClick={onBack}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors p-1.5 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Step 1 of 2: Secret Role
          </span>
        </div>

        <div className="text-center max-w-md mx-auto mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            CHOOSE YOUR SECRET ROLE
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
            Kaunsa role play karna hai? Your true role is hidden from your stranger until the chat ends.
          </p>
        </div>

        {/* Two Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* 1. "Normal" Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onIdentitySelected('normal')}
            className="group cursor-pointer rounded-3xl border-2 border-sky-300 hover:border-sky-500 bg-gradient-to-b from-sky-50/60 via-white to-sky-50/30 p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between touch-manipulation"
          >
            <div>
              {/* Image Container */}
              <div className="relative w-full aspect-[16/9] sm:aspect-[4/3] rounded-2xl bg-gradient-to-tr from-sky-100 to-indigo-100 border border-sky-200 overflow-hidden mb-3 sm:mb-4 flex items-center justify-center">
                {!normalImgError ? (
                  <img
                    src="/images/normal-card.png"
                    alt="Normal Identity"
                    onError={() => setNormalImgError(true)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center">
                    <img
                      src="https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav&backgroundColor=b6e3f4"
                      alt="Normal Fallback"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-sky-300 shadow"
                    />
                    <span className="mt-1.5 text-xs font-black text-sky-800">ASLI IDENTITY</span>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 bg-sky-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                  100% Asli
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-sky-500/10 text-sky-600">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                  Normal
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                Yahan imaandari chalta hai babu! Chat as the real you & test their loyalty.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-sky-800 bg-sky-100/90 px-2.5 py-0.5 rounded-lg">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600" />
                +50 XP if you spot Catfisher
              </span>
              <span className="text-xs font-black text-sky-600 group-hover:translate-x-1 transition-transform">
                Select →
              </span>
            </div>
          </motion.div>

          {/* 2. "Catfisher" Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onIdentitySelected('catfisher')}
            className="group cursor-pointer rounded-3xl border-2 border-rose-300 hover:border-rose-500 bg-gradient-to-b from-rose-50/60 via-white to-rose-50/30 p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between touch-manipulation"
          >
            <div>
              {/* Image Container */}
              <div className="relative w-full aspect-[16/9] sm:aspect-[4/3] rounded-2xl bg-gradient-to-tr from-rose-100 to-amber-100 border border-rose-200 overflow-hidden mb-3 sm:mb-4 flex items-center justify-center">
                {!catfisherImgError ? (
                  <img
                    src="/images/catfisher-card.png"
                    alt="Catfisher Identity"
                    onError={() => setCatfisherImgError(true)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center">
                    <img
                      src="https://api.dicebear.com/7.x/adventurer/svg?seed=Kyra&backgroundColor=ffd5dc"
                      alt="Catfisher Fallback"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-rose-300 shadow"
                    />
                    <span className="mt-1.5 text-xs font-black text-rose-800">FULL GOLMAAL</span>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 bg-rose-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                  Secret Disguise
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-600">
                  <VenetianMask className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                  Catfisher
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                Fake Rich Boy ya Fake Girl! Put on a mask, bait the stranger, aur dekho kaun phasta hai.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-rose-800 bg-rose-100/90 px-2.5 py-0.5 rounded-lg">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" />
                +100 XP if disguise succeeds
              </span>
              <span className="text-xs font-black text-rose-600 group-hover:translate-x-1 transition-transform">
                Select →
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
