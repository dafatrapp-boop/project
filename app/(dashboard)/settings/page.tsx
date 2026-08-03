import { Building2, ShieldCheck, CreditCard } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Card, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { hasFeature, PLAN_LABELS } from '@/lib/plans/constants';
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from '@/lib/appointments/constants';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { SETTINGS_GUIDE } from '@/lib/guide/content';
import { WorkspaceTabs } from '@/components/layout/workspace-tabs';
import { PushNotificationToggle } from '@/components/pwa/push-toggle';
import {
  updateProfileAction,
  updateMetaPixelAction,
  updateAppointmentSettingsAction,
  resetGuidesAction,
} from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_pixel_id: 'رقم Meta Pixel غير صالح — يجب أن يتكون من أرقام فقط (10-20 رقمًا).',
  missing_pixel_id: 'يرجى إدخال رقم Meta Pixel — لا يمكن حفظ الحقل فارغًا.',
  save_failed: 'تعذر الحفظ. حاول مرة أخرى.',
  not_authorized: 'يلزم أن تكون مالكًا أو مشرفًا لتعديل هذا الإعداد.',
  invalid_hours: 'وقت البداية يجب أن يكون قبل وقت النهاية.',
  missing_working_days: 'اختر يومًا واحدًا على الأقل من أيام العمل.',
  missing_name: 'يرجى إدخال الاسم — لا يمكن حفظ الحقل فارغًا.',
};

const SUCCESS_MESSAGES: Record<string, string> = {
  '1': 'تم حفظ رقم Meta Pixel بنجاح.',
  appointments: 'تم حفظ إعدادات المواعيد بنجاح.',
  guides_reset: 'تمت إعادة تفعيل جميع الإرشادات — ستظهر من جديد أثناء تصفحك.',
  profile: 'تم حفظ اسمك بنجاح.',
};

