'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import {
  Stethoscope,
  Pill,
  ShieldAlert,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  Download,
  Smartphone,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { Appointment, EmergencyCase, WaitingQueueEntry } from '@/types';
import { AIHealthAssistantModal } from '@/components/ai/AIHealthAssistantModal';
import { useAppDownload } from '@/context/AppDownloadContext';
import { APP_CONFIG } from '@/config/version';

export default function PatientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { location, openLocationModal } = useLocation();
  const { openDownloadModal, isAppInstalled } = useAppDownload();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeEmergency, setActiveEmergency] = useState<EmergencyCase | null>(null);
  const [queueEntry, setQueueEntry] = useState<WaitingQueueEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/patient');
      return;
    }

    if (user && user.role !== 'PATIENT') {
      router.push('/doctor');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch appointments
      const aptRes = await fetch('/api/appointments');
      if (aptRes.ok) {
        const json = await aptRes.json();
        if (json.success) setAppointments(json.data.appointments || []);
      }

      // Fetch active emergencies
      const emgRes = await fetch('/api/emergency');
      if (emgRes.ok) {
        const json = await emgRes.json();
        if (json.success && json.data.emergencies) {
          const active = json.data.emergencies.find(
            (e: EmergencyCase) => e.status !== 'RESOLVED' && e.status !== 'CANCELLED'
          );
          setActiveEmergency(active || null);
        }
      }

      // Fetch queue
      const qRes = await fetch('/api/queue');
      if (qRes.ok) {
        const json = await qRes.json();
        if (json.success) setQueueEntry(json.data.queueEntry || null);
      }
    } catch (e) {
      console.error('Patient dashboard data error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const upcomingAppointment = appointments.find(
    (a) => a.status === 'CONFIRMED' || a.status === 'CHECKED_IN' || a.status === 'IN_PROGRESS'
  );

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-8 space-y-4 sm:space-y-8">
      {/* Mobile & Desktop Header Profile Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          {/* User Initial Avatar */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-sky-600 to-navy-900 text-white font-bold text-sm sm:text-base flex items-center justify-center flex-shrink-0 shadow-subtle border border-sky-400/30">
            {user?.firstName?.charAt(0) || 'P'}
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-navy-950 tracking-tight leading-tight">
              {getGreeting()}, {user?.firstName}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Personalized Healthcare Dashboard
            </p>
          </div>
        </div>

        <button
          onClick={openLocationModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[11px] sm:text-xs font-medium text-slate-700 shadow-subtle transition-all tap-bounce cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-sky-600" />
          <span className="truncate max-w-[80px] sm:max-w-[140px]">{location.city}</span>
          <span className="text-sky-600 font-semibold text-[10px] hidden xs:inline">Change</span>
        </button>
      </div>

      {/* AI Clinical Triage Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-sky-950 p-5 sm:p-7 text-white shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-[11px] font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Clinical Triage Assistant</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              Feeling unwell? Check symptoms with AI.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Describe your symptoms for real-time clinical urgency triage, home care advice, and immediate matching with verified nearby specialists.
            </p>
          </div>

          <Button
            onClick={() => setIsAIModalOpen(true)}
            className="self-start md:self-auto px-5 py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-navy-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-sky-500/25 transition-all flex items-center gap-2 flex-shrink-0 tap-bounce cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-navy-950" />
            <span>Start AI Triage</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ACTIVE EMERGENCY SOS BANNER (If in progress) */}
      {activeEmergency && (
        <div className="p-3.5 sm:p-5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-950 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 emergency-pulse">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                  Emergency SOS Active
                </span>
                <Badge variant="emergency" className="text-[9px] px-1.5 py-0.5">
                  {activeEmergency.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                Case {activeEmergency.caseNumber}: {activeEmergency.emergencyType}
              </h4>
              <p className="text-[11px] text-slate-500">
                Clinic dispatched: {activeEmergency.clinic?.name || 'Nearest Available Trauma Unit'}
              </p>
            </div>
          </div>

          <Link href="/patient/emergency" className="w-full sm:w-auto">
            <Button variant="emergency" size="sm" className="w-full sm:w-auto text-xs font-bold shadow-sm tap-bounce">
              View SOS Live Tracker
            </Button>
          </Link>
        </div>
      )}

      {/* ACTIVE QUEUE TICKET (If checked in) */}
      {queueEntry && (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-600 text-white font-black text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              #{queueEntry.queueNumber}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
                  Live Waiting Room Queue
                </span>
                <Badge variant={queueEntry.status === 'IN_CONSULTATION' ? 'success' : 'default'} className="text-[9px]">
                  {queueEntry.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                Dr. {queueEntry.doctor?.user?.firstName} {queueEntry.doctor?.user?.lastName} ({queueEntry.clinic?.name})
              </h4>
              <p className="text-[11px] text-slate-500">
                Checked in: {formatTime(queueEntry.checkInTime)}
              </p>
            </div>
          </div>

          <Link href="/patient/queue" className="w-full sm:w-auto">
            <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs font-semibold tap-bounce">
              <UserCheck className="w-3.5 h-3.5 mr-1 text-sky-600" />
              Live Queue Ticket
            </Button>
          </Link>
        </div>
      )}

      {/* 2x2 PRIMARY HEALTHCARE ACTION GRID (Mobile-First) */}
      <section className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Healthcare Services
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {/* 1. DOCTOR CONSULTATION */}
          <Link href="/patient/doctors" className="block group tap-bounce">
            <Card className="p-3.5 sm:p-5 border border-sky-100 bg-gradient-to-br from-white to-sky-50/50 shadow-subtle hover:border-sky-300 hover:shadow-card transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100/60 px-1.5 py-0.5 rounded">
                  SPECIALISTS
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-sky-700 transition-colors">
                  Doctor Consultation
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                  Book verified nearby specialists & check slot availability.
                </p>
              </div>
            </Card>
          </Link>

          {/* 2. MEDICINE & PHARMACY */}
          <Link href="/patient/medicines" className="block group tap-bounce">
            <Card className="p-3.5 sm:p-5 border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 shadow-subtle hover:border-emerald-300 hover:shadow-card transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Pill className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                  PHARMACY
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Medicine Stock
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                  Discover local pharmacy stock & order for pickup or delivery.
                </p>
              </div>
            </Card>
          </Link>

          {/* 3. EMERGENCY SOS */}
          <Link href="/patient/emergency" className="block group tap-bounce">
            <Card className="p-3.5 sm:p-5 border border-red-200 bg-gradient-to-br from-red-50/70 to-rose-50/40 shadow-subtle hover:border-red-400 hover:shadow-card transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center emergency-pulse group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] font-extrabold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                  SOS 24/7
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-extrabold text-sm sm:text-base text-red-950 group-hover:text-red-700 transition-colors">
                  Emergency SOS
                </h3>
                <p className="text-[11px] sm:text-xs text-red-900/70 mt-0.5 leading-snug">
                  1-tap urgent ambulance dispatch with real-time GPS tracking.
                </p>
              </div>
            </Card>
          </Link>

          {/* 4. LIVE CLINIC QUEUE */}
          <Link href="/patient/queue" className="block group tap-bounce">
            <Card className="p-3.5 sm:p-5 border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 shadow-subtle hover:border-blue-300 hover:shadow-card transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                  WAITING ROOM
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-blue-700 transition-colors">
                  Live Queue
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                  Track your position & estimated consultation wait time live.
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* UPCOMING APPOINTMENT CLINICAL PASS */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Upcoming Appointment
          </h3>
          <Link href="/patient/appointments" className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1">
            All Bookings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingAppointment ? (
          <Card className="p-4 sm:p-5 border border-slate-200 shadow-card rounded-2xl bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    upcomingAppointment.status === 'CONFIRMED'
                      ? 'success'
                      : upcomingAppointment.status === 'CHECKED_IN'
                      ? 'default'
                      : 'secondary'
                  }
                  className="text-[10px]"
                >
                  {upcomingAppointment.status.replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs font-mono text-slate-400">
                  Pass #{upcomingAppointment.appointmentNumber}
                </span>
              </div>
              <span className="text-xs text-sky-700 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(upcomingAppointment.appointmentDate)} • {formatTime(upcomingAppointment.startTime)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Dr. {upcomingAppointment.doctor?.user?.firstName} {upcomingAppointment.doctor?.user?.lastName}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {upcomingAppointment.clinic?.name} — {upcomingAppointment.clinic?.address}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Link href="/patient/appointments">
                  <Button size="sm" variant="outline" className="text-xs font-semibold tap-bounce">
                    View Details
                  </Button>
                </Link>
                {upcomingAppointment.status === 'CONFIRMED' && (
                  <Link href="/patient/queue">
                    <Button size="sm" className="text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white tap-bounce">
                      Self Check-in
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-white text-center">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              No upcoming appointments.{' '}
              <Link href="/patient/doctors" className="font-semibold text-sky-600 hover:text-sky-800">
                Book a doctor consultation
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* MOBILE APP DOWNLOAD PROMO CARD (Hidden if already installed) */}
      {!isAppInstalled && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-navy-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-navy-800 shadow-card tap-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  UCHN Healthcare App
                </h4>
                <span className="text-[10px] font-mono px-1 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  v{APP_CONFIG.version}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Install directly on your phone home screen for 1-tap offline care.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={openDownloadModal}
            className="bg-sky-500 hover:bg-sky-400 text-navy-950 font-bold text-xs gap-1.5 flex-shrink-0 w-full sm:w-auto h-9 tap-bounce cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </Button>
        </div>
      )}

      {/* AI Health Assistant Modal */}
      <AIHealthAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </div>
  );
}
