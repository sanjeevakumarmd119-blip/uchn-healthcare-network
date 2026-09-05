'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  MapPin,
  AlertTriangle,
  PhoneCall,
  Ambulance,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Check,
  Building2,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { BackButton } from '@/components/common/BackButton';
import { formatDate, formatTime } from '@/lib/utils';
import { EmergencyCase, EmergencyStatus } from '@/types';

const EMERGENCY_STAGES: { status: EmergencyStatus; label: string; description: string }[] = [
  {
    status: 'PENDING',
    label: 'Request Received',
    description: 'Emergency SOS received. Dispatch team is locating nearest trauma center.',
  },
  {
    status: 'ASSIGNED',
    label: 'Case Assigned',
    description: 'Case assigned to clinical response unit and supervising physician.',
  },
  {
    status: 'AMBULANCE_DISPATCHED',
    label: 'Assistance Dispatched',
    description: 'Ambulance & paramedic unit dispatched to your exact GPS coordinates.',
  },
  {
    status: 'IN_PROGRESS',
    label: 'On-Site Medical Care',
    description: 'Medical crew has arrived and emergency stabilization is in progress.',
  },
  {
    status: 'RESOLVED',
    label: 'Case Resolved',
    description: 'Emergency incident concluded and patient successfully stabilized.',
  },
];

