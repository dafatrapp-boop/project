import { cn } from '@/lib/utils';

const STEPS = ['مساحة العمل', 'الإعداد الأولي'];

/**
 * Phase 4.4 — "progress visibility": the 2-step onboarding flow
 * (create workspace → initial setup) previously gave no indication a
 * user was mid-flow or how much was left. A simple labeled 2-segment
 * bar is enough for a 2-step flow — no need for a heavier stepper
 * component that would be overkill here.
 */
export function OnboardingSteps({ current }: { current: 1 | 2 }) {
  return (
    <div className="mb-7 flex items-center gap-2" aria-label={`الخطوة ${current} من ${STEPS.length}`}>
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <span
                className={cn(
                  'h-1.5 rounded-full transition-colors duration-base',
                  done || active ? 'bg-brand-500' : 'bg-border'
                )}
              />
              <span className={cn('text-caption font-medium', active ? 'text-ink' : 'text-ink-faint')}>
                {step}. {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
