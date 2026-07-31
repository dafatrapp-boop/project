import { createClient } from '@/lib/supabase/server';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { hasFeature, PLAN_LABELS, type Plan } from '@/lib/plans/constants';
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from '@/lib/appointments/constants';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { SETTINGS_GUIDE } from '@/lib/guide/content';
import {
  updateMetaPixelAction,
  updateAppointmentSettingsAction,
  resetGuidesAction,
} from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_pixel_id: 'رقم Meta Pixel غير صالح — يجب أن يتكون من أرقام فقط (10-20 رقمًا).',
  not_authorized: 'يلزم أن تكون مالكًا أو مشرفًا لتعديل هذا الإعداد.',
  invalid_hours: 'وقت البداية يجب أن يكون قبل وقت النهاية.',
  missing_working_days: 'اختر يومًا واحدًا على الأقل من أيام العمل.',
};

const SUCCESS_MESSAGES: Record<string, string> = {
  '1': 'تم حفظ رقم Meta Pixel بنجاح.',
  appointments: 'تم حفظ إعدادات المواعيد بنجاح.',
  guides_reset: 'تمت إعادة تفعيل جميع الإرشادات — ستظهر من جديد أثناء تصفحك.',
};

const SLOT_DURATIONS = [15, 20, 30, 45, 60, 90];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(name, industry, meta_pixel_id, plan)')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle();

  const workspaceRaw = membership?.workspaces as
  | { name: string; industry: string; meta_pixel_id: string | null; plan: Plan }
  | { name: string; industry: string; meta_pixel_id: string | null; plan: Plan }[]
  | undefined;
const workspace = Array.isArray(workspaceRaw) ? workspaceRaw[0] ?? null : workspaceRaw ?? null;

  const plan = workspace?.plan ?? 'free';
  const pixelAllowed = hasFeature(plan, 'metaPixel');

  const { data: appointmentSettings } = membership
    ? await supabase
        .from('appointment_settings')
        .select('*')
        .eq('workspace_id', membership.workspace_id)
        .single()
    : { data: null };

  const guideDismissed = await getGuideDismissed(supabase, user!.id, 'settings');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">الإعدادات</h1>
        <p className="text-sm text-ink-muted">معلومات مساحة العمل الحالية.</p>
      </div>

      <PageGuide guideKey="settings" title={SETTINGS_GUIDE.title} steps={SETTINGS_GUIDE.steps} initiallyDismissed={guideDismissed} />

      {searchParams.error && (
        <div className="max-w-md rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {ERROR_MESSAGES[searchParams.error] ?? 'حدث خطأ. حاول مرة أخرى.'}
        </div>
      )}
      {searchParams.success && (
        <div className="max-w-md rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
          {SUCCESS_MESSAGES[searchParams.success] ?? 'تم الحفظ بنجاح.'}
        </div>
      )}

      <div className="max-w-md rounded-lg border border-border bg-surface p-4 shadow-subtle">
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">اسم النشاط</dt>
            <dd className="font-medium text-ink">{workspace?.name ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">دورك</dt>
            <dd className="font-medium text-ink">{membership?.role ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">الباقة</dt>
            <dd><Badge tone="brand">{PLAN_LABELS[plan]}</Badge></dd>
          </div>
        </dl>
      </div>

      <div className="max-w-md rounded-lg border border-border bg-surface p-4 shadow-subtle">
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-ink">Meta Pixel</h2>
          {!pixelAllowed && <Badge tone="warning">يتطلب باقة أساسية أو أعلى</Badge>}
        </div>
        <p className="mb-4 text-xs text-ink-muted">
          أدخل رقم Meta Pixel الخاص بحسابك الإعلاني (من Meta Events Manager) لتفعيل تتبع الزيارات
          والتحويلات على صفحات الهبوط المنشورة. لن نُنشئ أو نخمّن هذا الرقم نيابةً عنك.
          {!pixelAllowed && ' يمكنك حفظ الرقم الآن، لكنه لن يُفعَّل فعليًا على صفحاتك إلا بعد الترقية.'}
        </p>

        <form action={updateMetaPixelAction} className="flex flex-col gap-3">
          <Input
            name="metaPixelId"
            label="Meta Pixel ID"
            placeholder="مثال: 1234567890123456"
            defaultValue={workspace?.meta_pixel_id ?? ''}
            dir="ltr"
          />
          <Button type="submit" variant="secondary" className="self-start">
            حفظ
          </Button>
        </form>
      </div>

      {appointmentSettings && (
        <div className="max-w-2xl rounded-lg border border-border bg-surface p-4 shadow-subtle">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ink">المواعيد</h2>
            <Badge tone={appointmentSettings.enabled ? 'success' : 'neutral'}>
              {appointmentSettings.enabled ? 'مفعّلة' : 'معطّلة'}
            </Badge>
          </div>
          <p className="mb-4 text-xs text-ink-muted">
            عند التفعيل، يظهر قسم حجز مواعيد احترافي في صفحات الهبوط (بعد إضافته من محرر الصفحة)، ويستطيع
            العميل اختيار اليوم والوقت المتاح مباشرة.
          </p>

          <form action={updateAppointmentSettingsAction} className="flex flex-col gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={appointmentSettings.enabled}
                className="h-4 w-4 rounded border-border"
              />
              تفعيل حجز المواعيد
            </label>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink">أيام العمل</legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_ORDER.map((day) => (
                  <label
                    key={day}
                    className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
                  >
                    <input
                      type="checkbox"
                      name="workingDays"
                      value={day}
                      defaultChecked={appointmentSettings.working_days.includes(day)}
                      className="h-3.5 w-3.5"
                    />
                    {WEEKDAY_LABELS[day]}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                type="time"
                name="startTime"
                label="بداية الدوام"
                defaultValue={appointmentSettings.start_time.slice(0, 5)}
              />
              <Input
                type="time"
                name="endTime"
                label="نهاية الدوام"
                defaultValue={appointmentSettings.end_time.slice(0, 5)}
              />
              <Select name="slotDuration" label="مدة الموعد (بالدقائق)" defaultValue={appointmentSettings.slot_duration_minutes}>
                {SLOT_DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} دقيقة</option>
                ))}
              </Select>
              <Input
                type="number"
                min={1}
                name="maxPerSlot"
                label="أقصى عدد حجوزات لكل وقت"
                defaultValue={appointmentSettings.max_bookings_per_slot}
              />
            </div>

            <Input
              name="holidays"
              label="الإجازات (تواريخ مفصولة بفاصلة، مثال: 2026-09-23, 2026-12-25)"
              placeholder="YYYY-MM-DD, YYYY-MM-DD"
              defaultValue={appointmentSettings.holidays.join(', ')}
              dir="ltr"
            />

            <Button type="submit" variant="secondary" className="self-start">
              حفظ إعدادات المواعيد
            </Button>
          </form>
        </div>
      )}

      <div className="max-w-md rounded-lg border border-border bg-surface p-4 shadow-subtle">
        <h2 className="mb-1 text-sm font-semibold text-ink">الإرشادات داخل التطبيق</h2>
        <p className="mb-4 text-xs text-ink-muted">
          إذا أغلقت إرشادات الصفحات ولم تعد تظهر، يمكنك إعادة تفعيلها لتظهر من جديد أثناء تصفحك.
        </p>
        <form action={resetGuidesAction}>
          <Button type="submit" variant="secondary" size="sm">
            إعادة تفعيل الإرشادات
          </Button>
        </form>
      </div>
    </div>
  );
}
