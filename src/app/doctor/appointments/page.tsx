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
  Sparkles,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatDate, formatTime } from '@/lib/utils';
import { Appointment } from '@/types';
import { BackButton } from '@/components/common/BackButton';
import { DoctorSoapAssistantModal } from '@/components/ai/DoctorSoapAssistantModal';

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSoapApt, setSelectedSoapApt] = useState<Appointment | null>(null);

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

  const handleStatusUpdate = async (aptId: string, status: string, notes?: string) => {
    setActionLoading(aptId);
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
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

  const handleApplySoapNotes = async (soapNotesText: string) => {
    if (!selectedSoapApt) return;
    await handleStatusUpdate(selectedSoapApt.id, selectedSoapApt.status, soapNotesText);
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

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === 'ALL') return true;
    return apt.status === statusFilter;
  });

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'emergency' => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'CHECKED_IN':
        return 'default';
      case 'IN_PROGRESS':
        return 'secondary';
      case 'COMPLETED':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <BackButton fallbackUrl="/doctor" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Consultation Schedule & Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your daily patient booking calendar, queue check-ins, and AI SOAP documentation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-subtle focus:ring-2 focus:ring-sky-500 tap-bounce"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-sky-600 font-semibold hover:underline tap-bounce cursor-pointer"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        {['ALL', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all tap-bounce cursor-pointer ${
                statusFilter === status
                  ? 'bg-navy-900 text-white shadow-subtle'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          )
        )}
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No appointments found</h3>
          <p className="text-xs text-slate-400 mt-1">
            There are no appointments matching the selected date or filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredAppointments.map((apt) => (
            <Card
              key={apt.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all bg-white tap-bounce"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {apt.appointmentNumber}
                    </span>
                    <Badge variant={getStatusBadgeVariant(apt.status)}>
                      {apt.status.replace(/_/g, ' ')}
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

                  {apt.notes && (
                    <div className="text-[11px] text-slate-600 bg-sky-50/70 p-2.5 rounded-lg border border-sky-100 font-sans whitespace-pre-line mt-1">
                      <strong className="text-sky-900 block mb-0.5">Clinical Notes:</strong>
                      {apt.notes}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* AI SOAP Note Generator Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSoapApt(apt)}
                    className="text-xs border-sky-300 text-sky-800 hover:bg-sky-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-600 mr-1" />
                    AI SOAP Note
                  </Button>

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

      {/* AI SOAP Note Generator Modal */}
      <DoctorSoapAssistantModal
        isOpen={!!selectedSoapApt}
        onClose={() => setSelectedSoapApt(null)}
        appointment={selectedSoapApt}
        onApplyNotes={handleApplySoapNotes}
      />
    </div>
  );
}