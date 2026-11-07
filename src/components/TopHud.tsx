'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Fish, LogOut, Sparkles } from 'lucide-react';
import { UserProfile } from '@/types/pond';

interface TopHudProps {
  userProfile: UserProfile | null;
  onSignOut?: () => void;
  onResetIdentity?: () => void;
}

export function TopHud({ userProfile, onSignOut }: TopHudProps) {
  return (
    <header className="relative z-20 w-full px-4 sm:px-8 py-3 flex items-center justify-between">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-3">
        <motion.div 
          whileHover={{ scale: 1.04, rotate: -1 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
            🎣
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              CATCH ME IF YOU CAN
            </span>
            <span className="hidden md:inline-block ml-2 text-[10px] uppercase tracking-wider font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Pond Chat
            </span>
          </div>
        </motion.div>
      </div>

      {/* Right HUD Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Online Badge: ( 🟢 1,420 Online ) */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-xs font-bold text-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px] sm:text-xs tracking-tight">1,420 Online</span>
        </div>

        {/* User Stats if Logged In */}
        {userProfile && (
          <>
            {/* Fish Caught Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-700">
              <Fish className="w-3.5 h-3.5 text-sky-500" />
              <span className="font-bold text-slate-900">{userProfile.fishCaught || 0}</span>
              <span className="text-[10px] text-slate-500 uppercase">caught</span>
            </div>

            {/* Streak & XP */}
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-xs">
              <span className="flex items-center gap-1 font-bold text-amber-600">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
                {userProfile.streak || 0}
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 font-bold text-indigo-600">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                {userProfile.xp || 0} XP
              </span>
            </div>

            {/* User Profile Mini Pill & Sign Out */}
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md pl-1.5 pr-2 py-1 rounded-full border border-slate-200/80 shadow-sm">
              <img
                src={userProfile.avatar}
                alt={userProfile.displayName}
                className="w-6 h-6 rounded-full border border-slate-200 object-cover"
              />
              <span className="hidden md:inline-block text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                {userProfile.username}
              </span>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  title="Sign Out"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors ml-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
