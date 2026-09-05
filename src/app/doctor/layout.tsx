'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/common/Sidebar';
import { Loader2, ShieldAlert, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppDownload } from '@/context/AppDownloadContext';
import Link from 'next/link';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isDoctorDrawerOpen, openDoctorDrawer, closeDoctorDrawer } = useAppDownload();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/doctor');
    }
  }, [user, loading, router]);

  // Close drawer on path change
  useEffect(() => {
    closeDoctorDrawer();
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role === 'PATIENT') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-card text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          This portal is reserved for medical practitioners and clinic staff. You are signed in as a Patient.
        </p>
        <Button onClick={() => router.push('/patient')} className="w-full">
          Go to Patient Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50 relative min-h-screen">
      {/* Mobile Clinical Top Bar */}
      <div className="md:hidden sticky top-16 z-20 bg-navy-950 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-navy-800 shadow-md">
        <button
          type="button"
          onClick={openDoctorDrawer}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-navy-900 border border-navy-800 text-slate-200 hover:text-white text-xs font-semibold tap-bounce cursor-pointer"
          aria-label="Open Clinical Operations Menu"
        >
          <Menu className="w-4 h-4 text-sky-400" />
          <span>Menu</span>
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-sky-200">
            {user.role === 'CLINIC_ADMIN' ? 'Clinic Admin' : 'Doctor Portal'}
          </span>
        </div>

        <Link
          href="/doctor/emergency"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/90 text-white text-[11px] font-bold emergency-pulse tap-bounce"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>SOS</span>
        </Link>
      </div>

      {/* Slide-in Mobile Drawer Overlay */}
      {isDoctorDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-navy-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={closeDoctorDrawer}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-[290px] max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            <Sidebar isMobileDrawer={true} onClose={closeDoctorDrawer} />
          </div>
        </div>
      )}

      {/* Persistent Desktop Sidebar */}
      <Sidebar />

      {/* Main Page Area */}
      <div className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full">
        {children}
      </div>
    </div>
  );
}
