'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PatientSidebar } from '@/components/common/PatientSidebar';
import { useAppDownload } from '@/context/AppDownloadContext';
import { AIHealthAssistantModal } from '@/components/ai/AIHealthAssistantModal';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isPatientDrawerOpen, closePatientDrawer } = useAppDownload();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Close drawer on path change
  useEffect(() => {
    closePatientDrawer();
  }, [pathname]);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#F8FAFC] relative min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
      {/* Slide-in Mobile Drawer Overlay */}
      {isPatientDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={closePatientDrawer}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-[280px] max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            <PatientSidebar
              isMobileDrawer={true}
              onClose={closePatientDrawer}
              onOpenAiAssistant={() => setIsAiModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Persistent Desktop Sidebar */}
      <PatientSidebar onOpenAiAssistant={() => setIsAiModalOpen(true)} />

      {/* Main Page Area */}
      <div className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full pb-24 md:pb-8">
        {children}
      </div>

      <AIHealthAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}
