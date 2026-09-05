'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Check,
  AlertTriangle,
  Loader2,
  Phone,
  ArrowUpDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BackButton } from '@/components/common/BackButton';
import { formatTime } from '@/lib/utils';
import { WaitingQueueEntry } from '@/types';

export default function DoctorQueuePage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [queue, setQueue] = useState<WaitingQueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/queue');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setQueue(json.data.queue || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    socket.on('queue:update', () => fetchQueue());

    return () => {
      socket.off('queue:update');
    };
  }, [socket]);

  const handleUpdateStatus = async (
    queueId: string,
    newStatus: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED'
  ) => {
    setActionLoading(queueId);
    try {
      const res = await fetch(`/api/queue/${queueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (json.success) {
        fetchQueue();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const getWaitTimeMinutes = (checkInTime: string) => {
    const elapsed = Math.floor(
      (new Date().getTime() - new Date(checkInTime).getTime()) / (1000 * 60)
    );
    return Math.max(0, elapsed);
  };

  return (
    <div className="space-y-6">
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <BackButton fallbackUrl="/doctor" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
          <h1 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Patient Waiting List & Live Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage patient consultations, triage priorities, and consultation status in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="default" className="text-xs px-3 py-1 font-bold">
            {queue.filter((q) => q.status === 'WAITING').length} Waiting •{' '}
            {queue.filter((q) => q.status === 'IN_CONSULTATION').length} In Consultation
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading live queue...</p>
        </div>
      ) : queue.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No patients currently waiting</h3>
          <p className="text-xs text-slate-500 mt-1">
            Checked-in patients will automatically appear in this list with live queue positions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
        <div className="space-y-3 sm:space-y-4">
          {queue.map((item) => {
            const isConsulting = item.status === 'IN_CONSULTATION';
            const waitTime = getWaitTimeMinutes(item.checkInTime);

            return (
              <Card
                key={item.id}
                className={`p-5 border transition-all ${
                className={`p-4 sm:p-5 rounded-2xl border transition-all tap-bounce ${
                  isConsulting
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-card'
                    : 'border-slate-200 bg-white shadow-subtle hover:shadow-card'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                        isConsulting
                          ? 'bg-emerald-600 text-white shadow-sm animate-pulse'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      #{item.queueNumber}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {item.patient?.user.firstName} {item.patient?.user.lastName}
                        </h3>
                        <Badge
                          variant={
                            item.triagePriority === 'CRITICAL'
                              ? 'emergency'
                              : item.triagePriority === 'URGENT'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {item.triagePriority}
                        </Badge>
                        <Badge
                          variant={isConsulting ? 'success' : 'default'}
                          className="text-[10px]"
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500">
                        Assigned to Dr. {item.doctor?.user.firstName} {item.doctor?.user.lastName}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Checked In: {formatTime(item.checkInTime)} ({waitTime} mins ago)
                        </span>
                        {item.patient?.user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {item.patient.user.phone}
                          </span>
                        )}
                        {item.appointment?.reason && (
                          <span className="text-slate-700 font-medium">
                            Reason: {item.appointment.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {item.status === 'WAITING' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(item.id, 'IN_CONSULTATION')}
                        isLoading={actionLoading === item.id}
                        className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Consultation
                      </Button>
                    )}

                    {item.status === 'IN_CONSULTATION' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                        isLoading={actionLoading === item.id}
                        className="text-xs font-semibold gap-1.5 bg-sky-600 hover:bg-sky-700"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Completed
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateStatus(item.id, 'CANCELLED')}
                      isLoading={actionLoading === item.id}
                      className="text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Cancel
                    </Button>
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

