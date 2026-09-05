'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';
import {
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
  Hospital,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { WaitingQueueEntry } from '@/types';
import Link from 'next/link';

export default function PatientQueuePage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [queueEntry, setQueueEntry] = useState<WaitingQueueEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/patient/queue');
      return;
    }
    fetchQueueStatus();
  }, [user]);

  // Real-time socket listener for queue updates
  useEffect(() => {
    if (!socket) return;

    const handlePatientUpdate = (updated: WaitingQueueEntry) => {
      console.log('⚡ Queue status update received:', updated);
      setQueueEntry(updated);
    };

    socket.on('queue:patient_update', handlePatientUpdate);

    return () => {
      socket.off('queue:patient_update', handlePatientUpdate);
    };
  }, [socket]);

  const fetchQueueStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/queue');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setQueueEntry(json.data.queueEntry || null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
          Live Clinic Waiting List
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time queue tracking and consultation readiness status.
        </p>
      </div>

      {queueEntry ? (
        <div className="space-y-6">
          {queueEntry.status === 'IN_CONSULTATION' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 shadow-card flex items-center gap-3.5">
              <Sparkles className="w-8 h-8 text-emerald-600 flex-shrink-0 animate-bounce" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Doctor Is Ready for You!
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Please proceed to the consultation room for your examination with Dr. {queueEntry.doctor?.user.lastName}.
                </p>
              </div>
            </div>
          )}

          <Card className="border border-slate-200 shadow-card p-6 sm:p-8 text-center space-y-6">
            <div className="w-24 h-24 rounded-3xl bg-sky-50 border border-sky-200 text-sky-700 flex flex-col items-center justify-center mx-auto shadow-subtle">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Queue #
              </span>
              <span className="text-4xl font-black text-sky-700">
                {queueEntry.queueNumber}
              </span>
            </div>

            <div>
              <Badge
                variant={
                  queueEntry.status === 'IN_CONSULTATION'
                    ? 'success'
                    : queueEntry.status === 'WAITING'
                    ? 'default'
                    : 'secondary'
                }
                className="text-xs px-3 py-1 font-bold"
              >
                {queueEntry.status.replace('_', ' ')}
              </Badge>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                Dr. {queueEntry.doctor?.user.firstName} {queueEntry.doctor?.user.lastName}
              </h2>
              <p className="text-xs text-slate-500">
                {queueEntry.clinic?.name} • {queueEntry.clinic?.address}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Estimated Wait</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                  ~{queueEntry.estimatedWaitMinutes} mins
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Triage Priority</span>
                <span className="text-base font-bold text-sky-700 mt-0.5 block">
                  {queueEntry.triagePriority}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Please remain near the reception or waiting lobby. Your screen will update automatically as the queue progresses.
            </p>
          </Card>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">You are not currently in any waiting list</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you arrive at the clinic for your booked consultation, use Self Check-In on the appointments page to receive your queue ticket.
          </p>
          <div className="pt-2">
            <Link href="/patient/appointments">
              <Button size="sm" variant="outline" className="text-xs">
                Go to Appointments
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

