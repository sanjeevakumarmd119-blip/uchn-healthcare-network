'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocation } from '@/context/LocationContext';
import {
  Sparkles,
  Bot,
  Send,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  MapPin,
  Clock,
  ArrowRight,
  Info,
  Loader2,
  X,
  HeartPulse,
  Navigation,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TriageAnalysis } from '@/server/services/ai.service';

interface AIHealthAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIHealthAssistantModal({ isOpen, onClose }: AIHealthAssistantModalProps) {
  const { location, requestCurrentLocation } = useLocation();
  const router = useRouter();

  const [symptoms, setSymptoms] = useState('');
  const [showProfileContext, setShowProfileContext] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triageData, setTriageData] = useState<{
    analysis: TriageAnalysis;
    recommendedDoctors: any[];
    patientContext?: any;
  } | null>(null);

  const samplePrompts = [
    'Chest tightness & shortness of breath for 30 mins',
    'Severe migraine with nausea & photophobia',
    'Persistent dry cough with mild fever for 3 days',
    'Sprained right ankle with swelling',
    'Itchy red skin rash on forearm after medication',
  ];

  const handleAnalyze = async (textToAnalyze?: string) => {
    const query = textToAnalyze || symptoms;
    if (!query || query.trim().length < 3) {
      setError('Please describe your symptoms in more detail.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: query.trim(),
          latitude: location.latitude,
          longitude: location.longitude,
          locationCity: location.city,
          age: age || undefined,
          gender: gender || undefined,
          allergies: allergies || undefined,
          medicalHistory: medicalHistory || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to analyze symptoms');
      }

      setTriageData(json.data);
    } catch (e: any) {
      setError(e.message || 'Error communicating with AI assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setSymptoms(prompt);
    handleAnalyze(prompt);
  };

  const resetForm = () => {
    setSymptoms('');
    setTriageData(null);
    setError(null);
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL_EMERGENCY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 flex items-center gap-1.5 emergency-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            CRITICAL EMERGENCY
          </span>
        );
      case 'URGENT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            URGENT CARE NEEDED
          </span>
        );
      case 'MODERATE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-600" />
            MODERATE — SCHEDULE CONSULTATION
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ROUTINE / HOME CARE
          </span>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="xl">
      <div className="space-y-5">
        {/* Header Title */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 pr-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-navy-900 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-navy-950">
                  UCHN AI Health Assistant
                </h2>
                <Badge variant="default" className="text-[10px] bg-sky-100 text-sky-800 hidden xs:inline-flex">
                  Clinical Triage
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Instant clinical triage, specialist recommendations & real-time GPS hospital matching.
              </p>
            </div>
          </div>
        </div>

        {/* Live Location Bar */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span className="font-semibold text-slate-800">Your Location:</span>
            <span className="text-slate-600 truncate max-w-[220px] sm:max-w-[320px]">
              {location.city}
            </span>
            <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
              ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
            </span>
          </div>

          <button
            type="button"
            onClick={() => requestCurrentLocation()}
            disabled={location.isDetecting}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-sky-700 border border-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-2xs self-end sm:self-auto cursor-pointer"
          >
            {location.isDetecting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                <span>Locating GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3 h-3 text-sky-600" />
                <span>Detect Live GPS</span>
              </>
            )}
          </button>
        </div>

        {/* Optional Health Profile Context Drawer */}
        <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowProfileContext(!showProfileContext)}
            className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-sky-600" />
              <span>Personalize with Health Details (Optional)</span>
              {(age || gender || allergies) && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
            {showProfileContext ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showProfileContext && (
            <div className="p-3.5 space-y-3 bg-white border-t border-slate-100 animate-in fade-in duration-200">
              <p className="text-[11px] text-slate-500">
                Provide basic health context to help the AI tailor urgency and supportive care recommendations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Age:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 34"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Gender:
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other / Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Known Allergies:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Peanuts, Sulfa drugs"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Pre-existing Conditions / History:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hypertension, Asthma, Diabetes"
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Describe How You Feel:
          </label>
          <div className="relative">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., I have sharp pain in my lower right abdomen since this morning with mild fever..."
              rows={3}
              className="w-full text-xs rounded-xl border border-slate-200 p-3.5 pr-24 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-50/50 resize-none"
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={() => handleAnalyze()}
              disabled={isLoading || symptoms.trim().length < 3}
              className="absolute right-2.5 bottom-3.5 bg-sky-600 hover:bg-sky-500 text-xs px-3.5 py-1.5 h-auto rounded-lg shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Triaging...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {/* Quick Prompts */}
          {!triageData && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400">
                Or try a common medical scenario:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {samplePrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePromptClick(p)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-300 text-slate-600 hover:text-sky-800 transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Presentation */}
        {triageData && (
          <div className="space-y-5 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Urgency & Summary Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Triage Assessment:</span>
                  {getUrgencyBadge(triageData.analysis.urgencyLevel)}
                </div>
                <span className="text-xs font-medium text-slate-500">
                  Target Specialty:{' '}
                  <strong className="text-slate-900 font-semibold">
                    {triageData.analysis.recommendedSpecialty}
                  </strong>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                {triageData.analysis.summary}
              </p>

              {/* Potential Considerations & Home Advice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Potential Considerations
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {triageData.analysis.potentialConditions?.map((c, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Supportive Care Advice
                  </h4>
                  <p className="text-xs text-slate-600 leading-normal">
                    {triageData.analysis.homeCareAdvice}
                  </p>
                </div>
              </div>
            </div>

            {/* Critical Emergency Banner if Triggered */}
            {triageData.analysis.requiresEmergencySOS && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg emergency-pulse flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Immediate Medical Response Recommended</h4>
                    <p className="text-xs text-red-100">
                      Reported symptoms require urgent clinical/hospital evaluation.
                    </p>
                  </div>
                </div>

                <Link
                  href="/patient/emergency"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-red-700 hover:bg-red-50 text-xs font-bold text-center shadow-sm flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Dispatch Emergency SOS
                </Link>
              </div>
            )}

            {/* Recommended Matching Doctors */}
            {triageData.recommendedDoctors?.length > 0 && !triageData.analysis.requiresEmergencySOS && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-sky-600" />
                    Recommended Nearby Specialists ({triageData.analysis.recommendedSpecialty})
                  </h3>
                  <Link
                    href={`/patient/doctors?specialty=${encodeURIComponent(triageData.analysis.recommendedSpecialty)}`}
                    onClick={onClose}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                  >
                    View All
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {triageData.recommendedDoctors.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-sky-300 transition-all flex flex-col justify-between space-y-2.5 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                            {doc.doctorSpecialties?.[0]?.specialty?.name || 'Specialist'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ~{doc.distanceKm?.toFixed(1)} km away
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1.5">
                          Dr. {doc.user?.firstName} {doc.user?.lastName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">{doc.clinic?.name}</p>
                      </div>

                      <Link
                        href="/patient/doctors"
                        onClick={onClose}
                        className="w-full text-[11px] font-semibold py-1.5 px-2.5 bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white rounded-lg text-center transition-colors flex items-center justify-center gap-1"
                      >
                        Book Slot
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-500 leading-relaxed flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{triageData.analysis.disclaimer}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close Assistant
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={resetForm}
                className="text-xs cursor-pointer"
              >
                Check Another Symptom
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
