'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  FileText,
  Pill,
  Send,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Loader2,
  AlertCircle,
  UploadCloud,
  Check,
  X,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { ParsedPrescriptionItem } from '@/server/services/ai.service';

interface AIPrescriptionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedicine?: (medicineName: string) => void;
}

export function AIPrescriptionScannerModal({
  isOpen,
  onClose,
  onSelectMedicine,
}: AIPrescriptionScannerModalProps) {
  const [prescriptionText, setPrescriptionText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResults, setParsedResults] = useState<{
    items: ParsedPrescriptionItem[];
    summary: string;
  } | null>(null);

  const samplePrescriptions = [
    'Rx:\n1. Amoxicillin Trihydrate 500mg - 1 capsule tid x 5 days\n2. Paracetamol 650mg - 1 tab prn for fever\n3. Pantoprazole 40mg - 1 tab od before breakfast',
    'Rx:\n1. Metformin 500mg - 1 tab bd with meals\n2. Atorvastatin 20mg - 1 tab od at bedtime\n3. Cetirizine 10mg - 1 tab at night',
  ];

  const handleParse = async (textToParse?: string) => {
    const text = textToParse || prescriptionText;
    if (!text || text.trim().length < 3) {
      setError('Please paste or enter your prescription text.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/ai/prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionText: text }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to parse prescription');
      }

      setParsedResults(json.data);
    } catch (e: any) {
      setError(e.message || 'Error parsing prescription.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPrescriptionText('');
    setParsedResults(null);
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 pr-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-navy-900 text-white flex items-center justify-center shadow-md">
              <Pill className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-navy-950">
                  AI Prescription Scanner & Pharmacy Matcher
                </h2>
                <Badge variant="success" className="text-[10px]">
                  Live Stock Sync
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Paste or input prescription details to auto-detect drugs and verify live clinic stock.
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Prescription Text or Regimen:
          </label>
          <div className="relative">
            <textarea
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              placeholder="e.g. Rx: Amoxicillin 500mg tid for 5 days, Paracetamol 650mg sos..."
              rows={4}
              className="w-full text-xs font-mono rounded-xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50"
              disabled={isLoading}
            />
          </div>

          {!parsedResults && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400">
                Or try a sample clinical prescription:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrescriptionText(samplePrescriptions[0]);
                    handleParse(samplePrescriptions[0]);
                  }}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 transition-colors"
                >
                  📄 Antibiotic + Anti-pyretic Sample
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrescriptionText(samplePrescriptions[1]);
                    handleParse(samplePrescriptions[1]);
                  }}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 transition-colors"
                >
                  📄 Chronic Care Maintenance Sample
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={() => handleParse()}
              disabled={isLoading || prescriptionText.trim().length < 3}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Extracting Medications...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Scan & Check Stock
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Parsed Output */}
        {parsedResults && (
          <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
              {parsedResults.summary}
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Extracted Medications ({parsedResults.items.length}):
              </h4>

              <div className="space-y-2">
                {parsedResults.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-slate-300"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {item.medicineName}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.dosage}
                        </span>
                        {item.availableInClinic ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            In Stock ({item.stockQuantity} available)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Stock Unavailable Nearby
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500">
                        {item.frequency} • {item.duration} • {item.instructions}
                      </p>

                      {item.clinicName && (
                        <p className="text-[10px] text-slate-400">
                          Available at: <strong>{item.clinicName}</strong> • {formatCurrency(item.unitPrice || 0)} / unit
                        </p>
                      )}
                    </div>

                    {item.availableInClinic && onSelectMedicine && (
                      <Button
                        size="sm"
                        onClick={() => {
                          onSelectMedicine(item.medicineName);
                          onClose();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 h-auto flex-shrink-0"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                        Order Now
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={resetForm} className="text-xs">
                Scan Another Prescription
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
