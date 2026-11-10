'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Pond App Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#E0F7FA] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-900/10 shadow-[0_20px_50px_rgba(0,131,143,0.18)] p-6 sm:p-8 max-w-md w-full">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-4xl shadow-inner">
          ⚠️
        </div>

        <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          Pond Connection Glitch
        </span>

        <h2 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
          Fishing Line Tangled!
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium">
          A temporary glitch occurred while connecting to the pond. Click below to untangle and reload.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() => reset()}
            className="w-full py-3 px-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md transition-all"
          >
            🔄 Untangle & Retry
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-2.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}

