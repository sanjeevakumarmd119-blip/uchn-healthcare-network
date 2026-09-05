'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useAppDownload } from '@/context/AppDownloadContext';
import { NotificationBell } from './NotificationBell';
import { MapPin, LogOut, ShieldAlert, Download, Smartphone } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { APP_CONFIG } from '@/config/version';

export function Navbar() {
  const { user, logout } = useAuth();
  const { location, openLocationModal } = useLocation();
  const { openDownloadModal } = useAppDownload();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & App Icon */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-navy-950 p-1 flex items-center justify-center text-white shadow-subtle group-hover:scale-105 transition-all overflow-hidden border border-navy-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.svg"
                alt="UCHN Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-navy-950 font-sans">
                UCHN
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  openDownloadModal();
                }}
                className="px-1.5 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 font-mono text-[10px] font-bold border border-sky-200 transition-colors"
                title="Click to view App Version details & Download options"
              >
                v{APP_CONFIG.version}
              </button>
            </div>
          </Link>

          {/* Location Selector Pill (Responsive for both Mobile & Desktop) */}
          <button
            onClick={openLocationModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            title="Click to change healthcare location"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
            <span className="truncate max-w-[85px] sm:max-w-[130px] text-[11px] sm:text-xs">
              {location.city}
            </span>
            <span className="text-slate-400 text-[10px] hidden xs:inline">Change</span>
          </button>
        </div>

        {/* Right Section Actions & User Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Universal Download App Button */}
          <button
            type="button"
            onClick={openDownloadModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-sky-800 text-xs font-semibold shadow-subtle transition-all"
            title="Download & Install UCHN Healthcare App"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Install App</span>
            <span className="sm:hidden">App</span>
          </button>
          {user ? (
            <>
              {/* Emergency Quick Shortcut if Patient (Desktop) */}
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

              {/* User Sign out */}
              <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200">
                <div className="flex flex-col text-right hidden md:block">
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
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 text-xs font-medium text-white bg-navy-800 hover:bg-navy-900 rounded-lg shadow-subtle transition-colors"
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
