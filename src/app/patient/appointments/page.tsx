'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  Stethoscope,
  Building2,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BackButton } from '@/components/common/BackButton';
import { formatDate, formatTime } from '@/lib/utils';
import { Appointment } from '@/types';
import Link from 'next/link';

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setAppointments(json.data.appointments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    socket.on('appointment:global_update', () => fetchAppointments());

    return () => {
      socket.off('appointment:global_update');
    };
  }, [socket]);

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this consultation?')) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const json = await res.json();
      if (json.success) {
        fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelfCheckIn = async (appointmentId: string) => {
    setActionLoading(appointmentId);
    try {
      const res = await fetch('/api/queue/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, triagePriority: 'NORMAL' }),
      });
      const json = await res.json();
      if (json.success) {
        fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <BackButton fallbackUrl="/patient" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            My Doctor Consultations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track consultation schedules, check-in for appointments, and review medical history.
          </p>
        </div>

        <Link href="/patient/doctors" className="w-full sm:w-auto">
          <Button size="sm" className="w-full sm:w-auto gap-2 text-xs tap-bounce">
            <Plus className="w-4 h-4" /> Book Doctor Consultation
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        {['ALL', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all tap-bounce cursor-pointer ${
                filter === status
                  ? 'bg-navy-900 text-white shadow-subtle'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          )
        )}
      </div>

      {/* Appointment Cards List */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading your appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Book your doctor consultation to reserve a clinic appointment slot.
          </p>
          <div className="mt-4">
            <Link href="/patient/doctors">
              <Button size="sm" className="text-xs tap-bounce">
                Find Doctors
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredAppointments.map((apt) => {
            const isConfirmed = apt.status === 'CONFIRMED';
            const isCheckedIn = apt.status === 'CHECKED_IN';
            const isInProgress = apt.status === 'IN_PROGRESS';
            const isCompleted = apt.status === 'COMPLETED';
            const isCancelled = apt.status === 'CANCELLED';

            return (
              <Card
                key={apt.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-all tap-bounce"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {apt.appointmentNumber}
                      </span>
                      <Badge
                        variant={
                          isConfirmed
                            ? 'success'
                            : isCheckedIn
                            ? 'default'
                            : isInProgress
                            ? 'secondary'
                            : isCompleted
                            ? 'outline'
                            : 'destructive'
                        }
                        className="text-[10px]"
                      >
                        {apt.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                      </h3>
                      <p className="text-xs text-sky-700 font-semibold">
                        {apt.doctor?.doctorSpecialties?.[0]?.specialty?.name || 'General Practitioner'} • {apt.clinic?.name}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(apt.appointmentDate)}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {apt.clinic?.address}
                      </span>
                    </div>

                    {apt.reason && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <strong>Reason:</strong> {apt.reason}
                      </p>
                    )}

                    {apt.notes && (
                      <div className="text-[11px] text-slate-600 bg-sky-50/70 p-2.5 rounded-lg border border-sky-100 font-sans whitespace-pre-line">
                        <strong className="text-sky-900 block mb-0.5">Clinical SOAP & Prescription:</strong>
                        {apt.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                    {isConfirmed && !apt.waitingQueueEntry && (
                      <Button
                        size="sm"
                        onClick={() => handleSelfCheckIn(apt.id)}
                        isLoading={actionLoading === apt.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 tap-bounce"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Self Check-In
                      </Button>
                    )}

                    {isCheckedIn && (
                      <Link href="/patient/queue">
                        <Button size="sm" variant="outline" className="text-xs border-sky-300 text-sky-800 gap-1.5 tap-bounce">
                          View Live Queue
                        </Button>
                      </Link>
                    )}

                    {isConfirmed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelAppointment(apt.id)}
                        isLoading={actionLoading === apt.id}
                        className="text-xs text-rose-600 hover:bg-rose-50"
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}