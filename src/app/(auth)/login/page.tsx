'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Activity, Mail, Lock, User, Stethoscope, Hospital, AlertCircle, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      if (redirectPath) {
        router.push(redirectPath);
      } else if (user.role === 'PATIENT') {
        router.push('/patient');
      } else {
        router.push('/doctor');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN') => {
    setDemoLoading(role);
    setError(null);
    try {
      const user = await demoLogin(role);
      if (user.role === 'PATIENT') {
        router.push('/patient');
      } else {
        router.push('/doctor');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your verified credentials to continue</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-sky-600 hover:text-sky-800 font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        {/* 1-Click Quick Demo Login Section */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <span className="block text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Or Instant 1-Click Demo Login
          </span>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={demoLoading === 'PATIENT'}
              onClick={() => handleQuickDemo('PATIENT')}
              className="flex flex-col h-auto py-2 text-xs"
            >
              <User className="w-4 h-4 text-sky-600 mb-1" />
              <span>Patient</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={demoLoading === 'DOCTOR'}
              onClick={() => handleQuickDemo('DOCTOR')}
              className="flex flex-col h-auto py-2 text-xs"
            >
              <Stethoscope className="w-4 h-4 text-emerald-600 mb-1" />
              <span>Doctor</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={demoLoading === 'CLINIC_ADMIN'}
              onClick={() => handleQuickDemo('CLINIC_ADMIN')}
              className="flex flex-col h-auto py-2 text-xs"
            >
              <Hospital className="w-4 h-4 text-amber-600 mb-1" />
              <span>Clinic Admin</span>
            </Button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-center border-t border-slate-100 py-4 bg-slate-50/50 rounded-b-xl">
        <p className="text-xs text-slate-500">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-sky-600 hover:text-sky-800">
            Register here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-navy-800 text-white items-center justify-center shadow-subtle mb-3">
            <Activity className="w-6 h-6 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-navy-950">Welcome back to UCHN</h1>
          <p className="text-xs text-slate-500 mt-1">
            Unified Care & Health Network Authentication
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-card">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

