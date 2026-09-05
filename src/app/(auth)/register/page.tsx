'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Activity, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN'>('PATIENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Patient Fields
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [gender, setGender] = useState('OTHER');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Doctor Fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [consultationFee, setConsultationFee] = useState('60');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        role,
        firstName,
        lastName,
        email,
        password,
        phone,
      };

      if (role === 'PATIENT') {
        payload.bloodGroup = bloodGroup;
        payload.gender = gender;
        payload.emergencyContactName = emergencyContactName || undefined;
        payload.emergencyContactPhone = emergencyContactPhone || undefined;
      } else if (role === 'DOCTOR') {
        payload.licenseNumber = licenseNumber || `MD-${Math.floor(10000 + Math.random() * 90000)}`;
        payload.consultationFee = parseFloat(consultationFee) || 50;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Registration failed');
      }

      await refreshUser();

      if (role === 'PATIENT') {
        router.push('/patient');
      } else {
        router.push('/doctor');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-navy-800 text-white items-center justify-center shadow-subtle mb-3">
            <Activity className="w-6 h-6 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-navy-950">Create your UCHN Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Join the Unified Care & Health Network
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registration</CardTitle>
            <CardDescription>Select your healthcare role and complete details</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Role Selection Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setRole('PATIENT')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  role === 'PATIENT' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => setRole('DOCTOR')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  role === 'DOCTOR' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => setRole('CLINIC_ADMIN')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  role === 'CLINIC_ADMIN' ? 'bg-white text-amber-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Clinic Admin
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  placeholder="e.g. John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Last Name"
                  required
                  placeholder="e.g. Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password (min 8 chars, 1 uppercase, 1 number)"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              {/* Role specific inputs */}
              {role === 'PATIENT' && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Patient Profile Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Blood Group"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      options={[
                        { value: 'A+', label: 'A+' },
                        { value: 'A-', label: 'A-' },
                        { value: 'B+', label: 'B+' },
                        { value: 'B-', label: 'B-' },
                        { value: 'O+', label: 'O+' },
                        { value: 'O-', label: 'O-' },
                        { value: 'AB+', label: 'AB+' },
                        { value: 'AB-', label: 'AB-' },
                      ]}
                    />
                    <Select
                      label="Gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      options={[
                        { value: 'MALE', label: 'Male' },
                        { value: 'FEMALE', label: 'Female' },
                        { value: 'OTHER', label: 'Other' },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Emergency Contact"
                      placeholder="Contact Name"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                    />
                    <Input
                      label="Emergency Phone"
                      placeholder="+1 555-..."
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {role === 'DOCTOR' && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Medical Practitioner Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Medical License #"
                      placeholder="e.g. MD-CA-98214"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                    />
                    <Input
                      label="Consultation Fee ($)"
                      type="number"
                      placeholder="60"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
                Complete Registration
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 py-4 bg-slate-50/50 rounded-b-xl">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-800">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

