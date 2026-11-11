'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  X, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';
import { playReactionSound, triggerHaptic } from '@/lib/soundEffects';
import { trackEvent } from '@/lib/analytics';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isApple = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isApple);

      // Check if already in standalone display
      const isStandalone =
        (window.navigator as any).standalone === true ||
        window.location.search.includes('standalone');
      if (isStandalone) {
        setIsInstalled(true);
      }

      // Listen for PWA prompt event
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        trackEvent('app_installed');
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const handleTriggerInstall = async () => {
    triggerHaptic('medium');
    playReactionSound();
    trackEvent('app_install_clicked', { platform: isIos ? 'ios' : 'browser' });

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          trackEvent('app_install_accepted');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
  };

  const handleDownloadIcon = () => {
    triggerHaptic('light');
    playReactionSound();
    trackEvent('app_icon_downloaded');

    const link = document.createElement('a');
    link.href = '/icon.svg';
    link.download = 'catch-me-if-you-can-icon.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 text-slate-800 overflow-hidden"
          >
            {/* Top Close Button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              type="button"
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>

            {/* App Icon Banner Preview */}
            <div className="flex flex-col items-center text-center mb-4">
              <div className="relative mb-3">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-cyan-400 via-teal-400 to-sky-500 p-1 shadow-lg ring-4 ring-teal-100">
                  <img
                    src="/icon.svg"
                    alt="Catch Me Icon"
                    className="w-full h-full rounded-[22px] object-cover shadow-inner"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full border border-white shadow">
                  HD SVG
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Install Catch Me If You Can
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
                Add to your home screen for full-screen arcade chat with zero browser bars!
              </p>
            </div>

            {/* Install Actions Box */}
            <div className="space-y-3">
              {isInstalled ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>App is already installed on this device! Launch it from your home screen.</span>
                </div>
              ) : isIos ? (
                /* iOS Safari instructions */
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 space-y-2 text-xs text-sky-950">
                  <div className="font-extrabold flex items-center gap-1.5 text-sky-900">
                    <Smartphone className="w-4 h-4 text-sky-600" />
                    <span>How to install on iPhone & iPad:</span>
                  </div>
                  <ol className="space-y-1.5 pl-1 font-semibold text-[11px] sm:text-xs">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-900 flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</span>
                      <span>Tap the <strong>Share</strong> button <Share className="inline w-3.5 h-3.5 text-sky-600" /> in Safari</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-900 flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
                      <span>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="inline w-3.5 h-3.5 text-sky-600" /></span>
                    </li>
                  </ol>
                </div>
              ) : deferredPrompt ? (
                /* Native PWA Prompt Available */
                <button
                  onClick={handleTriggerInstall}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-extrabold text-sm py-3 px-4 rounded-2xl shadow-md transition-all touch-manipulation ring-2 ring-teal-200"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Install App to Home Screen</span>
                </button>
              ) : (
                /* Desktop Chrome/Edge or standard browser guide */
                <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-3 text-xs text-teal-900 font-semibold space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Fast Web App (PWA):</span>
                  </div>
                  <p className="text-[11px] text-teal-800">
                    Click the install icon in your browser URL bar or tap <strong>Add to Home screen</strong> in your browser menu.
                  </p>
                </div>
              )}

              {/* Download Icon Button */}
              <button
                onClick={handleDownloadIcon}
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-2xl border border-slate-300/80 transition-colors touch-manipulation"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Download App Icon (Vector SVG)</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Instant • Offline Capable • No App Store Needed
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
