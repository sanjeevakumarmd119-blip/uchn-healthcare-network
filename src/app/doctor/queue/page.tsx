'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  UserCheck,
  Stethoscope,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Card } from '@/components/ui/Card';
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

  const handleStatusChange = async (queueId: string, status: string) => {
    setActionLoading(queueId);
    try {
      const res = await fetch(`/api/queue/${queueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
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
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <BackButton fallbackUrl="/doctor" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
            Patient Waiting List & Live Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage patient consultations, triage priorities, and consultation status in real-time.
          </p>
        </div>

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
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No patients currently waiting</h3>
          <p className="text-xs text-slate-500 mt-1">
            Checked-in patients will automatically appear in this list with live queue positions.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {queue.map((item) => {
            const isConsulting = item.status === 'IN_CONSULTATION';
            const waitTime = getWaitTimeMinutes(item.checkInTime);

            return (
              <Card
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all tap-bounce ${
                  isConsulting
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-card'
                    : 'border-slate-200 bg-white shadow-subtle hover:shadow-card'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Queue Token Circle */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black flex-shrink-0 shadow-subtle ${
                        isConsulting
                          ? 'bg-emerald-600 text-white'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-bold tracking-tighter opacity-80">
                        No.
                      </span>
                      <span className="text-lg leading-none">{item.queueNumber}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            isConsulting
                              ? 'success'
                              : item.triagePriority === 'HIGH' || item.triagePriority === 'CRITICAL'
                              : item.triagePriority === 'URGENT' || item.triagePriority === 'CRITICAL'
                              ? 'emergency'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {item.triagePriority} PRIORITY
                        </Badge>

                        <span className="text-xs font-mono text-slate-400">
                          Checked-in: {formatTime(item.checkInTime)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {item.patient?.user?.firstName} {item.patient?.user?.lastName}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Wait Time: ~{waitTime} mins
                        </span>
                        {item.patient?.user?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {item.patient.user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {!isConsulting && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(item.id, 'IN_CONSULTATION')}
                        isLoading={actionLoading === item.id}
                        className="bg-sky-600 hover:bg-sky-700 text-xs text-white"
                      >
                        <Stethoscope className="w-3.5 h-3.5 mr-1" /> Call Patient
                      </Button>
                    )}

                    {isConsulting && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                        isLoading={actionLoading === item.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs text-white"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finish Consultation
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(item.id, 'CANCELLED')}
                      isLoading={actionLoading === item.id}
                      className="text-xs text-slate-400 hover:text-rose-600"
                    >
                      Remove
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