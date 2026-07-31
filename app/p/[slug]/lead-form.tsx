'use client';

import { Suspense, useState, useTransition, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { submitLeadFormAction } from './actions';
import { trackPixelEvent } from '@/lib/meta-pixel/client';

interface FormSectionProps {
  landingPageId: string;
  whatsappNumber?: string | null;
  title: string;
  description: string;
  submitLabel: string;
  whatsappMessageTemplate: string;
}

/**
 * Public export wraps the actual form in Suspense because it reads
 * useSearchParams() (for UTM passthrough) — required so this section
 * doesn't force the whole page to de-opt to client-only rendering.
 * (Flagged as a gap in Phase 4/7 checklist notes; fixed here in Phase 9.)
 */
export function LeadForm(props: FormSectionProps) {
  return (
    <Suspense fallback={<FormSkeleton title={props.title} description={props.description} />}>
      <LeadFormInner {...props} />
    </Suspense>
  );
}

function FormSkeleton({ title, description }: { title: string; description: string }) {
  return (
    <section className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6 shadow-card">
        <h2 className="mb-1 text-xl font-semibold text-ink">{title}</h2>
        <p className="mb-5 text-sm text-ink-muted">{description}</p>
        <div className="flex flex-col gap-3">
          <div className="h-11 animate-pulse rounded-md bg-surface-subtle" />
          <div className="h-11 animate-pulse rounded-md bg-surface-subtle" />
          <div className="h-11 animate-pulse rounded-md bg-surface-subtle" />
        </div>
      </div>
    </section>
  );
}

function LeadFormInner({
  landingPageId,
  whatsappNumber,
  title,
  description,
  submitLabel,
  whatsappMessageTemplate,
}: FormSectionProps) {
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ERROR_MESSAGES: Record<string, string> = {
    missing_fields: 'يرجى إدخال الاسم ورقم الهاتف أو البريد الإلكتروني.',
    rate_limited: 'تم إرسال عدة طلبات، يرجى المحاولة لاحقًا.',
    submit_failed: 'تعذر إرسال الطلب. حاول مرة أخرى.',
    rejected: 'تعذر إرسال الطلب.',
  };

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get('fullName') ?? '');

    formData.set('utm_source', searchParams.get('utm_source') ?? '');
    formData.set('utm_medium', searchParams.get('utm_medium') ?? '');
    formData.set('utm_campaign', searchParams.get('utm_campaign') ?? '');

    startTransition(async () => {
      const result = await submitLeadFormAction(landingPageId, formData);
      if (!result.ok) {
        setError(ERROR_MESSAGES[result.error ?? 'submit_failed']);
        return;
      }

      trackPixelEvent('Lead');

      if (whatsappNumber) {
        const message = whatsappMessageTemplate.replace('{name}', fullName);
        const waUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.location.href = waUrl;
      } else {
        // No WhatsApp number configured for this page — just confirm.
        setError(null);
        e.currentTarget?.reset();
      }
    });
  }

  return (
    <section className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6 shadow-card">
        <h2 className="mb-1 text-xl font-semibold text-ink">{title}</h2>
        <p className="mb-5 text-sm text-ink-muted">{description}</p>

        {error && (
          <div className="mb-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Honeypot — hidden from real users via CSS, bots often fill every field */}
          <input
            type="text"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute -left-[9999px]"
            aria-hidden="true"
          />
          <input
            name="fullName"
            required
            placeholder="الاسم الكامل"
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:border-brand-500"
          />
          <input
            name="phone"
            placeholder="رقم الهاتف"
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:border-brand-500"
          />
          <input
            name="email"
            type="email"
            placeholder="البريد الإلكتروني (اختياري)"
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:border-brand-500"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-1 h-11 rounded-md bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? 'جارٍ الإرسال...' : submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}
