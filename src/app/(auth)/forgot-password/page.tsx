'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Activity, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit request');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-navy-800 text-white items-center justify-center shadow-subtle mb-3">
            <Activity className="w-6 h-6 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-navy-950">Password Recovery</h1>
          <p className="text-xs text-slate-500 mt-1">
            UCHN Account Security
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter the email address associated with your healthcare account
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-slate-900">
                  Recovery Email Dispatched
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  If an account exists for <strong className="text-slate-700">{email}</strong>, you will receive password reset instructions.
                </p>
                <div className="pt-4">
                  <Link href="/login">
                    <Button variant="outline" className="w-full text-xs">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                />

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Send Reset Link
                </Button>
              </form>
            )}
          </CardContent>

          {!isSubmitted && (
            <CardFooter className="justify-center border-t border-slate-100 py-4 bg-slate-50/50 rounded-b-xl">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

