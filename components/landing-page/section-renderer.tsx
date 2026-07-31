import type { Section } from '@/lib/landing-pages/types';
import { LeadForm } from '@/app/p/[slug]/lead-form';
import { WhatsAppLink } from './whatsapp-link';
import { TestimonialsCarousel, type TestimonialItem } from './testimonials-carousel';
import { AppointmentBookingWidget } from './appointment-booking-widget';

/**
 * Renders one section of a landing page. This component is shared
 * between the editor's live preview and the actual public /p/[slug]
 * page — using one renderer for both guarantees "what you see in the
 * editor is what visitors get," rather than maintaining two versions
 * that can drift apart.
 */
export function SectionRenderer({
  section,
  whatsappNumber,
  landingPageId,
  testimonials,
  preview = false,
}: {
  section: Section;
  whatsappNumber?: string | null;
  /** Required to render a real, submittable form section. */
  landingPageId?: string;
  /** Real, visible testimonials for this workspace — only needed when
   *  a 'testimonials' section is present. Omitted in editor preview,
   *  where a couple of static mock entries are shown instead. */
  testimonials?: TestimonialItem[];
  /** When true (editor preview), the form section renders as static,
   *  non-submitting markup instead of a live form — this keeps
   *  "previewing your page" from silently creating real test leads. */
  preview?: boolean;
}) {
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`
    : undefined;

  switch (section.type) {
    case 'hero':
      return (
        <section className="bg-gradient-to-b from-brand-50 to-surface px-6 py-16 text-center sm:py-24">
          {section.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={section.imageUrl}
              alt=""
              className="mx-auto mb-6 max-h-64 w-auto rounded-lg object-cover shadow-card"
            />
          )}
          <h1 className="mx-auto max-w-2xl text-3xl font-bold text-ink sm:text-4xl">
            {section.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-muted sm:text-lg">
            {section.subheadline}
          </p>
          <WhatsAppLink
            href={whatsappHref ?? '#'}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-brand-500 px-6 text-base font-medium text-white hover:bg-brand-600"
          >
            {section.ctaLabel}
          </WhatsAppLink>
        </section>
      );

    case 'features':
      return (
        <section className="px-6 py-14 sm:py-20">
          <h2 className="mb-8 text-center text-2xl font-semibold text-ink sm:text-3xl">
            {section.title}
          </h2>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {section.items.map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface p-5 text-center">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="mx-auto mb-3 h-32 w-full rounded-md object-cover"
                  />
                )}
                <h3 className="mb-2 text-base font-semibold text-ink">{item.title}</h3>
                <p className="text-sm text-ink-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case 'cta':
      return (
        <section className="bg-brand-600 px-6 py-14 text-center sm:py-20">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{section.headline}</h2>
          <WhatsAppLink
            href={whatsappHref ?? '#'}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-base font-medium text-brand-700 hover:bg-brand-50"
          >
            {section.buttonLabel}
          </WhatsAppLink>
        </section>
      );

    case 'form':
      if (!preview && landingPageId) {
        return (
          <LeadForm
            landingPageId={landingPageId}
            whatsappNumber={whatsappNumber}
            title={section.title}
            description={section.description}
            submitLabel={section.submitLabel}
            whatsappMessageTemplate={section.whatsappMessageTemplate}
          />
        );
      }
      // Editor preview: static, non-submitting stand-in so testing the
      // page layout never creates a real lead in the CRM.
      return (
        <section className="px-6 py-14 sm:py-20">
          <div className="mx-auto max-w-md rounded-lg border border-dashed border-border bg-surface-subtle p-6 text-center">
            <h2 className="mb-1 text-xl font-semibold text-ink">{section.title}</h2>
            <p className="mb-4 text-sm text-ink-muted">{section.description}</p>
            <div className="flex flex-col gap-2 opacity-60">
              <div className="h-11 rounded-md border border-border bg-surface" />
              <div className="h-11 rounded-md border border-border bg-surface" />
              <button disabled className="h-11 rounded-md bg-brand-500 text-sm font-medium text-white">
                {section.submitLabel}
              </button>
            </div>
            <p className="mt-3 text-xs text-ink-faint">معاينة فقط — النموذج الفعلي يعمل في الصفحة المنشورة</p>
          </div>
        </section>
      );

    case 'testimonials': {
      const mockItems: TestimonialItem[] = [
        { id: 'mock-1', customer_name: 'عميل تجريبي', avatar_url: null, subtitle: 'مدينة الرياض', rating: 5, body: 'تجربة رائعة وخدمة سريعة، أنصح الجميع بالتعامل معهم.' },
        { id: 'mock-2', customer_name: 'عميلة تجريبية', avatar_url: null, subtitle: 'جدة', rating: 5, body: 'احترافية عالية في التعامل ونتائج ممتازة.' },
      ];
      return <TestimonialsCarousel title={section.title} items={preview ? mockItems : (testimonials ?? [])} />;
    }

    case 'appointment_booking':
      if (!preview && landingPageId) {
        return (
          <AppointmentBookingWidget
            landingPageId={landingPageId}
            title={section.title}
            description={section.description}
            submitLabel={section.submitLabel}
          />
        );
      }
      // Editor preview: static, non-submitting stand-in — same reasoning
      // as the 'form' section preview above.
      return (
        <section className="px-6 py-14 sm:py-20">
          <div className="mx-auto max-w-md rounded-lg border border-dashed border-border bg-surface-subtle p-6 text-center">
            <h2 className="mb-1 text-xl font-semibold text-ink">{section.title}</h2>
            <p className="mb-4 text-sm text-ink-muted">{section.description}</p>
            <div className="flex flex-col gap-2 opacity-60">
              <div className="h-11 rounded-md border border-border bg-surface" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-9 rounded-md border border-border bg-surface" />
                ))}
              </div>
              <button disabled className="h-11 rounded-md bg-brand-500 text-sm font-medium text-white">
                {section.submitLabel}
              </button>
            </div>
            <p className="mt-3 text-xs text-ink-faint">معاينة فقط — الحجز الفعلي يعمل في الصفحة المنشورة</p>
          </div>
        </section>
      );

    case 'footer':
      return (
        <footer className="border-t border-border px-6 py-8 text-center text-sm text-ink-faint">
          {section.text}
        </footer>
      );
  }
}
