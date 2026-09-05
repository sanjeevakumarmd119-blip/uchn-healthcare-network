'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      title: 'Dashboard',
      href: '/doctor',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: 'Appointments',
      href: '/doctor/appointments',
      icon: Calendar,
    },
    {
      title: 'Patient Queue',
      href: '/doctor/queue',
      icon: Users,
    },
    {
      title: 'Emergency Cases',
      href: '/doctor/emergency',
      icon: ShieldAlert,
      badge: 'LIVE',
      badgeColor: 'bg-red-100 text-red-700',
    },
    {
      title: 'Medicine Stock',
      href: '/doctor/inventory',
      icon: Pill,
    },
    {
      title: 'Notifications',
      href: '/doctor/notifications',
      icon: Bell,
    },
    {
      title: 'Audit Logs',
      href: '/doctor/audit-logs',
      icon: FileText,
      roles: ['CLINIC_ADMIN', 'DOCTOR'],
    },
  ];

  return (
    <aside className="w-64 bg-navy-900 text-slate-300 flex flex-col min-h-[calc(100vh-4rem)] border-r border-navy-800">
      <div className="p-4 border-b border-navy-800">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-navy-800/80">
          <Hospital className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <div className="truncate">
            <h4 className="text-xs font-semibold text-white truncate">
              {user?.role === 'CLINIC_ADMIN' ? 'Clinic Administration' : 'Clinical Console'}
            </h4>
            <p className="text-[10px] text-slate-400">Operational Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group',
                isActive
                  ? 'bg-sky-600 text-white font-semibold shadow-subtle'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'
                  )}
                />
                <span>{item.title}</span>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide',
                    isActive ? 'bg-white text-sky-700' : item.badgeColor
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-navy-800 text-[11px] text-slate-500">
        <span>UCHN v1.0.0 • Connected</span>
      </div>
    </aside>
  );
}

