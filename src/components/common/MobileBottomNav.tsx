'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppDownload } from '@/context/AppDownloadContext';
import {
  Home,
  Users,
  Calendar,
  Pill,
  ShieldAlert,
  LayoutDashboard,
  UserCheck,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavTab {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  isEmergency?: boolean;
  requiresAuth?: boolean;
  isMenuTrigger?: boolean;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { openDoctorDrawer, isDoctorDrawerOpen } = useAppDownload();

  // Hide bottom nav on login / register / forgot-password pages
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password'
  ) {
    return null;
  }

  const isDoctorRole = user?.role === 'DOCTOR' || user?.role === 'CLINIC_ADMIN';

  const patientTabs: NavTab[] = [
    {
      label: 'Home',
      href: user ? '/patient' : '/',
      icon: Home,
      exact: true,
    },
    {
      label: 'Doctors',
      href: '/patient/doctors',
      icon: Users,
    },
    {
      label: 'SOS',
      href: '/patient/emergency',
      icon: ShieldAlert,
      isEmergency: true,
    },
    {
      label: 'Bookings',
      href: '/patient/appointments',
      icon: Calendar,
      requiresAuth: true,
    },
    {
      label: 'Medicines',
      href: '/patient/medicines',
      icon: Pill,
    },
  ];

  const doctorTabs: NavTab[] = [
    {
      label: 'Overview',
      href: '/doctor',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Queue',
      href: '/doctor/queue',
      icon: UserCheck,
    },
    {
      label: 'SOS Alert',
      href: '/doctor/emergency',
      icon: ShieldAlert,
      isEmergency: true,
    },
    {
      label: 'Schedule',
      href: '/doctor/appointments',
      icon: Calendar,
    },
    {
      label: 'Menu',
      href: '#menu',
      icon: Menu,
      isMenuTrigger: true,
    },
  ];

  const currentTabs = isDoctorRole ? doctorTabs : patientTabs;

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[max(0.6rem,env(safe-area-inset-bottom))]"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 items-center justify-around px-1 pt-1.5">
        {currentTabs.map((tab) => {
          if (tab.isEmergency) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center -mt-5 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 border-2 border-white emergency-pulse group-active:scale-95 transition-transform">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-extrabold text-red-600 mt-1 uppercase tracking-wider">
                  {tab.label}
                </span>
              </Link>
            );
          }

          if (tab.isMenuTrigger) {
            return (
              <button
                key="menu-trigger"
                type="button"
                onClick={openDoctorDrawer}
                className={cn(
                  'flex flex-col items-center justify-center py-1 rounded-xl transition-colors group tap-bounce',
                  isDoctorDrawerOpen ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <div
                  className={cn(
                    'p-1.5 rounded-full transition-transform group-active:scale-90',
                    isDoctorDrawerOpen ? 'bg-sky-100 text-sky-700' : 'bg-slate-100/70 text-slate-600'
                  )}
                >
                  <Menu className="w-4 h-4" />
                </div>
                <span className="text-[10px] tracking-tight font-semibold mt-0.5 text-slate-600">
                  Menu
                </span>
              </button>
            );
          }

          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          const IconComponent = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 rounded-xl transition-colors group tap-bounce relative',
                isActive ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-full transition-transform group-active:scale-90',
                  isActive ? 'bg-sky-50 text-sky-600' : ''
                )}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-tight font-medium mt-0.5',
                  isActive ? 'font-bold text-sky-700' : 'text-slate-500'
                )}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-sky-600 absolute bottom-0" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