export default function PatientEmergencyPage() {
  const { user } = useAuth();
  const { location, requestCurrentLocation } = useLocation();
  const { socket } = useSocket();
  const router = useRouter();

  const [activeEmergency, setActiveEmergency] = useState<EmergencyCase | null>(null);
  const [historyEmergencies, setHistoryEmergencies] = useState<EmergencyCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Trigger Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState('Cardiac / Severe Chest Pain');
  const [severity, setSeverity] = useState<'CRITICAL' | 'SEVERE' | 'MODERATE'>('CRITICAL');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/patient/emergency');
      return;
    }
    fetchEmergencies();
  }, [user]);

  // Real-time socket listener for live emergency status transitions
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (updated: EmergencyCase) => {
      console.log('🚨 Live emergency update received:', updated);
      setActiveEmergency((prev) => {
        if (!prev || prev.id === updated.id) {
          if (updated.status === 'RESOLVED' || updated.status === 'CANCELLED') {
            fetchEmergencies();
            return null;
          }
          return updated;
        }
        return prev;
      });
    };

    socket.on('emergency:status_update', handleStatusUpdate);

    return () => {
      socket.off('emergency:status_update', handleStatusUpdate);
    };
  }, [socket]);

  const fetchEmergencies = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/emergency');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data.emergencies) {
          const list: EmergencyCase[] = json.data.emergencies;
          const active = list.find(
            (e) => e.status !== 'RESOLVED' && e.status !== 'CANCELLED'
          );
          setActiveEmergency(active || null);
          setHistoryEmergencies(
            list.filter((e) => e.status === 'RESOLVED' || e.status === 'CANCELLED')
          );
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerEmergency = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        latitude: location.latitude || 37.7749,
        longitude: location.longitude || -122.4194,
        address: address.trim() || location.city || 'Patient GPS Location',
        emergencyType,
        severity,
        description: description.trim() || undefined,
      };

      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to trigger emergency dispatch');
      }

      setActiveEmergency(json.data.emergency);
      setIsConfirmModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch emergency request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEmergency = async () => {
    if (!activeEmergency) return;
    if (!confirm('Are you sure you want to cancel this emergency request?')) return;

    try {
      const res = await fetch(`/api/emergency/${activeEmergency.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          notes: 'Cancelled by patient.',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActiveEmergency(null);
        fetchEmergencies();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStageIndex = (status: EmergencyStatus) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'ASSIGNED':
        return 1;
      case 'AMBULANCE_DISPATCHED':
        return 2;
      case 'IN_PROGRESS':
        return 3;
      case 'RESOLVED':
        return 4;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const currentStageIndex = activeEmergency ? getStageIndex(activeEmergency.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <BackButton fallbackUrl="/patient" />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-red-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span>Emergency Care Coordination</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
            Urgent Medical Response
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-subtle">
          <MapPin className="w-4 h-4 text-red-600" />
          <span>{location.city}</span>
        </div>
      </div>

      {/* ACTIVE EMERGENCY REAL-TIME TRACKER */}
      {activeEmergency ? (
        <Card className="border-2 border-red-500 shadow-elevated bg-white overflow-hidden emergency-pulse">
          <div className="p-6 bg-red-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
                  Active Emergency SOS
                </span>
                <span className="font-mono text-xs font-bold">
                  {activeEmergency.caseNumber}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1">
                {activeEmergency.emergencyType}
              </h2>
              <p className="text-xs text-red-100 mt-0.5">
                Severity: <strong className="uppercase">{activeEmergency.severity}</strong> • Reported at {formatTime(activeEmergency.createdAt)}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEmergency}
              className="bg-white/10 hover:bg-white/20 border-white text-white text-xs font-bold self-start sm:self-auto"
            >
              Cancel Request
            </Button>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* 5-Stage Live Interactive Timeline */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
                Live Assistance Timeline (Real-Time Synchronized)
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-8 border-l-2 border-slate-200">
                {EMERGENCY_STAGES.map((stage, idx) => {
                  const isPassed = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <div key={stage.status} className="relative">
                      {/* Node Bullet */}
                      <div
                        className={`absolute -left-[31px] sm:-left-[39px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isPassed
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : isCurrent
                            ? 'bg-red-600 text-white shadow-card emergency-pulse'
                            : 'bg-slate-100 text-slate-400 border border-slate-300'
                        }`}
                      >
                        {isPassed ? (
                          <Check className="w-4 h-4" />
                        ) : isCurrent ? (
                          <Ambulance className="w-4 h-4 animate-bounce" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      {/* Content */}
                      <div className="pt-0.5">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold ${
                              isCurrent
                                ? 'text-red-600'
                                : isPassed
                                ? 'text-emerald-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {stage.label}
                          </h4>
                          {isCurrent && (
                            <Badge variant="emergency" className="text-[9px]">
                              CURRENT STAGE
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assigned Clinical Unit & Emergency Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Assigned Response Center</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {activeEmergency.clinic?.name || 'Central Metro Trauma Hospital'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Helpline: {activeEmergency.clinic?.emergencyHelpline || '+1 (415) 911-0100'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <Ambulance className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Dispatched Vehicle</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Unit ID: {activeEmergency.ambulanceId || 'AMB-UNIT-104'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Emergency Paramedic Life-Support
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* EMERGENCY TRIGGER CARD (When no active emergency) */
        <Card className="border-2 border-red-200 bg-red-50/40 p-8 text-center space-y-6 shadow-card">
          <div className="w-20 h-20 rounded-3xl bg-red-600 text-white flex items-center justify-center mx-auto shadow-elevated emergency-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-red-950">
              Need Immediate Emergency Assistance?
            </h2>
            <p className="text-xs sm:text-sm text-red-900/80 leading-relaxed">
              Press the button below to dispatch urgent paramedic and medical response to your current coordinates.
            </p>
          </div>

          <div>
            <Button
              variant="emergency"
              size="lg"
              onClick={() => setIsConfirmModalOpen(true)}
              className="px-8 py-4 text-base font-bold shadow-elevated"
            >
              REQUEST EMERGENCY ASSISTANCE NOW
            </Button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <PhoneCall className="w-4 h-4 text-red-600" />
            <span>24/7 Direct Trauma Helpline: <strong>+1 (415) 911-0100</strong></span>
          </div>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Emergency Assistance Request"
        description="Are you sure you want to request emergency assistance? A response team will be dispatched immediately."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>
              This will notify trauma physicians and ambulance dispatchers. Please provide brief details for optimal triage.
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <Select
              label="Emergency Type / Chief Complaint"
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value)}
              options={[
                { value: 'Cardiac / Severe Chest Pain', label: 'Cardiac / Severe Chest Pain' },
                { value: 'Severe Trauma / Hemorrhage', label: 'Severe Trauma / Hemorrhage' },
                { value: 'Acute Respiratory Distress / Asthma', label: 'Acute Respiratory Distress / Asthma' },
                { value: 'Stroke / Neurological Paralysis', label: 'Stroke / Neurological Paralysis' },
                { value: 'Allergic Anaphylaxis', label: 'Allergic Anaphylaxis' },
                { value: 'General Medical Emergency', label: 'General Medical Emergency' },
              ]}
            />
          </div>

          <div>
            <Select
              label="Perceived Severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              options={[
                { value: 'CRITICAL', label: 'CRITICAL (Life-Threatening)' },
                { value: 'SEVERE', label: 'SEVERE (Urgent Medical Need)' },
                { value: 'MODERATE', label: 'MODERATE (Acute Distress)' },
              ]}
            />
          </div>

          <div>
            <Input
              label="Location Landmark / Address"
              placeholder="e.g. 742 Evergreen Terrace or near Civic Center"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              helperText={`Detected GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
            />
          </div>

          <div>
            <Input
              label="Additional Emergency Details (Optional)"
              placeholder="e.g. Patient is conscious but having breathing difficulty"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emergency"
              size="sm"
              onClick={handleTriggerEmergency}
              isLoading={isSubmitting}
            >
              Confirm & Dispatch SOS
            </Button>
          </div>
        </div>
      </Modal>

      {/* Emergency Past History Section */}
      {historyEmergencies.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Emergency Incident History ({historyEmergencies.length})
          </h3>
          <div className="space-y-3">
            {historyEmergencies.map((emg) => (
              <div
                key={emg.id}
                className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {emg.caseNumber}
                    </span>
                    <Badge variant={emg.status === 'RESOLVED' ? 'success' : 'secondary'}>
                      {emg.status}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {emg.emergencyType}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {emg.clinic?.name || 'Trauma Center'} • {formatDate(emg.createdAt)} at {formatTime(emg.createdAt)}
                  </p>
                </div>

                <span className="text-xs font-semibold text-slate-400">
                  {emg.ambulanceId ? `Unit ${emg.ambulanceId}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

