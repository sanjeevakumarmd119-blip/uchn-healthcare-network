'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { NotificationBell } from './NotificationBell';
import { MapPin, Activity, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function Navbar() {
  const { user, logout } = useAuth();
  const { location, openLocationModal } = useLocation();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-navy-800 group-hover:bg-navy-900 flex items-center justify-center text-white shadow-subtle transition-all">
              <Activity className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-navy-950 font-sans">
                UCHN
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400 border-l border-slate-200 pl-2">
                Unified Care Network
              </span>
            </div>
          </Link>

          {/* Location Selector Pill */}
          <button
            onClick={openLocationModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            title="Click to change healthcare location"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span className="truncate max-w-[140px]">{location.city}</span>
            <span className="text-slate-400 text-[10px]">Change</span>
          </button>
        </div>

        {/* Right Section Actions & User Status */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Emergency Quick Shortcut if Patient */}
              {user.role === 'PATIENT' && (
                <Link
                  href="/patient/emergency"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors emergency-pulse"
                >
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>EMERGENCY SOS</span>
                </Link>
              )}

              {/* In-app Notification Bell */}
              <NotificationBell />

              {/* User Role Badge */}
              <Badge
                variant={
                  user.role === 'CLINIC_ADMIN'
                    ? 'warning'
                    : user.role === 'DOCTOR'
                    ? 'secondary'
                    : 'default'
                }
                className="hidden sm:inline-flex text-[11px] font-semibold uppercase"
              >
                {user.role.replace('_', ' ')}
              </Badge>

              {/* User Dropdown / Sign out */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex flex-col text-right hidden sm:block">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>

                <button
                  onClick={() => logout()}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-navy-800 hover:bg-navy-900 rounded-lg shadow-subtle transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

