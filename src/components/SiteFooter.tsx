'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Info, FileText, Mail, BookOpen, Heart } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="relative z-20 w-full mt-auto py-6 px-4 border-t border-slate-200/80 bg-white/70 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-slate-600">
        {/* Brand & Mission Brief */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <div className="flex items-center gap-1.5 font-black text-slate-800">
            <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-teal-500 flex items-center justify-center text-white text-[10px]">
              🎣
            </span>
            <span>CATCH ME IF YOU CAN</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="text-[11px] text-slate-500">
            Cozy Pond Social Deduction Chat
          </span>
        </div>

        {/* Clean Legal & Trust Navigation Links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-700">
          <Link
            href="/about"
            className="hover:text-teal-700 transition-colors flex items-center gap-1"
          >
            <Info className="w-3 h-3 text-teal-600" />
            <span>About Us</span>
          </Link>

          <Link
            href="/how-to-play"
            className="hover:text-teal-700 transition-colors flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3 text-teal-600" />
            <span>How to Play</span>
          </Link>

          <Link
            href="/safety"
            className="hover:text-teal-700 transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Safety Rules</span>
          </Link>

          <Link
            href="/privacy"
            className="hover:text-teal-700 transition-colors flex items-center gap-1"
          >
            <FileText className="w-3 h-3 text-sky-600" />
            <span>Privacy Policy</span>
          </Link>

          <Link
            href="/terms"
            className="hover:text-teal-700 transition-colors flex items-center gap-1"
          >
            <FileText className="w-3 h-3 text-slate-600" />
            <span>Terms of Service</span>
          </Link>

          <Link
            href="/contact"
            className="hover:text-teal-700 transition-colors flex items-center gap-1"
          >
            <Mail className="w-3 h-3 text-amber-600" />
            <span>Contact</span>
          </Link>
        </nav>
      </div>

      {/* Disclaimers & Copyright */}
      <div className="max-w-5xl mx-auto mt-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 text-center sm:text-left">
        <p>
          © 2026 Catch Me If You Can. Built for authentic, safe social deduction gaming. Google AdSense & Analytics enabled.
        </p>
        <p className="flex items-center gap-1 text-slate-400">
          <span>Crafted with</span>
          <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
          <span>for fair players worldwide</span>
        </p>
      </div>
    </footer>
  );
}
