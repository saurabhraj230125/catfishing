'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Fish, LogOut, Sparkles } from 'lucide-react';
import { UserProfile } from '@/types/pond';

interface TopHudProps {
  userProfile: UserProfile | null;
  authAccount?: { displayName?: string; photoURL?: string; email?: string } | null;
  onSignOut?: () => void;
  onResetIdentity?: () => void;
}

export function TopHud({ userProfile, authAccount, onSignOut }: TopHudProps) {
  return (
    <header className="relative z-20 w-full px-3 sm:px-6 md:px-8 py-2 sm:py-3 flex items-center justify-between gap-2 select-none">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-2">
        <motion.div 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-xs"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-inner flex-shrink-0">
            🎣
          </div>
          <div className="flex items-center">
            {/* Short brand on mobile, full on desktop */}
            <span className="font-black text-xs sm:text-sm tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              <span className="inline sm:hidden">CATCH ME</span>
              <span className="hidden sm:inline">CATCH ME IF YOU CAN</span>
            </span>
            <span className="hidden md:inline-block ml-2 text-[9px] uppercase tracking-wider font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Pond Chat
            </span>
          </div>
        </motion.div>
      </div>

      {/* Right HUD Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Live Online Badge */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200/90 shadow-xs text-xs font-bold text-slate-800 flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px] sm:text-xs tracking-tight">
            <span className="hidden sm:inline">1,420 Online</span>
            <span className="inline sm:hidden">1.4k</span>
          </span>
        </div>

        {/* User Stats if Logged In */}
        {userProfile ? (
          <>
            {/* Fish Caught Badge (hidden on mobile, shown on tablet/desktop) */}
            <div className="hidden md:flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-200/90 shadow-xs text-xs font-semibold text-slate-700">
              <Fish className="w-3.5 h-3.5 text-sky-500" />
              <span className="font-bold text-slate-900">{userProfile.fishCaught || 0}</span>
              <span className="text-[10px] text-slate-500 uppercase">caught</span>
            </div>

            {/* Streak & XP (compact on mobile) */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200/90 shadow-xs text-xs">
              <span className="flex items-center gap-1 font-bold text-amber-600">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span className="font-mono">{userProfile.streak || 0}</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 font-bold text-indigo-600">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span className="font-mono">{userProfile.xp || 0}</span>
                <span className="hidden sm:inline">XP</span>
              </span>
            </div>

            {/* User Profile Mini Pill & Sign Out */}
            <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md pl-1.5 pr-1.5 py-1 rounded-full border border-slate-200/90 shadow-xs">
              <img
                src={userProfile.avatar}
                alt={userProfile.displayName}
                className="w-6 h-6 rounded-full border border-slate-200 object-cover flex-shrink-0"
              />
              <span className="hidden lg:inline-block text-xs font-semibold text-slate-800 max-w-[90px] truncate ml-0.5">
                {userProfile.username}
              </span>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  title="Sign Out"
                  type="button"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors ml-0.5 touch-manipulation"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        ) : authAccount ? (
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md pl-1.5 pr-2 py-1 rounded-full border border-slate-200/90 shadow-xs">
            {authAccount.photoURL ? (
              <img
                src={authAccount.photoURL}
                alt="Account"
                className="w-6 h-6 rounded-full border border-slate-200 object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {authAccount.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 max-w-[100px] truncate">
              {authAccount.displayName}
            </span>
            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign Out"
                type="button"
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors ml-0.5 touch-manipulation"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
