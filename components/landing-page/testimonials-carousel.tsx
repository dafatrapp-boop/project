'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export interface TestimonialItem {
  id: string;
  customer_name: string;
  avatar_url: string | null;
  subtitle: string | null;
  rating: number;
  body: string;
}

/**
 * A single modern slider (not a grid of random cards, not a long
 * list) — one testimonial at a time, small dot navigation, matches
 * the rest of the section styling (rounded-lg, shadow-card, brand
 * accent) so it doesn't look bolted onto the page.
 */
export function TestimonialsCarousel({ title, items }: { title: string; items: TestimonialItem[] }) {
  const [index, setIndex] = useState(0);

  if (items.length === 0) return null;

  const item = items[index];

  function go(direction: -1 | 1) {
    setIndex((i) => (i + direction + items.length) % items.length);
  }

  return (
    <section className="px-6 py-14 sm:py-20">
      <h2 className="mb-8 text-center text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>

      <div className="relative mx-auto max-w-xl">
        <div className="rounded-lg border border-border bg-surface p-6 text-center shadow-card sm:p-8">
          {item.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.avatar_url}
              alt=""
              className="mx-auto mb-4 h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-600">
              {item.customer_name.charAt(0)}
            </div>
          )}

          <div className="mb-3 flex items-center justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={16}
                className={n <= item.rating ? 'fill-warning text-warning' : 'text-border'}
              />
            ))}
          </div>

          <p className="mx-auto max-w-md text-base text-ink-muted">&quot;{item.body}&quot;</p>

          <p className="mt-4 text-sm font-semibold text-ink">{item.customer_name}</p>
          {item.subtitle && <p className="text-xs text-ink-faint">{item.subtitle}</p>}
        </div>

        {items.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="السابق"
              className="absolute start-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border border-border bg-surface p-2 shadow-subtle hover:bg-surface-subtle rtl:translate-x-1/2"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="التالي"
              className="absolute end-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full border border-border bg-surface p-2 shadow-subtle hover:bg-surface-subtle rtl:-translate-x-1/2"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="mt-5 flex items-center justify-center gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`الشهادة ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-5 bg-brand-500' : 'w-1.5 bg-border'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
