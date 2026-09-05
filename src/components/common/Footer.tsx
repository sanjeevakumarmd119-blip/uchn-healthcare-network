'use client';

import React from 'react';
import Link from 'next/link';
import { Download, Smartphone, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppDownload } from '@/context/AppDownloadContext';
import { APP_CONFIG } from '@/config/version';

export function Footer() {
  const { openDownloadModal } = useAppDownload();

  return (
    <footer className="w-full border-t border-slate-200 bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 mt-auto hidden sm:block">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Version */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight">{APP_CONFIG.shortName}</span>
            <button
              onClick={openDownloadModal}
              className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 font-mono text-[11px] font-semibold border border-slate-200 transition-colors"
              title="Click to view App version details & install guide"
            >
              v{APP_CONFIG.version}
            </button>
          </div>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400">Unified Care & Health Network</span>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={openDownloadModal}
            className="flex items-center gap-1.5 text-sky-600 hover:text-sky-800 font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download & Install App</span>
          </button>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>System Online ({APP_CONFIG.status})</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

