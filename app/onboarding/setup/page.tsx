import Link from 'next/link';
import { CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Button } from '@/components/ui/button';
import { getOnboardingChecklist, checklistProgress } from '@/lib/onboarding/checklist';
import { dismissOnboardingWizardAction } from './actions';

export default async function OnboardingSetupPage() {
  const { supabase, workspaceId } = await requireWorkspace();
  const steps = await getOnboardingChecklist(supabase, workspaceId);
  const progress = checklistProgress(steps);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-subtle px-4 py-10">
      <div className="w-full max-w-xl rounded-lg border border-border bg-surface p-6 shadow-card">
        <h1 className="mb-1 text-xl font-semibold text-ink">لنجهّز حسابك خطوة بخطوة</h1>
        <p className="mb-5 text-sm text-ink-muted">
          أكمل الخطوات التالية لتبدأ باستقبال عملاء حقيقيين من صفحتك.
        </p>

        <div className="mb-6">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-ink">{progress}% مكتمل</span>
            <span className="text-ink-faint">
              {steps.filter((s) => s.done).length} من {steps.length}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ul className="mb-6 flex flex-col gap-1">
          {steps.map((step) => (
            <li key={step.id}>
              <Link
                href={step.href}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-surface-subtle"
              >
                {step.done ? (
                  <CheckCircle2 size={18} className="shrink-0 text-success" />
                ) : (
                  <Circle size={18} className="shrink-0 text-ink-faint" />
                )}
                <span className={step.done ? 'text-ink-muted line-through' : 'text-ink'}>{step.label}</span>
                {!step.done && <ArrowLeft size={14} className="ms-auto shrink-0 text-ink-faint" />}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <form action={dismissOnboardingWizardAction}>
            <button type="submit" className="text-xs font-medium text-ink-faint hover:text-ink">
              عدم إظهار هذه الصفحة مرة أخرى
            </button>
          </form>
          <Link href="/dashboard">
            <Button variant="secondary">الذهاب إلى لوحة التحكم</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
