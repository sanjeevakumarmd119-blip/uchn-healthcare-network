'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  Pill,
  ShieldAlert,
  Sparkles,
  MapPin,
  LogOut,
  ChevronRight,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { APP_CONFIG } from '@/config/version';

interface PatientSidebarProps {
  isMobileDrawer?: boolean;
  onClose?: () => void;
  onOpenAiAssistant?: () => void;
}

export function PatientSidebar({
  isMobileDrawer = false,
  onClose,
  onOpenAiAssistant,
}: PatientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { location, openLocationModal } = useLocation();

  const navItems = [
    {
      title: 'Patient Dashboard',
      href: '/patient',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: 'Find Doctors & Consult',
      href: '/patient/doctors',
      icon: Users,
    },
    {
      title: 'My Consultations',
      href: '/patient/appointments',
      icon: Calendar,
    },
    {
      title: 'Live Clinic Queue',
      href: '/patient/queue',
      icon: Clock,
    },
    {
      title: 'Medicine & Pharmacy',
      href: '/patient/medicines',
      icon: Pill,
    },
    {
      title: 'Emergency Trauma SOS',
      href: '/patient/emergency',
      icon: ShieldAlert,
      badge: 'SOS',
      badgeColor: 'bg-red-500 text-white animate-pulse',
    },
  ];

  const handleNavClick = (href: string) => {
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        'bg-white text-slate-800 flex flex-col',
        isMobileDrawer
          ? 'w-full h-full'
          : 'hidden md:flex w-64 min-h-[calc(100vh-4rem)] border-r border-slate-200 shadow-sm'
      )}
    >
      {/* Console Profile Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-subtle flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold border border-sky-200">
            {user ? (
              <span className="text-xs uppercase">
                {user.firstName[0]}
                {user.lastName[0]}
              </span>
            ) : (
              <User className="w-4 h-4 text-sky-600" />
            )}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-navy-950 truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'Patient Portal'}
            </h4>
            <p className="text-[10px] text-sky-700 font-medium truncate">
              {user ? user.email : 'Public Healthcare Portal'}
            </p>
          </div>
        </div>

        {isMobileDrawer && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 ml-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors tap-bounce"
            aria-label="Close Patient Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Healthcare Navigation
        </div>

        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group tap-bounce',
                isActive
                  ? 'bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/20'
                  : 'text-slate-700 hover:bg-sky-50 hover:text-sky-900'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.icon
                  className={cn(
                    'w-4 h-4 flex-shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-sky-600'
                  )}
                />
                <span className="truncate">{item.title}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.badge && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wide',
                      isActive ? 'bg-white text-rose-700' : item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {isMobileDrawer && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                )}
              </div>
            </Link>
          );
        })}

        {/* Location & AI Assistant Shortcuts */}
        <div className="pt-3 mt-3 border-t border-slate-200 space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Quick Services
          </div>

          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              openLocationModal();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors group tap-bounce"
          >
            <div className="flex items-center gap-2.5 truncate">
              <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span className="truncate text-left">City: {location.city}</span>
            </div>
            <span className="text-[10px] text-sky-600 font-semibold flex-shrink-0">Change</span>
          </button>

          {onOpenAiAssistant && (
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                onOpenAiAssistant();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 transition-colors group tap-bounce"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>AI Health Assistant</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-sky-600" />
            </button>
          )}
        </div>
      </nav>

      {/* Footer & Session */}
      <div className="p-3.5 border-t border-slate-200 space-y-2 bg-slate-50/80">
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors tap-bounce"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <Link
            href="/login"
            onClick={() => {
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-navy-900 hover:bg-navy-950 transition-colors tap-bounce"
          >
            <span>Sign In to Account</span>
          </Link>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 px-1">
          <span>UCHN Healthcare</span>
          <span className="font-mono">v{APP_CONFIG.version}</span>
        </div>
      </div>
    </aside>
  );
}
