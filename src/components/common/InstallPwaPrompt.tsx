'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Share2, PlusSquare, Smartphone } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppDownload } from '@/context/AppDownloadContext';
import { APP_CONFIG } from '@/config/version';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { openDownloadModal } = useAppDownload();

  useEffect(() => {
    // Check if already installed & running in standalone mode
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isRunningStandalone);
    if (isRunningStandalone) return;

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem('uchn_pwa_dismissed');
    if (dismissedAt) {
      const hoursSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSince < 24) return; // Dismissed within last 24 hours
    }

    // Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Handler for Chrome / Android / Desktop PWA prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS || !deferredPrompt) {
      openDownloadModal();
      setIsVisible(false);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false);
      }
    } catch (e) {
      openDownloadModal();
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('uchn_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || !isVisible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="bg-navy-950 text-white p-4 rounded-2xl shadow-2xl border border-navy-800 flex items-center justify-between gap-3">
        {/* App Icon preview */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-navy-900 p-0.5 flex-shrink-0 flex items-center justify-center shadow-md">
          <div className="w-full h-full bg-navy-900 rounded-[10px] flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192x192.png"
              alt="UCHN App Icon"
              className="w-9 h-9 object-contain"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-white leading-tight truncate">
              Install UCHN Healthcare
            </h4>
            <span className="text-[10px] font-mono font-semibold px-1 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
              v{APP_CONFIG.version}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
            Fast 1-tap appointments, live queue & emergency SOS.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="bg-sky-500 hover:bg-sky-400 text-navy-950 font-bold text-xs px-3 py-1.5 h-auto rounded-lg shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Install
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
