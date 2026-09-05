import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, ShieldAlert } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive' | 'emergency';
  title?: string;
  icon?: React.ReactNode;
}

export function Alert({
  variant = 'info',
  title,
  icon,
  className,
  children,
  ...props
}: AlertProps) {
  const styles = {
    info: 'bg-sky-50 text-sky-900 border-sky-200 [&>svg]:text-sky-600',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200 [&>svg]:text-emerald-600',
    warning: 'bg-amber-50 text-amber-900 border-amber-200 [&>svg]:text-amber-600',
    destructive: 'bg-rose-50 text-rose-900 border-rose-200 [&>svg]:text-rose-600',
    emergency: 'bg-red-50 text-red-950 border-red-300 [&>svg]:text-red-600 shadow-subtle',
  };

  const defaultIcons = {
    info: <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />,
    destructive: <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />,
    emergency: <ShieldAlert className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600 animate-pulse" />,
  };

  return (
    <div
      role="alert"
      className={cn('relative w-full rounded-xl border p-4 flex gap-3.5', styles[variant], className)}
      {...props}
    >
      {icon || defaultIcons[variant]}
      <div className="flex-1">
        {title && <h5 className="mb-1 font-semibold leading-none tracking-tight">{title}</h5>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}

