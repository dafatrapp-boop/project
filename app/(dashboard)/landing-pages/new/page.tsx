import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { TEMPLATES } from '@/lib/landing-pages/templates';
import { createLandingPageAction } from '../actions';
import { requireWorkspace } from '@/lib/workspace';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { TEMPLATES_GUIDE } from '@/lib/guide/content';

export default async function NewLandingPagePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { supabase, user } = await requireWorkspace();
  const guideDismissed = await getGuideDismissed(supabase, user.id, 'templates');

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="صفحة هبوط جديدة"
        description="اختر قالبًا مناسبًا لنشاطك، ويمكنك تعديل كل شيء لاحقًا."
        className="mb-6"
      />

      <PageGuide guideKey="templates" title={TEMPLATES_GUIDE.title} steps={TEMPLATES_GUIDE.steps} initiallyDismissed={guideDismissed} />

      {searchParams.error && (
        <div className="mt-4 rounded-md border border-danger/30 bg-danger-50 px-3 py-2 text-body-sm text-danger">
          {searchParams.error === 'plan_limit_reached'
            ? 'وصلت للحد الأقصى لعدد صفحات الهبوط في باقتك الحالية. قم بترقية الباقة من مساحة العمل.'
            : 'تعذر إنشاء الصفحة. تأكد من إدخال عنوان صالح.'}
        </div>
      )}

      <form action={createLandingPageAction} className="mt-6 flex flex-col gap-5">
        <Input name="title" label="عنوان الصفحة" placeholder="مثال: عرض افتتاح الفرع الجديد" required />

        <fieldset>
          <legend className="mb-2 text-body-sm font-medium text-ink">القالب</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TEMPLATES.map((template, i) => (
              <label
                key={template.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 text-start shadow-subtle transition-all duration-fast has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:shadow-glow hover:border-border-strong"
              >
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  defaultChecked={i === 0}
                  className="mt-1 accent-brand-500"
                  required
                />
                <span>
                  <span className="block text-body-sm font-semibold text-ink">{template.label}</span>
                  <span className="mt-0.5 block text-caption text-ink-muted">{template.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Button type="submit" size="lg">إنشاء الصفحة</Button>
      </form>
    </div>
  );
}
