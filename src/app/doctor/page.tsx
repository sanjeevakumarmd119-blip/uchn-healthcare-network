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
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Loader2,
  Stethoscope,
  Activity,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatTime } from '@/lib/utils';
import { Appointment, EmergencyCase, WaitingQueueEntry, MedicineInventoryItem } from '@/types';

export default function DoctorDashboardOverview() {
  const { user } = useAuth();
  const { socket } = useSocket();

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
      console.error('Doctor overview fetch error', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  // Real-time synchronization
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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight font-sans">
            Clinical Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Logged in as {user?.firstName} {user?.lastName} ({user?.role.replace('_', ' ')})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/doctor/emergency">
            <Button
              variant="emergency"
              size="sm"
              className="text-xs font-bold gap-1.5 shadow-subtle"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{emergencies.length} Active Emergencies</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* HIGHEST PRIORITY EMERGENCY CASE BANNER (If any active) */}
      {emergencies.length > 0 && (
        <div className="p-5 rounded-2xl bg-red-600 text-white shadow-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-4 emergency-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white text-red-600 flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold tracking-wider uppercase bg-white/25 px-2 py-0.5 rounded">
                  Critical Emergency Priority
                </span>
                <span className="text-xs font-mono font-bold">
                  {emergencies[0].caseNumber}
                </span>
              </div>
              <h3 className="text-lg font-bold mt-1">
                {emergencies[0].emergencyType} ({emergencies[0].severity})
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                Patient: {emergencies[0].patient?.user.firstName} {emergencies[0].patient?.user.lastName} • {emergencies[0].address || 'Current Coordinates'}
              </p>
            </div>
          </div>

          <Link href="/doctor/emergency">
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-red-700 hover:bg-red-50 border-white font-bold text-xs shadow-sm w-full sm:w-auto"
            >
              Open Emergency Queue
            </Button>
          </Link>
        </div>
      )}

      {/* 4 Primary Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        <Card className="p-5 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Appointments
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{appointments.length}</span>
            <span className="text-xs text-slate-500 block mt-0.5">Scheduled today</span>
          </div>
        </Card>

        {/* Waiting Patients */}
        <Card className="p-5 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Waiting Queue
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-blue-700">{queue.length}</span>
            <span className="text-xs text-slate-500 block mt-0.5">In waiting room</span>
          </div>
        </Card>

        {/* Active Emergencies */}
        <Card className="p-5 border border-red-200 bg-red-50/30 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-800 uppercase tracking-wider">
              Emergencies
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-red-600">{emergencies.length}</span>
            <span className="text-xs text-red-800/70 block mt-0.5">Active cases</span>
          </div>
        </Card>

        {/* Low Stock Medicines */}
        <Card className="p-5 border border-amber-200 bg-amber-50/30 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Low Stock Alert
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-700">{lowStockCount}</span>
            <span className="text-xs text-amber-800/70 block mt-0.5">Requiring restock</span>
          </div>
        </Card>
      </div>

      {/* Main Two Columns: Patient Waiting List & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Waiting Queue Preview */}
        <Card className="border border-slate-200 shadow-card flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <span>Live Patient Waiting List</span>
            </CardTitle>
            <Link href="/doctor/queue">
              <Button variant="ghost" size="sm" className="text-xs text-sky-600">
                Manage Queue <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
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
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center">
                        #{item.queueNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">
                          {item.patient?.user.firstName} {item.patient?.user.lastName}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Checked in at {formatTime(item.checkInTime)} • Dr. {item.doctor?.user.lastName}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={item.status === 'IN_CONSULTATION' ? 'success' : 'default'}
                      className="text-[10px]"
                    >
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
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
            <Link href="/doctor/appointments">
              <Button variant="ghost" size="sm" className="text-xs text-sky-600">
                Full Schedule <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
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
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

