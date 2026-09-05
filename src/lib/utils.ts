import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  // If it's HH:mm format
  if (timeStr.includes(':') && timeStr.length <= 5) {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  }
  // Otherwise parse as Date
  try {
    const d = new Date(timeStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return timeStr;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function getStatusColor(status: string): { bg: string; text: string; border: string } {
  switch (status.toUpperCase()) {
    case 'CONFIRMED':
    case 'IN_STOCK':
    case 'COMPLETED':
    case 'RESOLVED':
    case 'ACTIVE':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'WAITING':
    case 'CHECKED_IN':
    case 'IN_PROGRESS':
    case 'ASSIGNED':
    case 'PENDING':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'LOW_STOCK':
    case 'URGENT':
    case 'HELD':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'AMBULANCE_DISPATCHED':
    case 'CRITICAL':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' };
    case 'OUT_OF_STOCK':
    case 'EXPIRED':
    case 'CANCELLED':
    case 'NO_SHOW':
    case 'SUSPENDED':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

