'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useRouter } from 'next/navigation';
import {
  Search,
  Pill,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  ShoppingBag,
  Truck,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { BackButton } from '@/components/common/BackButton';
import { formatCurrency } from '@/lib/utils';
import { Medicine } from '@/types';
import { AIPrescriptionScannerModal } from '@/components/ai/AIPrescriptionScannerModal';

export default function PatientMedicinesPage() {
  const { user } = useAuth();
  const { location } = useLocation();
  const router = useRouter();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAIScannerOpen, setIsAIScannerOpen] = useState(false);

  // Request Medicine Modal
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState<'PICKUP' | 'HOME_DELIVERY'>('PICKUP');
  const [notes, setNotes] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, [selectedCategory, location.latitude, location.longitude]);

  const fetchMedicines = async (overrideSearch?: string) => {
    try {
      setIsLoading(true);
      const query = overrideSearch !== undefined ? overrideSearch : searchQuery;
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (query.trim()) params.append('search', query.trim());
      if (location.latitude && location.longitude) {
        params.append('lat', location.latitude.toString());
        params.append('lng', location.longitude.toString());
      }

      const res = await fetch(`/api/medicines?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMedicines(json.data.medicines || []);
          if (json.data.categories) setCategories(json.data.categories);
        }
      }
    } catch (e) {
      console.error('Failed to fetch medicines', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMedicines();
  };

  const openRequestModal = (med: Medicine) => {
    if (!user) {
      router.push('/login?redirect=/patient/medicines');
      return;
    }

    const availableClinic = med.clinics?.find((c) => c.quantity > 0);

    setSelectedMedicine(med);
    setSelectedClinicId(availableClinic?.clinicId || med.clinics?.[0]?.clinicId || '');
    setQuantity(1);
    setDeliveryOption('PICKUP');
    setNotes('');
    setRequestError(null);
    setRequestSuccess(false);
    setIsRequestModalOpen(true);
  };

  const handleAIMedicineSelect = (medName: string) => {
    setSearchQuery(medName);
    fetchMedicines(medName);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine || !selectedClinicId) return;

    setIsSubmitting(true);
    setRequestError(null);

    try {
      const res = await fetch('/api/medicines/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: selectedMedicine.id,
          clinicId: selectedClinicId,
          quantity: Number(quantity),
          deliveryOption,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to place medicine request');
      }

      setRequestSuccess(true);
      fetchMedicines();
    } catch (err: any) {
      setRequestError(err.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClinicStock = selectedMedicine?.clinics?.find(
    (c) => c.clinicId === selectedClinicId
  );

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-8 space-y-4 sm:space-y-6">
      <BackButton fallbackUrl="/patient" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950 tracking-tight">
            Pharmacy Medicine Reservation & Discovery
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search real-time clinical pharmacy inventory and place a pharmacy medicine reservation for pickup or home delivery.
          </p>
        </div>

        <Button
          onClick={() => setIsAIScannerOpen(true)}
          className="self-start sm:self-auto bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center gap-2 flex-shrink-0 h-9 tap-bounce"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>AI Prescription Scanner</span>
        </Button>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search medicine name, generic formula (e.g. Paracetamol)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <Button type="submit" size="md" className="h-10 px-4 text-xs font-semibold tap-bounce">
            Search
          </Button>
        </form>

        {/* Category Filter Chips with smooth touch scrolling */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all tap-bounce cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-navy-900 text-white shadow-subtle'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all tap-bounce cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-navy-900 text-white shadow-subtle'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Medicine Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : medicines.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No medicines found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search term or category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {medicines.map((med) => {
            const hasStock = (med.totalStock || 0) > 0;
            return (
              <Card
                key={med.id}
                className="flex flex-col justify-between border border-slate-200/90 rounded-2xl shadow-card hover:shadow-elevated transition-all tap-bounce"
              >
                <CardContent className="p-4 sm:p-6 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        {med.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-tight">
                        {med.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {med.genericName} • {med.strength}
                      </p>
                    </div>

                    <Badge variant={hasStock ? 'success' : 'destructive'}>
                      {hasStock ? `${med.totalStock} in Stock` : 'Out of Stock'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {med.description || 'Clinically verified pharmacy formulation.'}
                  </p>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Dosage Form:</span>
                      <span className="font-semibold text-slate-700">{med.dosageForm}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Est. Price / unit:</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(med.clinics?.[0]?.unitPrice || 0)}
                      </span>
                    </div>
                  </div>

                  {med.clinics && med.clinics.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] space-y-1">
                      <span className="font-bold text-slate-600 block">
                        Availability Nearby:
                      </span>
                      {med.clinics.slice(0, 2).map((c) => (
                        <div
                          key={c.clinicId}
                          className="flex items-center justify-between text-slate-600"
                        >
                          <span className="truncate max-w-[140px]">{c.clinicName}</span>
                          <span
                            className={
                              c.quantity > 0
                                ? 'font-bold text-emerald-700'
                                : 'text-slate-400'
                            }
                          >
                            {c.quantity > 0 ? `${c.quantity} units` : '0 units'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={() => openRequestModal(med)}
                    disabled={!hasStock}
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                    {hasStock ? 'Request / Reserve' : 'Out of Stock'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Prescription Scanner Modal */}
      <AIPrescriptionScannerModal
        isOpen={isAIScannerOpen}
        onClose={() => setIsAIScannerOpen(false)}
        onSelectMedicine={handleAIMedicineSelect}
      />

      {/* Request Modal */}
      {selectedMedicine && (
        <Modal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          title={`Reserve Medicine: ${selectedMedicine.name}`}
          maxWidth="md"
        >
          {requestSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Medicine Request Confirmed!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your reservation for {quantity} unit(s) of {selectedMedicine.name} has been placed.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsRequestModalOpen(false)}
                className="bg-navy-900"
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              {requestError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {requestError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Clinic Pharmacy:
                </label>
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {selectedMedicine.clinics?.map((c) => (
                    <option
                      key={c.clinicId}
                      value={c.clinicId}
                      disabled={c.quantity === 0}
                    >
                      {c.clinicName} — {c.quantity > 0 ? `${c.quantity} in stock` : 'Out of stock'} ({formatCurrency(c.unitPrice)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantity (Units):
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedClinicStock?.quantity || 10}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Fulfillment Mode:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryOption('PICKUP')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                      deliveryOption === 'PICKUP'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Pharmacy Pickup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryOption('HOME_DELIVERY')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                      deliveryOption === 'HOME_DELIVERY'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Home Delivery</span>
                  </button>
                </div>
              </div>

              <div>
                <Input
                  label="Prescription Note / Special Instructions (Optional)"
                  placeholder="Doctor's prescription reference or dosage notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRequestModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={!selectedClinicStock || selectedClinicStock.quantity === 0}
                  isLoading={isSubmitting}
                >
                  Submit Medicine Request
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}