'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppDownload } from '@/context/AppDownloadContext';
import { PatientSidebar } from './PatientSidebar';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';

export function WebsiteMobileDrawer() {
  const pathname = usePathname();
  const { isMobileDrawerOpen, closeMobileDrawer } = useAppDownload();
  const { user } = useAuth();

  // Close drawer on path change
  useEffect(() => {
    closeMobileDrawer();
  }, [pathname]);

  // If already handled by DoctorLayout or PatientLayout, skip rendering here
  if (pathname.startsWith('/doctor') || pathname.startsWith('/patient')) {
    return null;
  }

  if (!isMobileDrawerOpen) {
    return null;
  }

  const isDoctorRole = user?.role === 'DOCTOR' || user?.role === 'CLINIC_ADMIN';

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeMobileDrawer}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-[280px] max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
        {isDoctorRole ? (
          <Sidebar isMobileDrawer={true} onClose={closeMobileDrawer} />
        ) : (
          <PatientSidebar isMobileDrawer={true} onClose={closeMobileDrawer} />
        )}
      </div>
    </div>
  );
}
