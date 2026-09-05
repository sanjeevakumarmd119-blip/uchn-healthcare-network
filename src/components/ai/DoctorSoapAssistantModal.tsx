'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Stethoscope,
  Save,
  X,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SoapNotesResult } from '@/server/services/ai.service';
import { Appointment } from '@/types';

interface DoctorSoapAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onApplyNotes?: (notes: string) => void;
}

export function DoctorSoapAssistantModal({
  isOpen,
  onClose,
  appointment,
  onApplyNotes,
}: DoctorSoapAssistantModalProps) {
  const [patientName, setPatientName] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalObservations, setClinicalObservations] = useState('');
  const [vitalSigns, setVitalSigns] = useState('BP 120/80, Pulse 76, Temp 98.6°F, SpO2 99%');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soapResult, setSoapResult] = useState<SoapNotesResult | null>(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (appointment) {
      setPatientName(
        `${appointment.patient?.user?.firstName || 'Patient'} ${appointment.patient?.user?.lastName || ''}`.trim()
      );
      setChiefComplaint(appointment.reason || 'Routine consultation');
      setDoctorNotes(appointment.notes || '');
      setSoapResult(null);
      setError(null);
    }
  }, [appointment]);

  const handleGenerate = async () => {
    if (!patientName || !chiefComplaint) {
      setError('Patient name and chief complaint are required.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/ai/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          chiefComplaint,
          clinicalObservations,
          vitalSigns,
          doctorNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to generate clinical SOAP notes');
      }

      setSoapResult(json.data.soapNotes);
    } catch (e: any) {
      setError(e.message || 'Error generating clinical documentation.');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedSoapText = soapResult
    ? `=== CLINICAL SOAP NOTE ===
[SUBJECTIVE]
${soapResult.subjective}

[OBJECTIVE]
${soapResult.objective}

[ASSESSMENT]
${soapResult.assessment}

[PLAN]
${soapResult.plan}

[PATIENT DISCHARGE INSTRUCTIONS]
${soapResult.patientInstructions}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSoapText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyNotes && formattedSoapText) {
      onApplyNotes(formattedSoapText);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 pr-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-navy-900 text-white flex items-center justify-center shadow-md">
              <Stethoscope className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-navy-950">
                  AI Clinical SOAP Note Generator
                </h2>
                <Badge variant="default" className="text-[10px] bg-sky-100 text-sky-800">
                  Doctor Console
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Generates structured Subjective, Objective, Assessment, and Plan notes instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Patient Name:
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Chief Complaint:
            </label>
            <input
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Recorded Vitals:
            </label>
            <input
              type="text"
              value={vitalSigns}
              onChange={(e) => setVitalSigns(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:ring-2 focus:ring-sky-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Clinical Physical Examination:
            </label>
            <input
              type="text"
              value={clinicalObservations}
              onChange={(e) => setClinicalObservations(e.target.value)}
              placeholder="e.g. Clear breath sounds, no pedal edema, tenderness in RUQ"
              className="w-full rounded-lg border border-slate-200 p-2.5 bg-slate-50/50 focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !patientName || !chiefComplaint}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Synthesizing SOAP Note...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate Clinical Documentation
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SOAP Notes Result */}
        {soapResult && (
          <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-600" />
                Generated SOAP Record
              </h4>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs">
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy All
                    </>
                  )}
                </Button>

                {onApplyNotes && (
                  <Button size="sm" onClick={handleApply} className="text-xs bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Apply to Appointment
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                  Subjective (History of Present Illness)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {soapResult.subjective}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                  Objective (Vitals & Physical Exam)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {soapResult.objective}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                  Assessment (Clinical Impression)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {soapResult.assessment}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                  Plan (Therapy & Orders)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                  {soapResult.plan}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Patient Discharge Instructions
                </span>
                <p className="text-xs text-emerald-900 leading-relaxed font-sans">
                  {soapResult.patientInstructions}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
