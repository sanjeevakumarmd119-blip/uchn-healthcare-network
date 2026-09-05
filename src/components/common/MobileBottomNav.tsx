'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  Users,
  Calendar,
  Pill,
  ShieldAlert,
  LayoutDashboard,
  Activity,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide bottom nav on login / register / forgot-password pages
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password'
  ) {
    return null;
  }

  const isDoctorRole = user?.role === 'DOCTOR' || user?.role === 'CLINIC_ADMIN';

  const patientTabs = [
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

  const doctorTabs = [
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
      label: 'Inventory',
      href: '/doctor/inventory',
      icon: Pill,
    },
  ];

  const currentTabs = isDoctorRole ? doctorTabs : patientTabs;

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 items-center justify-around px-2 pt-1.5">
        {currentTabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

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
                <span className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-wider">
                  {tab.label}
                </span>
              </Link>
            );
          }

          const IconComponent = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 rounded-lg transition-colors group',
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
                  isActive ? 'font-semibold text-sky-600' : 'text-slate-500'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
