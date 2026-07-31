'use client';

import { useState, useTransition } from 'react';
import { X, Lightbulb, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dismissGuideAction } from '@/lib/guide/actions';
import type { GuideStep } from '@/lib/guide/content';

/**
 * A small, non-blocking guide card shown at the top of a page the
 * first time a merchant visits it — never a big modal popup. Reuses
 * the same visual language as the rest of the design system (border,
 * surface, shadow-subtle) instead of a separate "tour" library.
 */
export function PageGuide({
  guideKey,
  title,
  steps,
  initiallyDismissed,
}: {
  guideKey: string;
  title: string;
  steps: GuideStep[];
  initiallyDismissed: boolean;
}) {
  const [hiddenForNow, setHiddenForNow] = useState(false);
  const [dismissedForGood, setDismissedForGood] = useState(initiallyDismissed);
  const [index, setIndex] = useState(0);
  const [, startTransition] = useTransition();

  if (dismissedForGood || hiddenForNow || steps.length === 0) return null;

  const step = steps[index];
  const isLast = index === steps.length - 1;

  function next() {
    if (isLast) {
      setHiddenForNow(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function skip() {
    setHiddenForNow(true);
  }

  function dontShowAgain() {
    setDismissedForGood(true);
    startTransition(() => {
      dismissGuideAction(guideKey);
    });
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50 p-4 shadow-subtle">
      <Lightbulb size={18} className="mt-0.5 shrink-0 text-brand-600" />
      <div className="flex-1">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink">{step.title}</span>
          <button
            onClick={skip}
            aria-label="إغلاق"
            className="rounded p-0.5 text-ink-faint hover:bg-white/60 hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>
        <p className="text-sm text-ink-muted">{step.body}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={next} size="sm" variant="primary">
            {isLast ? 'إنهاء' : 'التالي'}
            {!isLast && <ArrowLeft size={14} />}
          </Button>
          {!isLast && (
            <button onClick={skip} className="text-xs font-medium text-ink-muted hover:text-ink">
              تخطي
            </button>
          )}
          <button onClick={dontShowAgain} className="text-xs font-medium text-ink-faint hover:text-ink">
            عدم الإظهار مرة أخرى
          </button>
          {steps.length > 1 && (
            <span className="ms-auto text-xs text-ink-faint">
              {index + 1} / {steps.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
