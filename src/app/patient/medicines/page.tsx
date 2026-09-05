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
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { Medicine } from '@/types';

export default function PatientMedicinesPage() {
  const { user } = useAuth();
  const { location } = useLocation();
  const router = useRouter();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchMedicines = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
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

    // Pick first clinic with available stock by default
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

  const handleRequestSubmit = async (e: React.FormEvent) => {
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
      fetchMedicines(); // Refresh stock counts
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
          Medicine Stock Discovery & Reservation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Search real-time clinical pharmacy inventory and request medicine pickup or home delivery.
        </p>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search by brand name, generic formula (e.g., Amoxicillin), or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <Button type="submit" size="md">
            Search
          </Button>
        </form>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-subtle'
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
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs text-slate-500 mt-3">Searching live pharmacy inventories...</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No medicines found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try searching for a different generic name or category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((med) => {
            const hasStock = (med.totalStock || 0) > 0;
            return (
              <Card
                key={med.id}
                className="p-5 border border-slate-200 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {med.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                        {med.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Generic: {med.genericName} • {med.strength}
                      </p>
                    </div>

                    <Badge
                      variant={hasStock ? 'success' : 'destructive'}
                      className="text-[10px]"
                    >
                      {hasStock ? 'IN STOCK' : 'OUT OF STOCK'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {med.description}
                  </p>

                  {/* Clinics Stock Breakdown */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-700 block">
                      Pharmacy Availability:
                    </span>
                    {med.clinics?.slice(0, 2).map((c) => (
                      <div
                        key={c.clinicId}
                        className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg"
                      >
                        <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{c.clinicName}</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          {c.distanceKm !== null && (
                            <span className="text-[10px] text-slate-400">{c.distanceKm}km</span>
                          )}
                          <span
                            className={
                              c.quantity > 0
                                ? 'text-emerald-700 font-bold'
                                : 'text-rose-600 font-bold'
                            }
                          >
                            {c.quantity > 0 ? `${c.quantity} available` : 'Out'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Button
                    onClick={() => openRequestModal(med)}
                    disabled={!hasStock}
                    variant={hasStock ? 'primary' : 'outline'}
                    className={`w-full text-xs font-semibold ${
                      hasStock ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                    }`}
                    size="sm"
                  >
                    {hasStock ? 'Request / Reserve Medicine' : 'Out of Stock'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Medicine Modal */}
      {selectedMedicine && (
        <Modal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          title={`Request ${selectedMedicine.name}`}
          description={`Generic: ${selectedMedicine.genericName} • ${selectedMedicine.strength}`}
          maxWidth="md"
        >
          {requestSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Request Placed Successfully</h4>
              <p className="text-xs text-slate-500">
                The pharmacy has received your reservation. You will be notified when your medicine is packed and ready.
              </p>
              <Button
                onClick={() => setIsRequestModalOpen(false)}
                className="w-full text-xs mt-2"
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {requestError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{requestError}</span>
                </div>
              )}

              {/* Select Pharmacy Clinic */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Dispensing Pharmacy
                </label>
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {selectedMedicine.clinics?.map((c) => (
                    <option
                      key={c.clinicId}
                      value={c.clinicId}
                      disabled={c.quantity === 0}
                    >
                      {c.clinicName} — {c.quantity > 0 ? `${c.quantity} in stock ($${c.unitPrice})` : 'Out of Stock'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <Input
                  label="Quantity (Packs / Units)"
                  type="number"
                  min={1}
                  max={selectedClinicStock?.quantity || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  helperText={
                    selectedClinicStock
                      ? `Max available at this pharmacy: ${selectedClinicStock.quantity} units`
                      : ''
                  }
                />
              </div>

              {/* Delivery / Pickup Option */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Fulfillment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryOption('PICKUP')}
                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      deliveryOption === 'PICKUP'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <span>Pharmacy Pickup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryOption('HOME_DELIVERY')}
                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      deliveryOption === 'HOME_DELIVERY'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Home Delivery</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
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