const SLOT_DURATIONS = [15, 20, 30, 45, 60, 90];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const { supabase, user, workspaceId, role, name, metaPixelId, plan } = await requireWorkspace();
  const pixelAllowed = hasFeature(plan, 'metaPixel');

  // All three only depend on workspaceId/user.id, both already resolved
  // above — previously three separate sequential awaits.
  const [{ data: appointmentSettings }, guideDismissed, { data: profile }] = await Promise.all([
    supabase.from('appointment_settings').select('*').eq('workspace_id', workspaceId).single(),
    getGuideDismissed(supabase, user.id, 'settings'),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ]);

  const ROLE_LABELS: Record<string, string> = { owner: 'مالك', admin: 'مشرف', member: 'عضو' };

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceTabs />
      <PageHeader title="الإعدادات" description="معلومات مساحة العمل الحالية." />

      <PageGuide guideKey="settings" title={SETTINGS_GUIDE.title} steps={SETTINGS_GUIDE.steps} initiallyDismissed={guideDismissed} />

      {searchParams.error && (
        <div className="max-w-2xl rounded-md border border-danger/30 bg-danger-50 px-3 py-2 text-body-sm text-danger">
          {ERROR_MESSAGES[searchParams.error] ?? 'حدث خطأ. حاول مرة أخرى.'}
        </div>
      )}
      {searchParams.success && (
        <div className="max-w-2xl rounded-md border border-success/30 bg-success-50 px-3 py-2 text-body-sm text-success">
          {SUCCESS_MESSAGES[searchParams.success] ?? 'تم الحفظ بنجاح.'}
        </div>
      )}

      {/* All section cards below share one consistent max-width so
          their edges align down the page, instead of the previous mix
          of max-w-md / max-w-2xl per card. */}
      <Card className="max-w-2xl">
        <CardHeader
          title="الملف الشخصي"
          description="اسمك كما يظهر لباقي أعضاء الفريق."
          action={!profile?.full_name ? <Badge tone="warning" size="sm">أضف اسمك</Badge> : undefined}
        />
        <form action={updateProfileAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              name="fullName"
              label="الاسم الكامل"
              placeholder="مثال: أحمد محمد"
              defaultValue={profile?.full_name ?? ''}
              required
            />
          </div>
          <Button type="submit" variant="secondary" className="sm:w-auto">
            حفظ
          </Button>
        </form>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader title="مساحة العمل" />
        <dl className="flex flex-col gap-3 text-body-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-ink-muted"><Building2 size={14} /> اسم النشاط</dt>
            <dd className="font-medium text-ink">{name || '—'}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-ink-muted"><ShieldCheck size={14} /> دورك</dt>
            <dd className="font-medium text-ink">{ROLE_LABELS[role] ?? role}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-ink-muted"><CreditCard size={14} /> الباقة</dt>
            <dd><Badge tone="brand">{PLAN_LABELS[plan]}</Badge></dd>
          </div>
        </dl>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader
          title="Meta Pixel"
          action={!pixelAllowed ? <Badge tone="warning" size="sm">يتطلب باقة أساسية أو أعلى</Badge> : undefined}
        />
        <p className="mb-4 text-body-sm text-ink-muted">
          أدخل رقم Meta Pixel الخاص بحسابك الإعلاني (من Meta Events Manager) لتفعيل تتبع الزيارات
          والتحويلات على صفحات الهبوط المنشورة. لن نُنشئ أو نخمّن هذا الرقم نيابةً عنك.
          {!pixelAllowed && ' يمكنك حفظ الرقم الآن، لكنه لن يُفعَّل فعليًا على صفحاتك إلا بعد الترقية.'}
        </p>

        <form action={updateMetaPixelAction} className="flex flex-col gap-3">
          <Input
            name="metaPixelId"
            label="Meta Pixel ID"
            placeholder="مثال: 1234567890123456"
            defaultValue={metaPixelId ?? ''}
            required
            pattern="\d{10,20}"
            title="أرقام فقط، من 10 إلى 20 رقمًا"
            hint="مطلوب — أرقام فقط (10 إلى 20 رقمًا)، من Meta Events Manager."
            dir="ltr"
          />
          <Button type="submit" variant="secondary" className="self-start">
            حفظ
          </Button>
        </form>
      </Card>

      {appointmentSettings && (
        <Card className="max-w-2xl">
          <CardHeader
            title="المواعيد"
            action={
              <Badge tone={appointmentSettings.enabled ? 'success' : 'neutral'} size="sm" dot>
                {appointmentSettings.enabled ? 'مفعّلة' : 'معطّلة'}
              </Badge>
            }
          />
          <p className="mb-4 text-body-sm text-ink-muted">
            عند التفعيل، يظهر قسم حجز مواعيد احترافي في صفحات الهبوط (بعد إضافته من محرر الصفحة)، ويستطيع
            العميل اختيار اليوم والوقت المتاح مباشرة.
          </p>

          <form action={updateAppointmentSettingsAction} className="flex flex-col gap-4">
            <label className="flex items-center gap-2 text-body-sm font-medium text-ink">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={appointmentSettings.enabled}
                className="h-4 w-4 rounded border-border accent-brand-500"
              />
              تفعيل حجز المواعيد
            </label>

            <fieldset>
              <legend className="mb-2 text-body-sm font-medium text-ink">أيام العمل</legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_ORDER.map((day) => (
                  <label
                    key={day}
                    className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-caption transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 hover:border-border-strong"
                  >
                    <input
                      type="checkbox"
                      name="workingDays"
                      value={day}
                      defaultChecked={appointmentSettings.working_days.includes(day)}
                      className="h-3.5 w-3.5 accent-brand-500"
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
        </Card>
      )}

      <Card className="max-w-2xl">
        <CardHeader title="الإشعارات" description="تحكم في الإشعارات الفورية على هذا الجهاز." />
        <PushNotificationToggle />
      </Card>

      <Card className="max-w-2xl">
        <CardHeader title="الإرشادات داخل التطبيق" />
        <p className="mb-4 text-body-sm text-ink-muted">
          إذا أغلقت إرشادات الصفحات ولم تعد تظهر، يمكنك إعادة تفعيلها لتظهر من جديد أثناء تصفحك.
        </p>
        <form action={resetGuidesAction}>
          <Button type="submit" variant="secondary" size="sm">
            إعادة تفعيل الإرشادات
          </Button>
        </form>
      </Card>
    </div>
  );
}
