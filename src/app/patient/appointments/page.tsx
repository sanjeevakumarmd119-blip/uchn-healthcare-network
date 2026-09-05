'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Stethoscope,
  Plus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BackButton } from '@/components/common/BackButton';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { Appointment } from '@/types';

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/patient/appointments');
      return;
    }
    fetchAppointments();
  }, [user]);

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

  const handleCancel = async (aptId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    setActionLoading(aptId);
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', notes: 'Cancelled by patient' }),
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

  const handleCheckIn = async (apt: Appointment) => {
    setActionLoading(apt.id);
    try {
      const res = await fetch('/api/queue/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apt.id, triagePriority: 'NORMAL' }),
      });
      const json = await res.json();
      if (json.success) {
        router.push('/patient/queue');
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <BackButton fallbackUrl="/patient" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
            My Doctor Consultations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track consultation schedules, check-in for appointments, and review medical history.
          </p>
        </div>

        <Link href="/patient/doctors">
          <Button size="sm" className="gap-2 text-xs">
            <Plus className="w-4 h-4" /> Book Doctor Consultation
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['ALL', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
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

      {/* Appointments List */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filter === 'ALL'
              ? 'You have not booked any appointments yet.'
              : `No appointments with status '${filter}'.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const isToday =
              new Date(apt.appointmentDate).toDateString() === new Date().toDateString();
            const canCheckIn =
              (apt.status === 'CONFIRMED') && !apt.waitingQueueEntry;
            const canCancel = apt.status === 'CONFIRMED' || apt.status === 'HELD';

            return (
              <Card
                key={apt.id}
                className="p-6 border border-slate-200 shadow-card hover:shadow-elevated transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {apt.appointmentNumber}
                      </span>
                      <Badge
                        variant={
                          apt.status === 'CONFIRMED'
                            ? 'success'
                            : apt.status === 'CHECKED_IN' || apt.status === 'IN_PROGRESS'
                            ? 'default'
                            : apt.status === 'CANCELLED'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {apt.status}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      Dr. {apt.doctor?.user.firstName} {apt.doctor?.user.lastName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {apt.clinic?.name} • {apt.clinic?.address}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 pt-1">
                      <div className="flex items-center gap-1.5 text-sky-700">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(apt.appointmentDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sky-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(apt.startTime)} - {formatTime(apt.endTime)}</span>
                      </div>
                    </div>

                    {apt.reason && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-2">
                        <strong>Reason:</strong> {apt.reason}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 self-start sm:self-auto">
                    {canCheckIn && (
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(apt)}
                        isLoading={actionLoading === apt.id}
                        className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700"
                      >
                        Self Check-In
                      </Button>
                    )}

                    {apt.waitingQueueEntry && (
                      <Link href="/patient/queue" className="w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-xs border-sky-300 text-sky-800"
                        >
                          Queue: #{apt.waitingQueueEntry.queueNumber}
                        </Button>
                      </Link>
                    )}

                    {canCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(apt.id)}
                        isLoading={actionLoading === apt.id}
                        className="w-full sm:w-auto text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Cancel
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

