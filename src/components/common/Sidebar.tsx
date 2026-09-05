'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ShieldAlert,
  Pill,
  Bell,
  FileText,
  Hospital,
  X,
  UserCheck,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { APP_CONFIG } from '@/config/version';

interface SidebarProps {
  isMobileDrawer?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobileDrawer = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = [
    {
      title: 'Operations Dashboard',
      href: '/doctor',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: 'Appointments Schedule',
      href: '/doctor/appointments',
      icon: Calendar,
    },
    {
      title: 'Patient Waiting Queue',
      href: '/doctor/queue',
      icon: Users,
    },
    {
      title: 'Emergency Trauma Hub',
      href: '/doctor/emergency',
      icon: ShieldAlert,
      badge: 'LIVE',
      badgeColor: 'bg-red-500 text-white animate-pulse',
    },
    {
      title: 'Medicine & Pharmacy Stock',
      href: '/doctor/inventory',
      icon: Pill,
    },
    {
      title: 'Staff Notifications',
      href: '/doctor/notifications',
      icon: Bell,
    },
    {
      title: 'Audit & Compliance Logs',
      href: '/doctor/audit-logs',
      icon: FileText,
      roles: ['CLINIC_ADMIN', 'DOCTOR'],
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
        'bg-navy-950 text-slate-300 flex flex-col',
        isMobileDrawer
          ? 'w-full h-full'
          : 'hidden md:flex w-64 min-h-[calc(100vh-4rem)] border-r border-navy-800'
      )}
    >
      {/* Console Header */}
      <div className="p-4 border-b border-navy-800/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-navy-900 border border-navy-800/80 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-400/30">
            <Hospital className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-white truncate">
              {user?.role === 'CLINIC_ADMIN' ? 'Clinic Administration' : 'Doctor Clinical Console'}
            </h4>
            <p className="text-[10px] text-sky-300 truncate">
              Dr. {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>

        {isMobileDrawer && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors tap-bounce"
            aria-label="Close Clinical Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation Modules */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Clinical Modules
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
                  ? 'bg-sky-600 text-white font-semibold shadow-md shadow-sky-900/30'
                  : 'text-slate-300 hover:bg-navy-900 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.icon
                  className={cn(
                    'w-4 h-4 flex-shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'
                  )}
                />
                <span className="truncate">{item.title}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.badge && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wide',
                      isActive ? 'bg-white text-sky-800' : item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {isMobileDrawer && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-60" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer & Session */}
      <div className="p-3.5 border-t border-navy-800/90 space-y-2 bg-navy-950/60">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/30 transition-colors tap-bounce"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Clinical Session</span>
        </button>

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 px-1">
          <span>UCHN Healthcare</span>
          <span className="font-mono">v{APP_CONFIG.version}</span>
        </div>
      </div>
    </aside>
  );
}

