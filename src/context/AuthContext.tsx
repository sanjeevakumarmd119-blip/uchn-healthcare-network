'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession } from '@/types';

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserSession>;
  demoLogin: (role: 'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN') => Promise<UserSession>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data.user) {
          const u = json.data.user;
          const sessionUser: UserSession = {
            userId: u.id,
            email: u.email,
            role: u.role,
            firstName: u.firstName,
            lastName: u.lastName,
            clinicId: u.doctorProfile?.clinicId || u.clinicStaff?.[0]?.clinicId || null,
            patientProfileId: u.patientProfile?.id || null,
            doctorProfileId: u.doctorProfile?.id || null,
          };
          setUser(sessionUser);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<UserSession> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to sign in');
    }

    setUser(data.data.user);
    return data.data.user;
  };

  const demoLogin = async (role: 'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN'): Promise<UserSession> => {
    const credentials = {
      PATIENT: { email: 'patient@uchn.org', password: 'Patient123!' },
      DOCTOR: { email: 'doctor@uchn.org', password: 'Doctor123!' },
      CLINIC_ADMIN: { email: 'admin@uchn.org', password: 'Admin123!' },
    }[role];

    return login(credentials.email, credentials.password);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, demoLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

