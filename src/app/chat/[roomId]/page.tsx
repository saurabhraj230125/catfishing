'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DirectChatRoomRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#E0F7FA] flex flex-col items-center justify-center">
      <div className="p-6 rounded-3xl bg-white/95 border border-slate-200 shadow-xl text-center space-y-3">
        <span className="w-3 h-3 rounded-full bg-teal-500 inline-block animate-ping" />
        <p className="text-sm font-bold text-slate-800">
          Entering Pond Chat...
        </p>
      </div>
    </div>
  );
}
