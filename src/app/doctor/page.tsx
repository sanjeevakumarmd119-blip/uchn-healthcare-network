'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import Link from 'next/link';
import {
  Calendar,
  Users,
  ShieldAlert,
  Pill,
  ArrowRight,
  Loader2,
  Smartphone,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatTime } from '@/lib/utils';
import { Appointment, EmergencyCase, WaitingQueueEntry, MedicineInventoryItem } from '@/types';
import { useAppDownload } from '@/context/AppDownloadContext';
import { APP_CONFIG } from '@/config/version';

export default function DoctorDashboardOverview() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { openDownloadModal, isAppInstalled } = useAppDownload();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<WaitingQueueEntry[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyCase[]>([]);
  const [inventory, setInventory] = useState<MedicineInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverviewData = async () => {
    try {
      setIsLoading(true);

      const [aptRes, qRes, emgRes, invRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/queue'),
        fetch('/api/emergency/active'),
        fetch('/api/inventory'),
      ]);

      if (aptRes.ok) {
        const d = await aptRes.json();
        if (d.success) setAppointments(d.data.appointments || []);
      }
      if (qRes.ok) {
        const d = await qRes.json();
        if (d.success) setQueue(d.data.queue || []);
      }
      if (emgRes.ok) {
        const d = await emgRes.json();
        if (d.success) setEmergencies(d.data.emergencies || []);
      }
      if (invRes.ok) {
        const d = await invRes.json();
        if (d.success) setInventory(d.data.inventory || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  // Real-time multi-socket listening
  useEffect(() => {
    if (!socket) return;

    socket.on('emergency:broadcast', () => fetchOverviewData());
    socket.on('queue:update', () => fetchOverviewData());
    socket.on('appointment:global_update', () => fetchOverviewData());
    socket.on('inventory:update', () => fetchOverviewData());

    return () => {
      socket.off('emergency:broadcast');
      socket.off('queue:update');
      socket.off('appointment:global_update');
      socket.off('inventory:update');
    };
  }, [socket]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const lowStockCount = inventory.filter(
    (i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-8 space-y-4 sm:space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-extrabold text-navy-950 tracking-tight font-sans">
              Clinical Operations
            </h1>
            <button
              type="button"
              onClick={openDownloadModal}
              className="px-2 py-0.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 font-mono text-[10px] font-bold border border-sky-200 transition-colors tap-bounce cursor-pointer"
              title="Click to view App version & install guide"
            >
              v{APP_CONFIG.version}
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Logged in as {user?.firstName} {user?.lastName} ({user?.role?.replace('_', ' ')})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAppInstalled && (
            <button
              type="button"
              onClick={openDownloadModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-subtle transition-all h-9 tap-bounce cursor-pointer"
              title="Download & Install UCHN App"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-600" />
              <span>Install App</span>
            </button>
          )}

          <Link href="/doctor/emergency">
            <Button
              variant="emergency"
              size="sm"
              className="text-xs font-bold gap-1.5 shadow-subtle h-9 tap-bounce"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{emergencies.length} Emergencies</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* HIGHEST PRIORITY EMERGENCY CASE BANNER (If any active) */}
      {emergencies.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-600 text-white shadow-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-3 emergency-pulse">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-red-600 flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-wider uppercase bg-white/25 px-2 py-0.5 rounded">
                  Trauma Priority
                </span>
                <span className="text-xs font-mono font-bold">
                  {emergencies[0].caseNumber}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold mt-0.5">
                {emergencies[0].emergencyType} ({emergencies[0].severity})
              </h3>
              <p className="text-[11px] text-red-100 mt-0.5">
                {emergencies[0].patient?.user.firstName} {emergencies[0].patient?.user.lastName} • {emergencies[0].address || 'GPS Coordinates'}
              </p>
            </div>
          </div>

          <Link href="/doctor/emergency" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-red-700 hover:bg-red-50 border-white font-bold text-xs shadow-sm w-full sm:w-auto h-9 tap-bounce"
            >
              Open Emergency Queue
            </Button>
          </Link>
        </div>
      )}

      {/* 4 Primary Operational Metrics (2x2 Grid on Mobile / 4-Col on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Today's Appointments */}
        <Link href="/doctor/appointments" className="block group tap-bounce">
          <Card className="p-3.5 sm:p-5 border border-slate-200/90 shadow-card hover:border-sky-400 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-sky-700 transition-colors">
                Appointments
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{appointments.length}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 block mt-0.5">Today&apos;s schedule →</span>
            </div>
          </Card>
        </Link>

        {/* Waiting Patients */}
        <Link href="/doctor/queue" className="block group tap-bounce">
          <Card className="p-3.5 sm:p-5 border border-slate-200/90 shadow-card hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-blue-700 transition-colors">
                Waiting Queue
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <span className="text-2xl sm:text-3xl font-black text-blue-700">{queue.length}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 block mt-0.5">In waiting room →</span>
            </div>
          </Card>
        </Link>

        {/* Active Emergencies */}
        <Link href="/doctor/emergency" className="block group tap-bounce">
          <Card className="p-3.5 sm:p-5 border border-red-200 bg-red-50/40 shadow-card hover:border-red-400 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-red-800 uppercase tracking-wider group-hover:text-red-900 transition-colors">
                Emergencies
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <span className="text-2xl sm:text-3xl font-black text-red-600">{emergencies.length}</span>
              <span className="text-[10px] sm:text-xs text-red-800/70 block mt-0.5">Critical SOS →</span>
            </div>
          </Card>
        </Link>

        {/* Low Stock Medicines */}
        <Link href="/doctor/inventory" className="block group tap-bounce">
          <Card className="p-3.5 sm:p-5 border border-amber-200 bg-amber-50/40 shadow-card hover:border-amber-400 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-amber-800 uppercase tracking-wider group-hover:text-amber-900 transition-colors">
                Low Stock
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <span className="text-2xl sm:text-3xl font-black text-amber-700">{lowStockCount}</span>
              <span className="text-[10px] sm:text-xs text-amber-800/70 block mt-0.5">Replenish items →</span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Two Columns: Patient Waiting List & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Live Waiting Queue Preview */}
        <Card className="border border-slate-200 shadow-card flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <span>Live Patient Waiting List</span>
            </CardTitle>
            <Link
              href="/doctor/queue"
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 px-2.5 py-1 rounded-lg hover:bg-sky-50 transition-colors"
            >
              Manage Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-4 flex-1">
            {queue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No patients currently waiting in queue.
              </div>
            ) : (
              <div className="space-y-2.5">
                {queue.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href="/doctor/queue"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-300 transition-all text-xs cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center group-hover:scale-105 transition-transform">
                        #{item.queueNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-sky-900 transition-colors">
                          {item.patient?.user.firstName} {item.patient?.user.lastName}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Checked in at {formatTime(item.checkInTime)} • Dr. {item.doctor?.user.lastName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={item.status === 'IN_CONSULTATION' ? 'success' : 'default'}
                        className="text-[10px]"
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments Schedule Snapshot */}
        <Card className="border border-slate-200 shadow-card flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-navy-700" />
              <span>Appointments Schedule</span>
            </CardTitle>
            <Link
              href="/doctor/appointments"
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 px-2.5 py-1 rounded-lg hover:bg-sky-50 transition-colors"
            >
              Full Schedule <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-4 flex-1">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No appointments scheduled for today.
              </div>
            ) : (
              <div className="space-y-2.5">
                {appointments.slice(0, 4).map((apt) => (
                  <Link
                    key={apt.id}
                    href="/doctor/appointments"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-300 transition-all text-xs cursor-pointer group shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-sky-900 transition-colors">
                          {apt.patient?.user.firstName} {apt.patient?.user.lastName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({apt.appointmentNumber})
                        </span>
                      </div>
                      <span className="text-[11px] text-sky-700 font-medium block">
                        {formatTime(apt.startTime)} - {formatTime(apt.endTime)} • {apt.reason || 'General Consultation'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          apt.status === 'CONFIRMED'
                            ? 'success'
                            : apt.status === 'CHECKED_IN'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {apt.status}
                      </Badge>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
