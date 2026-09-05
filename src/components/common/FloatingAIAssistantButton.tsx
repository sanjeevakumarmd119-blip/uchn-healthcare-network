'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, Bot } from 'lucide-react';
import { AIHealthAssistantModal } from '../ai/AIHealthAssistantModal';

export function FloatingAIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide on auth pages
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password'
  ) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 group">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gradient-to-tr from-sky-600 to-navy-950 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border border-sky-400/30 group-hover:border-sky-400"
          aria-label="Open AI Health Assistant"
        >
          <div className="relative">
            <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-sky-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight pr-1 hidden xs:inline">
            AI Triage Assistant
          </span>
        </button>
      </div>

      <AIHealthAssistantModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
