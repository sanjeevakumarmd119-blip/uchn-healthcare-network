'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useRouter } from 'next/navigation';
import {
  Search,
  Stethoscope,
  Star,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { BackButton } from '@/components/common/BackButton';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { Doctor, Specialty, AppointmentSlot, Appointment } from '@/types';

export default function PatientDoctorsPage() {
  const { user } = useAuth();
  const { location } = useLocation();
  const router = useRouter();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Booking Modal States
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorSlots, setDoctorSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Confirmed Receipt Modal
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchSpecialties();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty, location.latitude, location.longitude]);

  const fetchSpecialties = async () => {
    try {
      const res = await fetch('/api/specialties');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setSpecialties(json.data.specialties || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedSpecialty !== 'ALL') params.append('specialtyId', selectedSpecialty);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (location.latitude && location.longitude) {
        params.append('lat', location.latitude.toString());
        params.append('lng', location.longitude.toString());
      }

      const res = await fetch(`/api/doctors?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setDoctors(json.data.doctors || []);
      }
    } catch (e) {
      console.error('Failed to fetch doctors', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors();
  };

  const openBookingModal = async (doctor: Doctor) => {
    if (!user) {
      router.push('/login?redirect=/patient/doctors');
      return;
    }

    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setReason('');
    setNotes('');
    setBookingError(null);
    setIsBookingModalOpen(true);

    await fetchSlotsForDoctor(doctor.id, selectedDate);
  };

  const fetchSlotsForDoctor = async (doctorId: string, dateStr: string) => {
    try {
      const res = await fetch(`/api/doctors/${doctorId}/slots?date=${dateStr}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setDoctorSlots(json.data.slots || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDateChange = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    if (selectedDoctor) {
      await fetchSlotsForDoctor(selectedDoctor.id, dateStr);
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedSlot) return;

    setIsBookingSubmitting(true);
    setBookingError(null);

    try {
      const payload = {
        slotId: selectedSlot.id,
        doctorId: selectedDoctor.id,
        clinicId: selectedDoctor.clinicId,
        appointmentDate: selectedDate,
        startTime: formatTime(selectedSlot.startTime),
        endTime: formatTime(selectedSlot.endTime),
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Booking failed. Slot may no longer be available.');
      }

      setIsBookingModalOpen(false);
      setConfirmedAppointment(json.data.appointment);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment');
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-8 space-y-4 sm:space-y-6">
      <BackButton fallbackUrl="/patient" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950 tracking-tight">
          Find Doctors & Book Doctor Consultation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Search verified medical practitioners and book lock-protected doctor consultation slots.
        </p>
      </div>

      {/* Search & Specialty Filter */}
      <div className="space-y-4">
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search by doctor name, condition, or clinic..."
              placeholder="Search doctor, specialty, or clinic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <Button type="submit" size="md">
          <Button type="submit" size="md" className="h-10 px-4 text-xs font-semibold">
            Search
          </Button>
        </form>

        {/* Specialty Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {/* Specialty Filter Chips with smooth touch scrolling */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedSpecialty('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all tap-bounce ${
              selectedSpecialty === 'ALL'
                ? 'bg-navy-900 text-white shadow-subtle'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Specialties
          </button>
          {specialties.map((spec) => (
            <button
              key={spec.id}
              onClick={() => setSelectedSpecialty(spec.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all tap-bounce ${
                selectedSpecialty === spec.id
                  ? 'bg-sky-600 text-white shadow-subtle'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {spec.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Listings */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
          <p className="text-xs text-slate-500 mt-3">Locating nearby medical practitioners...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No doctors found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or switching specialty filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {doctors.map((doctor) => (
            <Card
              key={doctor.id}
              className="p-6 border border-slate-200 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
              className="p-4 sm:p-6 border border-slate-200/90 rounded-2xl shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        Dr. {doctor.user.firstName} {doctor.user.lastName}
                      </h3>
                      <span title="Verified Practitioner">
                        <ShieldCheck className="w-4 h-4 text-sky-600" />
                      </span>
                    </div>
                    <p className="text-xs font-medium text-sky-700 mt-0.5">
                      {doctor.doctorSpecialties.map((s) => s.specialty.name).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 text-xs font-bold text-amber-800">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{doctor.rating.toFixed(1)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {doctor.bio}
                </p>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[180px]">
                      {doctor.clinic?.name}
                    </span>
                    {doctor.distanceKm !== undefined && doctor.distanceKm !== null && (
                      <span className="font-semibold text-sky-700">
                        ({doctor.distanceKm} km away)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    <span>{formatCurrency(doctor.consultationFee)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">/ visit</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Button
                  onClick={() => openBookingModal(doctor)}
                  className="w-full text-xs font-semibold"
                  size="sm"
                >
                  Book Appointment
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Interactive Slot Booking Modal */}
      {selectedDoctor && (
        <Modal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          title={`Book Doctor Consultation with Dr. ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}`}
          description={`${selectedDoctor.clinic?.name} • ${formatCurrency(selectedDoctor.consultationFee)} consultation fee`}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            {bookingError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Date Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Select Consultation Date
              </label>
              <Input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>

            {/* Slots Grid */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Available Appointment Slots
              </label>

              {doctorSlots.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  No open slots available on this date. Please pick another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {doctorSlots.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <button
                        type="button"
                        key={slot.id}
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
                          isSelected
                            ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                            : slot.isBooked
                            ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-sky-400 hover:bg-sky-50'
                        }`}
                      >
                        <Clock className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        <span>{formatTime(slot.startTime)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <Input
                label="Reason for Consultation"
                required
                placeholder="e.g. Annual blood pressure review, persistent cough, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <Input
                label="Additional Symptoms / Notes (Optional)"
                placeholder="Any relevant history or medications you currently take"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBookingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!selectedSlot || !reason.trim()}
                isLoading={isBookingSubmitting}
              >
                Confirm Booking
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmed Appointment Receipt Modal */}
      {confirmedAppointment && (
        <Modal
          isOpen={!!confirmedAppointment}
          onClose={() => setConfirmedAppointment(null)}
          title="Appointment Confirmed"
          description="Your consultation slot has been locked successfully."
          maxWidth="md"
        >
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2 text-left">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-emerald-200">
                <span className="text-slate-500">Appointment ID:</span>
                <span className="font-mono font-bold text-slate-900">
                  {confirmedAppointment.appointmentNumber}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-semibold text-slate-900">
                  Dr. {confirmedAppointment.doctor?.user?.firstName} {confirmedAppointment.doctor?.user?.lastName}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Clinic:</span>
                <span className="font-semibold text-slate-900">
                  {confirmedAppointment.clinic?.name}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-semibold text-sky-800">
                  {formatDate(confirmedAppointment.appointmentDate)} at {confirmedAppointment.startTime}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              A reminder notification has been dispatched. Please arrive 10 minutes before your scheduled consultation.
            </p>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => {
                  setConfirmedAppointment(null);
                  router.push('/patient/appointments');
                }}
              >
                View My Appointments
              </Button>
              <Button
                className="w-full text-xs"
                onClick={() => setConfirmedAppointment(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
