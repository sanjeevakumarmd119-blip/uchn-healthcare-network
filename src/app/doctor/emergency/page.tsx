'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
  ShieldAlert,
  MapPin,
  Ambulance,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Check,
  Building2,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatTime, formatDate } from '@/lib/utils';
import { EmergencyCase, EmergencyStatus } from '@/types';

export default function DoctorEmergencyPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [emergencies, setEmergencies] = useState<EmergencyCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dispatch Ambulance Modal
  const [dispatchCase, setDispatchCase] = useState<EmergencyCase | null>(null);
  const [ambulanceUnit, setAmbulanceUnit] = useState('AMB-UNIT-104');
  const [dispatchNotes, setDispatchNotes] = useState('Paramedic team dispatched with ALS kit.');

  const fetchEmergencies = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/emergency/active');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setEmergencies(json.data.emergencies || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    socket.on('emergency:broadcast', () => fetchEmergencies());

    return () => {
      socket.off('emergency:broadcast');
    };
  }, [socket]);

  const handleStatusTransition = async (
    caseId: string,
    status: EmergencyStatus,
    extra?: { ambulanceId?: string; notes?: string }
  ) => {
    setActionLoading(caseId);
    try {
      const res = await fetch(`/api/emergency/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ambulanceId: extra?.ambulanceId,
          notes: extra?.notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        fetchEmergencies();
        setDispatchCase(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span>Highest Operational Priority</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
            Emergency Cases Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time trauma dispatch console and multi-stage lifecycle coordinator.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emergency" className="text-xs px-3 py-1 font-bold">
            {emergencies.length} Active Emergency Cases
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading emergency queue...</p>
        </div>
      ) : emergencies.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No active emergency cases</h3>
          <p className="text-xs text-slate-500 mt-1">
            Incoming emergency SOS requests will appear here instantly with sound and visual alerts.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {emergencies.map((emg) => {
            const isPending = emg.status === 'PENDING';
            const isAssigned = emg.status === 'ASSIGNED';
            const isDispatched = emg.status === 'AMBULANCE_DISPATCHED';
            const isInProgress = emg.status === 'IN_PROGRESS';

            return (
              <Card
                key={emg.id}
                className="border-2 border-red-300 bg-white shadow-card hover:shadow-elevated transition-all overflow-hidden"
              >
                <div className="p-4 bg-red-50/80 border-b border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-red-900 bg-red-100 px-2 py-0.5 rounded">
                      {emg.caseNumber}
                    </span>
                    <Badge variant="emergency" className="text-[10px]">
                      {emg.severity}
                    </Badge>
                    <Badge variant="default" className="text-[10px] bg-red-600 text-white font-bold">
                      {emg.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-red-800 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reported at {formatTime(emg.createdAt)}</span>
                  </div>
                </div>

                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {emg.emergencyType}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        <p>
                          <strong>Patient:</strong> {emg.patient?.user.firstName} {emg.patient?.user.lastName}
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <strong>Phone:</strong> {emg.patient?.user.phone || 'N/A'}
                        </p>
                        <p className="flex items-center gap-1 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-red-600" />
                          <strong>Location:</strong> {emg.address || 'GPS Coordinates'} ({emg.latitude.toFixed(4)}, {emg.longitude.toFixed(4)})
                        </p>
                      </div>

                      {emg.description && (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2">
                          <strong>Patient Symptoms:</strong> {emg.description}
                        </p>
                      )}

                      {emg.ambulanceId && (
                        <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                          <Ambulance className="w-4 h-4 text-emerald-600" />
                          <span>Dispatched Unit: {emg.ambulanceId}</span>
                        </div>
                      )}
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex flex-wrap md:flex-col gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                      {isPending && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusTransition(emg.id, 'ASSIGNED', { notes: 'Accepted by clinical team.' })}
                          isLoading={actionLoading === emg.id}
                          className="text-xs font-bold bg-navy-800 hover:bg-navy-900"
                        >
                          Accept Case
                        </Button>
                      )}

                      {(isPending || isAssigned) && (
                        <Button
                          size="sm"
                          onClick={() => setDispatchCase(emg)}
                          className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5"
                        >
                          <Ambulance className="w-4 h-4" /> Dispatch Ambulance
                        </Button>
                      )}

                      {isDispatched && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusTransition(emg.id, 'IN_PROGRESS', { notes: 'Medics on-site, stabilizing vitals.' })}
                          isLoading={actionLoading === emg.id}
                          className="text-xs font-bold bg-sky-600 hover:bg-sky-700"
                        >
                          Mark On-Site / In Progress
                        </Button>
                      )}

                      {(isDispatched || isInProgress || isAssigned) && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusTransition(emg.id, 'RESOLVED', { notes: 'Patient stabilized and transported.' })}
                          isLoading={actionLoading === emg.id}
                          className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Resolve Case
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusTransition(emg.id, 'CANCELLED', { notes: 'Marked cancelled by clinic control.' })}
                        isLoading={actionLoading === emg.id}
                        className="text-xs text-slate-500 hover:text-rose-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  {/* Status History Collapsible Preview */}
                  {emg.statusHistory && emg.statusHistory.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Timeline Audit History:
                      </span>
                      <div className="space-y-1">
                        {emg.statusHistory.map((h) => (
                          <div
                            key={h.id}
                            className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded"
                          >
                            <span className="font-semibold text-slate-700">
                              {h.status}: <span className="font-normal">{h.notes || 'Status updated'}</span>
                            </span>
                            <span>{formatTime(h.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dispatch Ambulance Modal */}
      {dispatchCase && (
        <Modal
          isOpen={!!dispatchCase}
          onClose={() => setDispatchCase(null)}
          title={`Dispatch Ambulance for ${dispatchCase.caseNumber}`}
          description={`Patient: ${dispatchCase.patient?.user.firstName} ${dispatchCase.patient?.user.lastName} • ${dispatchCase.emergencyType}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <Input
              label="Ambulance Unit Identifier"
              placeholder="e.g. AMB-UNIT-104"
              value={ambulanceUnit}
              onChange={(e) => setAmbulanceUnit(e.target.value)}
            />

            <Input
              label="Dispatch Notes / Team Instructions"
              placeholder="Paramedic team instructions"
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
            />

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDispatchCase(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="emergency"
                onClick={() =>
                  handleStatusTransition(dispatchCase.id, 'AMBULANCE_DISPATCHED', {
                    ambulanceId: ambulanceUnit,
                    notes: dispatchNotes,
                  })
                }
                isLoading={actionLoading === dispatchCase.id}
              >
                Confirm Dispatch
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

