'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PondState } from '@/types/pond';

interface PandaPondBackgroundProps {
  pondState: PondState;
}

export function PandaPondBackground({ pondState }: PandaPondBackgroundProps) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden select-none pointer-events-none">
      {/* Daylight Sunlit Pond Water Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#E0F7FA] via-[#B2EBF2] to-[#80DEEA] opacity-95" />

      {/* Sun Shimmer & Water Caustics */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)',
        }}
      />

      {/* Animated Water Ripples in Background */}
      <div className="absolute top-[35%] left-[45%]">
        <motion.div
          animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeOut' }}
          className="w-24 h-12 rounded-[100%] border-2 border-white/60 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <div className="absolute top-[60%] left-[70%]">
        <motion.div
          animate={{ scale: [1, 2.8], opacity: [0.5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeOut', delay: 1.5 }}
          className="w-28 h-14 rounded-[100%] border-2 border-white/50 -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      {/* Swimming Koi Fish Silhouettes */}
      <motion.div
        animate={{
          x: [-120, 1400],
          y: [220, 260, 210, 270],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute top-0 left-0 opacity-40"
      >
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
          <path
            d="M50 12C42 6 25 5 10 12C25 19 42 18 50 12Z"
            fill="#FF8A65"
          />
          <path
            d="M5 12L0 7L2 12L0 17L5 12Z"
            fill="#FF8A65"
          />
          <circle cx="44" cy="10" r="1.5" fill="#BF360C" />
        </svg>
      </motion.div>

      <motion.div
        animate={{
          x: [1400, -120],
          y: [420, 390, 440, 400],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'linear',
          delay: 4,
        }}
        className="absolute top-0 left-0 opacity-35"
      >
        <svg width="55" height="22" viewBox="0 0 55 22" fill="none">
          <path
            d="M5 11C13 5 30 4 45 11C30 18 13 17 5 11Z"
            fill="#FFFFFF"
          />
          <path
            d="M50 11L55 6L53 11L55 16L50 11Z"
            fill="#FFFFFF"
          />
          <circle cx="11" cy="9" r="1.5" fill="#006064" />
        </svg>
      </motion.div>

      {/* Floating Lily Pads with Pink Lotuses */}
      {/* Lily Pad 1 - Upper Right */}
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[18%] right-[15%]"
      >
        <svg width="84" height="60" viewBox="0 0 84 60">
          <path
            d="M42 30 C 15 30, 2 40, 10 50 C 25 62, 60 62, 75 50 C 82 40, 70 30, 42 30 Z"
            fill="#43A047"
            stroke="#2E7D32"
            strokeWidth="2"
          />
          {/* Pink Lotus Flower */}
          <circle cx="48" cy="38" r="8" fill="#F48FB1" />
          <circle cx="48" cy="38" r="5" fill="#F06292" />
          <circle cx="48" cy="38" r="2.5" fill="#FCE4EC" />
        </svg>
      </motion.div>

      {/* Lily Pad 2 - Lower Right */}
      <motion.div
        animate={{ y: [0, 8, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-[22%] right-[22%]"
      >
        <svg width="110" height="75" viewBox="0 0 110 75">
          <path
            d="M55 35 C 20 35, 5 48, 15 62 C 35 76, 75 76, 95 62 C 105 48, 90 35, 55 35 Z"
            fill="#388E3C"
            stroke="#1B5E20"
            strokeWidth="2.5"
          />
          <circle cx="62" cy="48" r="11" fill="#F06292" />
          <circle cx="62" cy="48" r="7" fill="#E91E63" />
          <circle cx="62" cy="48" r="3.5" fill="#FFF9C4" />
        </svg>
      </motion.div>

      {/* Lily Pad 3 - Center Pond */}
      <motion.div
        animate={{ y: [0, -5, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-[48%] left-[28%]"
      >
        <svg width="65" height="45" viewBox="0 0 65 45">
          <path
            d="M32 20 C 10 20, 2 30, 8 38 C 20 46, 45 46, 57 38 C 63 30, 54 20, 32 20 Z"
            fill="#4CAF50"
            stroke="#2E7D32"
            strokeWidth="1.5"
          />
        </svg>
      </motion.div>

      {/* ========================================================
          THE FISHING PANDA & WOODEN DOCK (Bottom Left Shore)
          ======================================================== */}
      <div className="absolute bottom-0 left-0 w-80 sm:w-96 h-80 sm:h-96 z-10">
        {/* Wooden Pier Planks */}
        <div className="absolute bottom-0 left-0 w-64 sm:w-72 h-36 bg-[#8D6E63] border-t-4 border-r-4 border-[#5D4037] shadow-xl transform -skew-x-12">
          {/* Plank lines */}
          <div className="w-full h-full divide-y-2 divide-[#6D4C41] flex flex-col justify-evenly px-2">
            <div className="h-4 border-b border-[#5D4037]/60" />
            <div className="h-4 border-b border-[#5D4037]/60" />
            <div className="h-4 border-b border-[#5D4037]/60" />
          </div>
          {/* Pier post pillar */}
          <div className="absolute -right-3 bottom-0 w-6 h-28 bg-[#5D4037] border-l-2 border-[#4E342E]" />
        </div>

        {/* The Cute Stylized SVG Panda */}
        <motion.div
          animate={
            pondState === 'bite'
              ? { rotate: [-4, 6, -4], y: [0, -8, 0] }
              : pondState === 'casting'
              ? { rotate: [-2, 2, -2], y: [0, -3, 0] }
              : { y: [0, -4, 0] }
          }
          transition={{ duration: pondState === 'bite' ? 0.3 : 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-16 left-12 w-44 h-48"
        >
          <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-md">
            {/* Panda Ears */}
            <circle cx="48" cy="42" r="18" fill="#212121" />
            <circle cx="112" cy="42" r="18" fill="#212121" />

            {/* Panda Body */}
            <ellipse cx="80" cy="120" rx="46" ry="44" fill="#FFFFFF" stroke="#212121" strokeWidth="4" />
            <path d="M42 110 C 50 145, 110 145, 118 110" fill="#212121" />

            {/* Panda Feet swinging on the dock */}
            <motion.g
              animate={
                pondState === 'bite'
                  ? { rotate: [0, 15, -15, 0] }
                  : { rotate: [0, 6, 0] }
              }
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ellipse cx="60" cy="158" rx="14" ry="10" fill="#212121" />
              <ellipse cx="100" cy="158" rx="14" ry="10" fill="#212121" />
            </motion.g>

            {/* Panda Head */}
            <circle cx="80" cy="68" r="40" fill="#FFFFFF" stroke="#212121" strokeWidth="4" />

            {/* Straw/Red Headband */}
            <path d="M 40 52 Q 80 44 120 52 L 122 62 Q 80 54 38 62 Z" fill="#EF5350" />
            <circle cx="122" cy="58" r="4" fill="#D32F2F" />

            {/* Eye Patches & Eyes */}
            <ellipse cx="62" cy="68" rx="11" ry="14" fill="#212121" transform="rotate(-15 62 68)" />
            <ellipse cx="98" cy="68" rx="11" ry="14" fill="#212121" transform="rotate(15 98 68)" />
            {/* Sparkly eye pupils */}
            <circle cx="64" cy="66" r="3.5" fill="#FFFFFF" />
            <circle cx="96" cy="66" r="3.5" fill="#FFFFFF" />

            {/* Cute Nose & Mouth */}
            <ellipse cx="80" cy="78" rx="5" ry="3.5" fill="#212121" />
            <path d="M76 83 Q 80 87 84 83" fill="none" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />

            {/* Rosy Cheeks */}
            <circle cx="50" cy="76" r="6" fill="#FF8A80" opacity="0.6" />
            <circle cx="110" cy="76" r="6" fill="#FF8A80" opacity="0.6" />

            {/* Panda Arm holding the Bamboo Rod */}
            <ellipse cx="112" cy="108" rx="12" ry="18" fill="#212121" transform="rotate(-25 112 108)" />

            {/* Bamboo Fishing Rod */}
            <motion.path
              d={
                pondState === 'bite'
                  ? 'M 105 112 Q 135 70 170 30 Q 185 10 205 -5'
                  : 'M 105 112 Q 140 75 190 40 Q 220 20 240 10'
              }
              fill="none"
              stroke="#689F38"
              strokeWidth="5"
              strokeLinecap="round"
              animate={
                pondState === 'bite'
                  ? { rotate: [-3, 8, -3], originX: '105px', originY: '112px' }
                  : { rotate: [0, 2, 0], originX: '105px', originY: '112px' }
              }
              transition={{ duration: pondState === 'bite' ? 0.25 : 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>
      </div>

      {/* ========================================================
          FISHING LINE & ANIMATED BOBBER (Reactive to pondState)
          ======================================================== */}
      {pondState !== 'idle' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Animated SVG Fishing Line stretching into center pond */}
          <svg className="w-full h-full">
            <motion.path
              d="M 230 140 Q 400 120 540 280"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              animate={
                pondState === 'bite'
                  ? { d: ['M 230 140 Q 380 90 540 280', 'M 230 140 Q 420 150 540 280', 'M 230 140 Q 380 90 540 280'] }
                  : { d: ['M 230 140 Q 400 115 540 280', 'M 230 140 Q 400 125 540 280', 'M 230 140 Q 400 115 540 280'] }
              }
              transition={{ duration: pondState === 'bite' ? 0.3 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>

          {/* Floating Red-and-White Fishing Bobber */}
          <div className="absolute top-[280px] left-[540px] -translate-x-1/2 -translate-y-1/2">
            {/* Concentric Water Rings around bobber */}
            <motion.div
              animate={{ scale: [0.8, 2.2], opacity: [0.8, 0] }}
              transition={{ duration: pondState === 'bite' ? 0.6 : 2.2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute -inset-4 rounded-full border-2 border-white/70 pointer-events-none"
            />
            <motion.div
              animate={{ scale: [0.8, 2.6], opacity: [0.6, 0] }}
              transition={{ duration: pondState === 'bite' ? 0.6 : 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
              className="absolute -inset-4 rounded-full border border-white/50 pointer-events-none"
            />

            {/* The Bobber */}
            <motion.div
              animate={
                pondState === 'bite'
                  ? { y: [-15, 20, -10, 15, 0], scale: [1, 1.25, 0.95, 1.1, 1] }
                  : { y: [-3, 3, -3] }
              }
              transition={{ duration: pondState === 'bite' ? 0.4 : 2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-slate-700/40 shadow-lg"
            >
              <div className="w-full h-1/2 bg-[#E53935]" />
              <div className="w-full h-1/2 bg-[#FFFFFF]" />
              {/* Little antenna pin */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-1 h-3 bg-amber-400" />
            </motion.div>

            {/* Splash Droplets on BITE */}
            <AnimatePresence>
              {pondState === 'bite' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -30, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 font-mono font-black text-xl text-amber-500 drop-shadow-md"
                  >
                    BITE! 🐟
                  </motion.div>
                  <motion.div
                    animate={{ scale: [0.5, 2], opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="absolute -inset-6 rounded-full border-2 border-cyan-200"
                  />
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

