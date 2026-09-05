'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useAppDownload } from '@/context/AppDownloadContext';
import { APP_CONFIG } from '@/config/version';
import {
  UserRound,
  Stethoscope,
  ShieldAlert,
  CalendarCheck,
  Pill,
  ArrowRight,
  MapPin,
  Sparkles,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const { location, openLocationModal } = useLocation();
  const { openDownloadModal, isAppInstalled } = useAppDownload();

  return (
    <div className="flex-1 flex flex-col">
      {/* Location Detection Top Notification */}
      <div className="bg-sky-50/70 border-b border-sky-100 py-2.5 px-4 text-center text-xs text-sky-900 flex items-center justify-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
        <span>
          Detected Location: <strong className="font-semibold">{location.city}</strong>
        </span>
        <button
          onClick={openLocationModal}
          className="ml-2 text-sky-700 hover:text-sky-900 underline font-medium cursor-pointer"
        >
          Change location
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-200 bg-sky-50 text-sky-700 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified Care & Health Network (UCHN)</span>
          </div>

          {!isAppInstalled ? (
            <button
              type="button"
              onClick={openDownloadModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold shadow-subtle transition-all cursor-pointer tap-bounce"
              title="Download and install UCHN as a mobile/desktop app"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Install App (v{APP_CONFIG.version})</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-200 bg-sky-50 text-sky-700 text-xs font-semibold font-mono">
              <span>v{APP_CONFIG.version} Active</span>
            </div>
          )}
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy-950 font-sans leading-[1.15]">
          Connected healthcare. <br />
          <span className="text-sky-600">Simplified for everyone.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A unified, reliable network connecting patients with doctors and clinics. Instant appointment booking, live medicine stock discovery, and emergency coordination in one place.
        </p>

        {/* Step 1 Question: "Who are you?" */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card max-w-3xl mx-auto text-left">
          <div className="text-center mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
              Step 1 • Getting Started
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
              Who are you?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select your role to access your personalized healthcare dashboard
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Option */}
            <Link
              href={user?.role === 'PATIENT' ? '/patient' : '/login?role=PATIENT'}
              className="group relative flex flex-col p-6 rounded-xl border-2 border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-500 transition-all shadow-subtle hover:shadow-card tap-bounce"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center mb-4 transition-colors">
                <UserRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors flex items-center justify-between">
                Patient
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-sky-600" />
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Book appointments with verified doctors, check live medicine availability, and trigger emergency SOS assistance.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-[11px] font-medium text-sky-700">
                <span>Access Patient Portal</span>
              </div>
            </Link>

            {/* Doctor / Clinic Option */}
            <Link
              href={
                user?.role === 'DOCTOR' || user?.role === 'CLINIC_ADMIN'
                  ? '/doctor'
                  : '/login?role=DOCTOR'
              }
              className="group relative flex flex-col p-6 rounded-xl border-2 border-slate-200 bg-slate-50/50 hover:bg-white hover:border-navy-700 transition-all shadow-subtle hover:shadow-card tap-bounce"
            >
              <div className="w-12 h-12 rounded-xl bg-navy-100 text-navy-800 group-hover:bg-navy-800 group-hover:text-white flex items-center justify-center mb-4 transition-colors">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-navy-900 transition-colors flex items-center justify-between">
                Doctor / Clinic
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-navy-700" />
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Manage live patient waiting queues, review emergency dispatches, track medicine stock, and organize consultations.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-[11px] font-medium text-navy-800">
                <span>Access Clinical Console</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Core Patient Actions Preview */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">
              Core Care Pillars
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Zero clutter. Three primary touchpoints for comprehensive healthcare access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">1. DOCTOR</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Discover top specialists nearby, compare consultation fees, inspect slot availability, and book appointments with concurrency-safe locking.
                </p>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500 border-t border-slate-200 pt-3">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>Real-time slot locking</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>Verified specialty profiles</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">2. MEDICINE</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Search medicines by generic name or brand, verify real-time inventory at local clinics, and reserve stock for pickup or home delivery.
                </p>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500 border-t border-slate-200 pt-3">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Live stock visibility (No zero inventory orders)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Multi-pharmacy distance lookup</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-red-200 bg-red-50/40 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center mb-4 emergency-pulse">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-red-950">3. EMERGENCY</h3>
                <p className="text-xs text-red-900/80 mt-2 leading-relaxed">
                  One-tap urgent emergency dispatch with GPS capture, real-time alert push to nearest trauma clinics, and live 5-stage ambulance timeline tracking.
                </p>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-red-900/70 border-t border-red-200 pt-3">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Instant socket notification broadcast</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Live stage timeline status updates</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center sm:flex sm:justify-between sm:items-center">
          <p>© 2026 UCHN — Unified Care & Health Network. Production-grade healthcare coordination.</p>
          <div className="mt-3 sm:mt-0 flex justify-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <Link href="/patient" className="hover:text-white transition-colors">Patient Portal</Link>
            <Link href="/doctor" className="hover:text-white transition-colors">Clinical Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
