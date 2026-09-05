'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Phone,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatDate, formatTime } from '@/lib/utils';
import { Appointment } from '@/types';

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);

      const res = await fetch(`/api/appointments?${params.toString()}`);
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
  }, [selectedDate]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    socket.on('appointment:global_update', () => fetchAppointments());

    return () => {
      socket.off('appointment:global_update');
    };
  }, [socket]);

  const handleStatusUpdate = async (aptId: string, status: string) => {
    setActionLoading(aptId);
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
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

  const handleCheckInPatient = async (apt: Appointment) => {
    setActionLoading(apt.id);
    try {
      const res = await fetch('/api/queue/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apt.id, triagePriority: 'NORMAL' }),
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
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
            Appointments Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View consultation schedules, verify check-ins, and manage appointment outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-40 h-9 text-xs"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate('')}
              className="text-xs text-slate-500"
            >
              Clear Date
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['ALL', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(
          (st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-navy-900 text-white shadow-subtle'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          )
        )}
      </div>

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
            No consultations match the selected date and status filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => (
            <Card
              key={apt.id}
              className="p-5 border border-slate-200 shadow-card hover:shadow-elevated transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
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
                    {apt.patient?.user.firstName} {apt.patient?.user.lastName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(apt.appointmentDate)}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                    </span>
                    {apt.patient?.user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {apt.patient.user.phone}
                      </span>
                    )}
                  </div>

                  {apt.reason && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-1">
                      <strong>Reason:</strong> {apt.reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {apt.status === 'CONFIRMED' && !apt.waitingQueueEntry && (
                    <Button
                      size="sm"
                      onClick={() => handleCheckInPatient(apt)}
                      isLoading={actionLoading === apt.id}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1" /> Check-In
                    </Button>
                  )}

                  {apt.status === 'CHECKED_IN' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(apt.id, 'IN_PROGRESS')}
                      isLoading={actionLoading === apt.id}
                      className="text-xs bg-sky-600 hover:bg-sky-700"
                    >
                      Start
                    </Button>
                  )}

                  {apt.status === 'IN_PROGRESS' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(apt.id, 'COMPLETED')}
                      isLoading={actionLoading === apt.id}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      Complete
                    </Button>
                  )}

                  {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusUpdate(apt.id, 'CANCELLED')}
                      isLoading={actionLoading === apt.id}
                      className="text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

