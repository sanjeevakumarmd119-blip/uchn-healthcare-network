'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Apple,
  Laptop,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  PlusSquare,
  Sparkles,
  Info,
  ShieldCheck,
  Globe,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { APP_CONFIG } from '@/config/version';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop' | 'network'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.origin);

      const isRunningStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isRunningStandalone);

      // Auto-detect OS for default tab
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setActiveTab('ios');
      } else if (/android/.test(ua)) {
        setActiveTab('android');
      } else {
        setActiveTab('desktop');
      }

      // Listen for browser install prompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  const handleTriggerInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      setIsInstalling(true);
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(currentUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Download & Install UCHN App"
      description={`Version ${APP_CONFIG.version} • ${APP_CONFIG.status}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* App Hero Header Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-navy-800 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-navy-950 p-1 flex items-center justify-center flex-shrink-0 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192x192.png"
                alt="UCHN App Icon"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  {APP_CONFIG.shortName}
                </h3>
                <Badge variant="success" className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  v{APP_CONFIG.version}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Install as a full-screen mobile app with 1-tap care access.
              </p>
            </div>
          </div>

          {/* Quick 1-click install button if browser prompt is ready */}
          {deferredPrompt && (
            <Button
              onClick={handleTriggerInstall}
              isLoading={isInstalling}
              className="bg-sky-500 hover:bg-sky-400 text-navy-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 flex-shrink-0 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span>1-Tap Install Now</span>
            </Button>
          )}
        </div>

        {installSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>App installed successfully! Look for the UCHN Health icon on your home screen.</span>
          </div>
        )}

        {/* Platform OS Tab Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Choose Your Platform & Installation Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                activeTab === 'android'
                  ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-5 h-5 text-sky-600" />
              <span>Android</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                activeTab === 'ios'
                  ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Apple className="w-5 h-5 text-slate-800" />
              <span>iPhone / iOS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('desktop')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                activeTab === 'desktop'
                  ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Laptop className="w-5 h-5 text-slate-700" />
              <span>PC / Mac</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('network')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                activeTab === 'network'
                  ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Globe className="w-5 h-5 text-emerald-600" />
              <span>Wi-Fi / Local</span>
            </button>
          </div>
        </div>

        {/* Tab Content Instructions */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
          {activeTab === 'android' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-600" />
                <span>How to Install on Android (Chrome / Brave / Edge)</span>
              </h4>
              <ol className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    1
                  </span>
                  <div className="pt-0.5">
                    <strong>Open in Chrome:</strong> Open <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">{currentUrl || 'http://localhost:3000'}</span> on your mobile Chrome browser.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    2
                  </span>
                  <div className="pt-0.5">
                    <strong>Tap 3 Dots:</strong> Tap the <strong>three vertical dots (⋮)</strong> in the top-right corner of Chrome.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    3
                  </span>
                  <div className="pt-0.5">
                    <strong>Select Install:</strong> Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    4
                  </span>
                  <div className="pt-0.5">
                    <strong>Done!</strong> The UCHN Healthcare app icon is added to your phone&apos;s home screen and app drawer.
                  </div>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Apple className="w-4 h-4 text-slate-900" />
                <span>How to Install on iPhone / iPad (Safari)</span>
              </h4>
              <ol className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    1
                  </span>
                  <div className="pt-0.5">
                    <strong>Open Safari:</strong> Open the website in Apple <strong>Safari</strong> on your iPhone or iPad.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    2
                  </span>
                  <div className="pt-0.5">
                    <strong>Tap Share:</strong> Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-sky-600 align-text-bottom mx-1" /> (square with upward arrow at the bottom).
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    3
                  </span>
                  <div className="pt-0.5">
                    <strong>Add to Home Screen:</strong> Scroll down and select <strong className="text-slate-900">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-sky-600 align-text-bottom mx-1" />.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    4
                  </span>
                  <div className="pt-0.5">
                    <strong>Confirm:</strong> Tap <strong>Add</strong> at top right. UCHN is now installed directly on your iOS home screen!
                  </div>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-slate-700" />
                <span>How to Install on Desktop (Windows / Mac / Linux)</span>
              </h4>
              <ol className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    1
                  </span>
                  <div className="pt-0.5">
                    <strong>Check Address Bar:</strong> In Google Chrome or Microsoft Edge, look at the right side of the address bar.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    2
                  </span>
                  <div className="pt-0.5">
                    <strong>Click Install Icon:</strong> Click the <strong>Install App (💻 / ⊕)</strong> button on the address bar.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    3
                  </span>
                  <div className="pt-0.5">
                    <strong>Launch:</strong> The app opens in its own clean desktop window with taskbar / dock integration!
                  </div>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Testing & Installing on Mobile via Local Wi-Fi</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                You can install the app on your real smartphone right now while running the dev server on your computer:
              </p>
              <ol className="space-y-2 text-xs text-slate-700">
                <li>1. Ensure your smartphone is connected to the <strong>same Wi-Fi</strong> network as your computer.</li>
                <li>2. Find your computer&apos;s IP address in terminal via <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">ipconfig</code> (e.g., <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">192.168.1.XX</code>).</li>
                <li>3. Open <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">http://192.168.1.XX:3000</code> in your phone&apos;s Chrome/Safari.</li>
                <li>4. Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>!</li>
              </ol>
            </div>
          )}
        </div>

        {/* Share / Copy Link URL */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto">
            <span className="font-semibold text-slate-700">App URL:</span>
            <span className="font-mono text-[11px] bg-white px-2 py-1 rounded border border-slate-200 truncate max-w-[200px] sm:max-w-xs">
              {currentUrl || 'http://localhost:3000'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="text-xs gap-1.5 w-full sm:w-auto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </Button>
            <Button
              size="sm"
              onClick={onClose}
              className="text-xs w-full sm:w-auto"
            >
              Close
            </Button>
          </div>
        </div>

        {/* System Version & Integrity Footer */}
        <div className="text-center text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-center gap-2">
          <span>{APP_CONFIG.name}</span>
          <span>•</span>
          <span className="font-mono font-semibold text-slate-600">v{APP_CONFIG.version}</span>
          <span>•</span>
          <span>Build {APP_CONFIG.buildNumber}</span>
        </div>
      </div>
    </Modal>
  );
}

