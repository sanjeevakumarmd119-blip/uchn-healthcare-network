'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/common/Sidebar';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppDownload } from '@/context/AppDownloadContext';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isDoctorDrawerOpen, closeDoctorDrawer } = useAppDownload();

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
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50 relative min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
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
      <div className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full pb-24 md:pb-8">
        {children}
      </div>
    </div>
  );
}
