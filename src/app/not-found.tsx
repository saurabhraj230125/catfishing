import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#E0F7FA] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-900/10 shadow-[0_20px_50px_rgba(0,131,143,0.18)] p-6 sm:p-8 max-w-md w-full">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-4xl shadow-inner">
          🐟
        </div>
        
        <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          404 • Missing Pond Line
        </span>

        <h1 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
          Machhli Paani Mein Gayi!
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium">
          The page you are looking for swam away or does not exist in the pond.
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold text-sm shadow-md transition-all"
          >
            <span>🎣 Return to Pond Chat</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
