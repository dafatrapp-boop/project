import Link from 'next/link';
import { CheckCircle2, Circle, ChevronLeft } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthCard } from '@/components/auth/auth-card';
import { OnboardingSteps } from '@/components/auth/onboarding-steps';
import { getOnboardingChecklist, checklistProgress } from '@/lib/onboarding/checklist';
import { dismissOnboardingWizardAction } from './actions';

export default async function OnboardingSetupPage() {
  const { supabase, workspaceId } = await requireWorkspace();
  const steps = await getOnboardingChecklist(supabase, workspaceId);
  const progress = checklistProgress(steps);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <AuthShell
      formWidth="lg"
      panelTitle="خطوات قليلة تفصلك عن إطلاق صفحتك"
      panelSubtitle="أكمل الإعداد الأساسي الآن، ويمكنك دائمًا العودة والمتابعة لاحقًا من لوحة التحكم."
    >
      <AuthCard title="لنجهّز حسابك خطوة بخطوة" description="أكمل الخطوات التالية لتبدأ باستقبال عملاء حقيقيين من صفحتك.">
        <OnboardingSteps current={2} />
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-body-sm">
            <span className="font-semibold text-ink">{progress}% مكتمل</span>
            <span className="text-ink-faint">
              {doneCount} من {steps.length}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ul className="mb-6 flex flex-col gap-1 stagger">
          {steps.map((step) => (
            <li key={step.id} className="animate-rise-in">
              <Link
                href={step.href}
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-body-sm transition-colors hover:bg-surface-subtle"
              >
                {step.done ? (
                  <CheckCircle2 size={19} className="shrink-0 text-success" />
                ) : (
                  <Circle size={19} className="shrink-0 text-ink-faint" />
                )}
                <span className={step.done ? 'text-ink-muted line-through' : 'font-medium text-ink'}>
                  {step.label}
                </span>
                {!step.done && (
                  <ChevronLeft
                    size={15}
                    className="ms-auto shrink-0 text-ink-faint transition-transform group-hover:-translate-x-0.5"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
          <form action={dismissOnboardingWizardAction}>
            <button type="submit" className="text-caption font-medium text-ink-faint transition-colors hover:text-ink">
              عدم إظهار هذه الصفحة مرة أخرى
            </button>
          </form>
          <Link href="/dashboard">
            <Button variant="secondary">الذهاب إلى لوحة التحكم</Button>
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
