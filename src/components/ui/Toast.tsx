'use client';

import React from 'react';
import { useSocket } from '@/context/SocketContext';
import { X, AlertCircle, CheckCircle2, ShieldAlert, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-elevated bg-white transition-all transform translate-y-0 animate-in slide-in-from-bottom-5',
            toast.type === 'emergency' && 'border-red-400 bg-red-50/95 text-red-950 emergency-pulse',
            toast.type === 'warning' && 'border-amber-300 bg-amber-50 text-amber-950',
            toast.type === 'success' && 'border-emerald-300 bg-emerald-50 text-emerald-950',
            toast.type === 'info' && 'border-sky-300 bg-sky-50 text-sky-950'
          )}
        >
          {toast.type === 'emergency' && <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 animate-pulse" />}
          {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
          {toast.type === 'info' && <Bell className="w-5 h-5 text-sky-600 flex-shrink-0" />}

          <div className="flex-1 text-sm">
            <h5 className="font-semibold">{toast.title}</h5>
            <p className="mt-0.5 opacity-90 leading-relaxed text-xs">{toast.message}</p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

