'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LocationState {
  latitude: number;
  longitude: number;
  city: string;
  isPermissionGranted: boolean;
  isDetecting: boolean;
  error?: string | null;
}

export interface PresetLocation {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export const PRESET_LOCATIONS: PresetLocation[] = [
  { city: 'San Francisco', state: 'CA', latitude: 37.7749, longitude: -122.4194 },
  { city: 'Oakland', state: 'CA', latitude: 37.8044, longitude: -122.2712 },
  { city: 'San Jose', state: 'CA', latitude: 37.3382, longitude: -121.8863 },
  { city: 'Berkeley', state: 'CA', latitude: 37.8715, longitude: -122.2730 },
  { city: 'Palo Alto', state: 'CA', latitude: 37.4419, longitude: -122.1430 },
];

interface LocationContextType {
  location: LocationState;
  requestCurrentLocation: () => Promise<void>;
  setManualLocation: (loc: PresetLocation | { city: string; latitude: number; longitude: number }) => void;
  isLocationModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationState>({
    latitude: 37.7749,
    longitude: -122.4194,
    city: 'San Francisco, CA',
    isPermissionGranted: false,
    isDetecting: false,
    error: null,
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    // Load cached location if available
    try {
      const saved = localStorage.getItem('uchn_user_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        setLocation((prev) => ({ ...prev, ...parsed }));
      } else {
        // Automatically attempt detection on first load
        requestCurrentLocation();
      }
    } catch {
      requestCurrentLocation();
    }
  }, []);

  const requestCurrentLocation = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
        isDetecting: false,
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, isDetecting: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc: LocationState = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          city: 'Current Location (GPS)',
          isPermissionGranted: true,
          isDetecting: false,
          error: null,
        };
        setLocation(newLoc);
        try {
          localStorage.setItem('uchn_user_location', JSON.stringify(newLoc));
        } catch {}
      },
      (err) => {
        console.warn('Geolocation access not granted:', err.message);
        setLocation((prev) => ({
          ...prev,
          isPermissionGranted: false,
          isDetecting: false,
          error: 'Location permission was denied. You can manually select your location.',
        }));
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const setManualLocation = (loc: PresetLocation | { city: string; latitude: number; longitude: number }) => {
    const formattedCity = 'state' in loc ? `${loc.city}, ${loc.state}` : loc.city;
    const newLoc: LocationState = {
      latitude: loc.latitude,
      longitude: loc.longitude,
      city: formattedCity,
      isPermissionGranted: false,
      isDetecting: false,
      error: null,
    };
    setLocation(newLoc);
    try {
      localStorage.setItem('uchn_user_location', JSON.stringify(newLoc));
    } catch {}
    setIsLocationModalOpen(false);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        requestCurrentLocation,
        setManualLocation,
        isLocationModalOpen,
        openLocationModal: () => setIsLocationModalOpen(true),
        closeLocationModal: () => setIsLocationModalOpen(false),
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

