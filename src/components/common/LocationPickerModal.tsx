'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { useLocation, PRESET_LOCATIONS } from '@/context/LocationContext';
import { Button } from '../ui/Button';
import { MapPin, Navigation, Check, AlertCircle } from 'lucide-react';

export function LocationPickerModal() {
  const {
    location,
    isLocationModalOpen,
    closeLocationModal,
    requestCurrentLocation,
    setManualLocation,
  } = useLocation();

  return (
    <Modal
      isOpen={isLocationModalOpen}
      onClose={closeLocationModal}
      title="Select Your Healthcare Location"
      description="UCHN finds nearby doctors, clinics, and pharmacies based on your location."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Auto GPS Detection Button */}
        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Automatic GPS Detection</h4>
              <p className="text-xs text-slate-500">Detect your exact coordinates using browser location</p>
            </div>
          </div>

          <Button
            onClick={async () => {
              await requestCurrentLocation();
              closeLocationModal();
            }}
            isLoading={location.isDetecting}
            size="sm"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs"
          >
            Use My Current Location
          </Button>

          {location.error && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{location.error}</span>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Or select a city manually
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {PRESET_LOCATIONS.map((preset) => {
              const isSelected = location.city.includes(preset.city);
              return (
                <button
                  key={preset.city}
                  onClick={() => setManualLocation(preset)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-left text-sm transition-all ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/60 font-medium text-sky-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className={`w-4 h-4 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span>
                      {preset.city}, {preset.state}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

