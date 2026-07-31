import { requireWorkspace } from '@/lib/workspace';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PLATFORM_LABELS } from '@/lib/campaigns/constants';
import { createCampaignAction } from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing_name: 'يرجى إدخال اسم الحملة.',
  duplicate_name: 'يوجد بالفعل حملة بنفس الاسم. جرّب اسمًا مختلفًا.',
  create_failed: 'تعذر إنشاء الحملة. حاول مرة أخرى.',
  plan_limit_reached: 'وصلت للحد الأقصى لعدد الحملات في باقتك الحالية. قم بالترقية من صفحة الفريق والباقة.',
};

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { data: landingPages } = await supabase
    .from('landing_pages')
    .select('id, title')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-xl font-semibold text-ink">حملة جديدة</h1>
      <p className="mb-6 text-sm text-ink-muted">
        اربط الحملة بصفحة هبوط لتتبع الزيارات والعملاء المحتملين تلقائيًا.
      </p>

      {searchParams.error && (
        <div className="mb-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {ERROR_MESSAGES[searchParams.error] ?? ERROR_MESSAGES.create_failed}
        </div>
      )}

      <form action={createCampaignAction} className="flex flex-col gap-4">
        <Input name="name" label="اسم الحملة" placeholder="مثال: عرض الصيف 2026" required />

        <Select name="platform" label="المنصة الإعلانية" defaultValue="instagram">
          {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select name="landingPageId" label="صفحة الهبوط المرتبطة (اختياري)" defaultValue="">
          <option value="">بدون ربط</option>
          {(landingPages ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </Select>

        <Input name="budget" type="number" step="0.01" label="الميزانية (اختياري)" placeholder="0.00" />

        <div className="grid grid-cols-2 gap-3">
          <Input name="startsAt" type="date" label="تاريخ البدء" />
          <Input name="endsAt" type="date" label="تاريخ الانتهاء" />
        </div>

        <p className="rounded-md bg-surface-subtle p-3 text-xs text-ink-muted">
          بعد الإنشاء، أضف <code dir="ltr">utm_campaign</code> بالقيمة المطابقة لاسم الحملة (بصيغة
          slug) إلى رابط إعلانك ليتم ربط كل زيارة وعميل محتمل بهذه الحملة تلقائيًا.
        </p>

        <Button type="submit" size="lg">إنشاء الحملة</Button>
      </form>
    </div>
  );
}
