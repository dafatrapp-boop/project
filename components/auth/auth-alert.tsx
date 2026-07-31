import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'danger' | 'success' | 'info';

const toneConfig: Record<Tone, { icon: typeof Info; className: string }> = {
  danger: { icon: AlertTriangle, className: 'border-danger/20 bg-danger-50 text-danger' },
  success: { icon: CheckCircle2, className: 'border-success/20 bg-success-50 text-success' },
  info: { icon: Info, className: 'border-brand-500/20 bg-brand-50 text-brand-700' },
};

export function AuthAlert({ tone = 'danger', children }: { tone?: Tone; children: React.ReactNode }) {
  const { icon: Icon, className } = toneConfig[tone];
  return (
    <div
      role="status"
      className={cn(
        'mb-5 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed animate-rise-in',
        className
      )}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
