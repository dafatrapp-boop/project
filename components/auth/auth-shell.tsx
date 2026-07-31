import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const highlights = [
  'إدارة كل ليدات إعلاناتك في مكان واحد',
  'صفحات هبوط جاهزة خلال دقائق',
  'تقارير أداء لحظية لكل حملة',
];

/**
 * Layout shared by every auth screen (login, signup, reset password...).
 * Two columns on desktop (>=1024px): a brand/value panel (start side in
 * RTL) and the form. Below 1024px the brand panel collapses into a
 * short header so the form — the only thing the user actually needs —
 * stays the first thing they see on a phone, no scrolling required.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-surface-subtle lg:flex-row" dir="rtl">
      {/* Brand panel — hidden content simplified on mobile, full story on desktop */}
      <div className="relative hidden shrink-0 basis-[42%] flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-10 text-white lg:flex xl:basis-[38%]">
        <a href="/" className="text-lg font-semibold tracking-tight">
          SocialSales OS
        </a>
        <div className="max-w-sm">
          <h2 className="mb-6 text-2xl font-semibold leading-snug">
            حوّل تفاعل إعلاناتك إلى مبيعات فعلية
          </h2>
          <ul className="flex flex-col gap-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-white/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} SocialSales OS</p>
        <div
          className="pointer-events-none absolute -bottom-24 -start-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />
      </div>

      {/* Compact mobile header replacing the full brand panel */}
      <div className="flex items-center justify-center border-b border-border bg-surface px-4 py-4 lg:hidden">
        <a href="/" className="text-base font-semibold text-ink">
          SocialSales OS
        </a>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
            <h1 className={cn('text-xl font-semibold text-ink', subtitle ? 'mb-1' : 'mb-6')}>{title}</h1>
            {subtitle && <p className="mb-6 text-sm leading-6 text-ink-muted">{subtitle}</p>}
            {children}
          </div>
          {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
