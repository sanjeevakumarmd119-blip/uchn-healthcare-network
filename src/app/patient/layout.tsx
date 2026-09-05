'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { PatientSidebar } from '@/components/common/PatientSidebar';
import { Menu, ShieldAlert, Sparkles, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useLocation } from '@/context/LocationContext';
import { AIHealthAssistantModal } from '@/components/ai/AIHealthAssistantModal';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { location, openLocationModal } = useLocation();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#F8FAFC] relative min-h-[calc(100vh-4rem)]">
      {/* Mobile Top Header with Menu, Location, SOS */}
      <div className="md:hidden sticky top-16 z-20 bg-white text-slate-900 px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold tap-bounce cursor-pointer"
          aria-label="Open Patient Navigation Menu"
        >
          <Menu className="w-4 h-4 text-sky-600" />
          <span>Menu</span>
        </button>

        {/* Location pill */}
        <button
          type="button"
          onClick={openLocationModal}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium truncate max-w-[130px] tap-bounce"
        >
          <MapPin className="w-3 h-3 text-sky-600 flex-shrink-0" />
          <span className="truncate text-[11px]">{location.city}</span>
        </button>

        {/* Emergency SOS Shortcut */}
        <Link
          href="/patient/emergency"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold emergency-pulse tap-bounce"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>SOS</span>
        </Link>
      </div>

      {/* Slide-in Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-[280px] max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            <PatientSidebar
              isMobileDrawer={true}
              onClose={() => setIsMobileDrawerOpen(false)}
              onOpenAiAssistant={() => setIsAiModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Persistent Desktop Sidebar */}
      <PatientSidebar onOpenAiAssistant={() => setIsAiModalOpen(true)} />

      {/* Main Page Area with bottom-nav clearance */}
      <div className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full pb-28 md:pb-8">
        {children}
      </div>

      <AIHealthAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}
