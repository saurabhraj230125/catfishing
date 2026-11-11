'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SiteFooter } from '@/components/SiteFooter';

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  badge?: string;
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  subtitle,
  lastUpdated = 'November 2026',
  badge = 'Official Document',
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#E0F7FA] text-slate-900 selection:bg-teal-300 selection:text-slate-900">
      {/* Top Header */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 group hover:opacity-95 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            🎣
          </div>
          <div className="flex flex-col text-left">
            <span className="font-black text-sm tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
              CATCH ME IF YOU CAN
            </span>
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
              Pond Chat Arena
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-xs transition-transform active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Enter Pond</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        <article className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-900/10 shadow-[0_20px_60px_rgba(0,131,143,0.12)] p-6 sm:p-10 text-left">
          {/* Document Header */}
          <header className="border-b border-slate-200 pb-6 mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-black uppercase tracking-wider mb-3">
              <span>{badge}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              {subtitle}
            </p>
            <div className="mt-4 text-[11px] font-bold text-slate-400">
              Last Updated & Reviewed: {lastUpdated}
            </div>
          </header>

          {/* Document Body */}
          <div className="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
            {children}
          </div>
        </article>
      </main>

      {/* Consistent Footer */}
      <SiteFooter />
    </div>
  );
}
