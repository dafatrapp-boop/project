'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<{
  show: (message: string, tone?: ToastTone) => void;
} | null>(null);

const toneConfig: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-success/25 text-success' },
  error: { icon: XCircle, className: 'border-danger/25 text-danger' },
  info: { icon: Info, className: 'border-border text-ink' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Fixed to the "end" side so it never collides with RTL content */}
      <div className="pointer-events-none fixed bottom-4 end-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => {
          const { icon: Icon, className } = toneConfig[toast.tone];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'animate-rise-in pointer-events-auto flex items-center gap-2.5 rounded-lg border bg-surface-overlay px-4 py-3.5 text-body-sm shadow-overlay',
                className
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="text-ink">{toast.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                aria-label="إغلاق الإشعار"
                className="ms-2 shrink-0 text-ink-faint transition-colors hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
