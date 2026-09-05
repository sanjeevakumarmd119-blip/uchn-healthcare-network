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
  AlertTriangle,
  Loader2,
  Sparkles,
  Bot,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { Appointment, EmergencyCase, WaitingQueueEntry } from '@/types';
import { AIHealthAssistantModal } from '@/components/ai/AIHealthAssistantModal';

export default function PatientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { location, openLocationModal } = useLocation();
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Greeting & Location Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 font-sans tracking-tight">
            {getGreeting()}, {user?.firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            What healthcare assistance do you need today?
          </p>
        </div>

        <button
          onClick={openLocationModal}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-subtle transition-all"
        >
          <MapPin className="w-3.5 h-3.5 text-sky-600" />
          <span>{location.city}</span>
          <span className="text-sky-600 font-semibold text-[11px]">Change</span>
        </button>
      </div>

      {/* AI Clinical Triage Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-sky-950 p-6 sm:p-7 text-white shadow-xl border border-navy-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-[11px] font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Clinical Triage Assistant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Feeling unwell? Check symptoms with AI.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Describe your symptoms for real-time clinical urgency triage, home care advice, and immediate matching with verified nearby specialists.
            </p>
          </div>

          <Button
            onClick={() => setIsAIModalOpen(true)}
            className="self-start md:self-auto px-5 py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-navy-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-sky-500/25 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Sparkles className="w-4 h-4 text-navy-950" />
            <span>Start AI Triage</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Active Emergency Banner if in Progress */}
      {activeEmergency && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-950 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 emergency-pulse">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                  Active Emergency SOS in Progress
                </span>
                <Badge variant="emergency" className="text-[10px]">
                  {activeEmergency.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                Case {activeEmergency.caseNumber}: {activeEmergency.emergencyType}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {activeEmergency.ambulanceId
                  ? `Ambulance unit ${activeEmergency.ambulanceId} dispatched to your location.`
                  : 'Medical response team is reviewing your location coordinates.'}
              </p>
            </div>
          </div>

          <Link href="/patient/emergency" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-xs">
              Live Emergency Timeline
            </Button>
          </Link>
        </div>
      )}

      {/* Live Waiting Queue Banner if Checked In */}
      {queueEntry && (
        <div className="p-4 sm:p-5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                  Live Clinic Waiting List
                </span>
                <Badge variant="default" className="text-[10px]">
                  {queueEntry.status}
                </Badge>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                Queue Position: #{queueEntry.queueNumber} • Est. Wait: ~{queueEntry.estimatedWaitMinutes} mins
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Consulting with Dr. {queueEntry.doctor?.user.lastName} at {queueEntry.clinic?.name}
              </p>
            </div>
          </div>

          <Link href="/patient/queue" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs border-sky-300 text-sky-800">
              View Queue Status
            </Button>
          </Link>
        </div>
      )}

      {/* PRIMARY 3 ACTIONS (Reference Workflow Central Touchpoints) */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Primary Healthcare Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. DOCTOR CARD */}
          <Link
            href="/patient/doctors"
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl border-2 border-slate-200 bg-white hover:border-sky-500 transition-all shadow-card hover:shadow-elevated cursor-pointer"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center mb-5 transition-colors shadow-subtle">
                <Stethoscope className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                Doctor Consultation
              </span>
              <h3 className="text-2xl font-bold text-navy-950 mt-2 group-hover:text-sky-600 transition-colors">
                DOCTOR
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Find verified specialists and book lock-protected doctor consultation appointments with live slot schedules.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-700 group-hover:text-sky-800">
              <span>Book Doctor Consultation</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* 2. MEDICINE CARD */}
          <Link
            href="/patient/medicines"
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl border-2 border-slate-200 bg-white hover:border-emerald-500 transition-all shadow-card hover:shadow-elevated cursor-pointer"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center mb-5 transition-colors shadow-subtle">
                <Pill className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Pharmacy Reservation
              </span>
              <h3 className="text-2xl font-bold text-navy-950 mt-2 group-hover:text-emerald-600 transition-colors">
                MEDICINE
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Search essential medicine inventory across local clinics & pharmacies, and reserve for pickup or home delivery.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
              <span>Reserve Medicines</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* 3. EMERGENCY CARD */}
          <Link
            href="/patient/emergency"
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl border-2 border-red-300 bg-red-50/50 hover:bg-red-50 hover:border-red-600 transition-all shadow-card hover:shadow-elevated cursor-pointer emergency-pulse"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center mb-5 shadow-subtle">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                Immediate Help
              </span>
              <h3 className="text-2xl font-bold text-red-950 mt-2 group-hover:text-red-600 transition-colors">
                EMERGENCY
              </h3>
              <p className="text-xs text-red-900/80 mt-2 leading-relaxed">
                Trigger rapid emergency assistance. Connects directly to nearest trauma center and initiates real-time ambulance response.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-red-200/80 flex items-center justify-between text-xs font-bold text-red-700 group-hover:text-red-800">
              <span>Request Immediate SOS</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Upcoming Appointment Snapshot */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Upcoming Appointment
          </h2>
          <Link
            href="/patient/appointments"
            className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
          >
            View All Appointments ({appointments.length})
          </Link>
        </div>

        {upcomingAppointment ? (
          <Card className="border border-slate-200 shadow-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {upcomingAppointment.appointmentNumber}
                    </span>
                    <Badge
                      variant={
                        upcomingAppointment.status === 'CONFIRMED'
                          ? 'success'
                          : upcomingAppointment.status === 'CHECKED_IN'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {upcomingAppointment.status}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    Dr. {upcomingAppointment.doctor?.user.firstName} {upcomingAppointment.doctor?.user.lastName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {upcomingAppointment.clinic?.name} • {upcomingAppointment.clinic?.address}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 pt-1">
                    <div className="flex items-center gap-1.5 text-sky-700">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(upcomingAppointment.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sky-700">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(upcomingAppointment.startTime)} - {formatTime(upcomingAppointment.endTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Link href="/patient/appointments">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-white text-center">
            <p className="text-xs text-slate-500">
              No upcoming appointments scheduled.{' '}
              <Link href="/patient/doctors" className="font-semibold text-sky-600 hover:text-sky-800">
                Book a doctor consultation
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* AI Health Assistant Modal */}
      <AIHealthAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </div>
  );
}
