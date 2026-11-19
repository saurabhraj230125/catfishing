'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error' | 'warning';
}

const TOAST_EVENT = '__catfisher_toast_event';

export function showToast(message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent(TOAST_EVENT, {
    detail: { id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, message, type },
  });
  window.dispatchEvent(event);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (!customEvent.detail) return;

      const newToast = customEvent.detail;
      setToasts((prev) => [...prev.slice(-2), newToast]); // keep max 3 visible

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3200);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[120] flex flex-col items-center gap-2 pointer-events-none px-4 w-full max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          let badgeBg = 'bg-slate-900/95 border-slate-700 text-white';
          if (toast.type === 'success') {
            badgeBg = 'bg-slate-900/95 border-emerald-500/60 text-white shadow-emerald-500/10';
          } else if (toast.type === 'error') {
            badgeBg = 'bg-rose-950/95 border-rose-500/60 text-white shadow-rose-500/10';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.92 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto px-4 py-2 rounded-full border shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-black tracking-wide ${badgeBg}`}
            >
              <span>{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

