'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-elevated border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col',
          'relative w-full bg-white rounded-t-[28px] sm:rounded-2xl shadow-elevated border-t sm:border border-slate-200 overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0',
          maxWidths[maxWidth]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Native Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {(title || description) && (
          <div className="flex items-center justify-between p-6 pr-12 border-b border-slate-100">
          <div className="flex items-center justify-between p-4 sm:p-6 pr-10 sm:pr-12 border-b border-slate-100 flex-shrink-0">
            <div>
              {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
              {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
              {title && <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{title}</h2>}
              {description && <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto">{children}</div>
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1">{children}</div>
      </div>
    </div>
  );
}

