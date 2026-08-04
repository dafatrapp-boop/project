import Link from 'next/link';
import { ShieldCheck, Mail, Sparkles, ChevronRight, ExternalLink } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { hasFeature } from '@/lib/plans/constants';
import { updateMetaPixelAction, updateGa4Action, updateDefaultWhatsAppAction } from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_pixel_id: 'رقم Meta Pixel غير صالح — يجب أن يتكون من أرقام فقط (10-20 رقمًا).',
  missing_pixel_id: 'يرجى إدخال رقم Meta Pixel — لا يمكن حفظ الحقل فارغًا.',
  invalid_ga4_id: 'معرّف GA4 غير صالح — يجب أن يبدأ بـ G- (مثال: G-XXXXXXXXXX).',
  not_authorized: 'يلزم أن تكون مالكًا أو مشرفًا لتعديل هذا الإعداد.',
  save_failed: 'تعذر الحفظ. حاول مرة أخرى.',
  empty: 'يرجى إدخال رقم الهاتف.',
  invalid_chars: 'رقم الهاتف يجب أن يتكون من أرقام فقط.',
  invalid_prefix: 'رقم الهاتف يجب أن يبدأ بـ 07 أو 7 (رقم عراقي فقط).',
  too_short: 'رقم الهاتف قصير جدًا.',
  too_long: 'رقم الهاتف طويل جدًا.',
};

const SUCCESS_MESSAGES: Record<string, string> = {
  '1': 'تم حفظ رقم Meta Pixel بنجاح.',
  ga4: 'تم حفظ إعدادات Google Analytics بنجاح.',
  whatsapp: 'تم حفظ رقم واتساب الافتراضي بنجاح.',
};

function ConnectionBadge({ connected, label }: { connected: boolean; label?: string }) {
  return (
    <Badge tone={connected ? 'success' : 'neutral'} size="sm" dot>
      {label ?? (connected ? 'متصل' : 'غير متصل')}
    </Badge>
  );
}

/**
 * Single hub for every channel/tracking integration — previously
 * scattered as separate cards inside the general Settings page. Real
 * one-click OAuth "Connect" buttons for Facebook/Instagram/WhatsApp/
 * Google (as opposed to pasting an ID here) need a developer app
 * registered with that platform under this product's own operator
 * account first — that's a one-time step only the person deploying
 * this app can do (it involves their own Meta/Google developer
 * console), not something achievable from inside the running app
 * itself. This page is honest about that: field-based setup where
 * that's what's actually available today, clear status badges either
 * way, and a note on what unlocks true one-click Connect buttons.
 */
export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const { supabase, workspaceId, role, metaPixelId, plan } = await requireWorkspace();
  const pixelAllowed = hasFeature(plan, 'metaPixel');
  const canEdit = role === 'owner' || role === 'admin';

  const { data: workspaceRow } = await supabase
    .from('workspaces')
    .select('ga4_measurement_id, default_whatsapp_number')
    .eq('id', workspaceId)
    .maybeSingle();

  const turnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  const aiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="التكاملات"
        description="اربط قنوات التواصل وأدوات التتبع الخاصة بك في مكان واحد."
        actions={
          <Link href="/settings">
            <Button variant="secondary" size="sm">
              <ChevronRight size={15} />
              رجوع للإعدادات
            </Button>
          </Link>
        }
      />

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

      <Card className="max-w-2xl">
        <CardHeader
          title="واتساب"
          action={<ConnectionBadge connected={Boolean(workspaceRow?.default_whatsapp_number)} />}
        />
        <p className="mb-4 text-body-sm text-ink-muted">
          الرقم الافتراضي لكل أزرار التواصل عبر واتساب في صفحات هبوطك — يُستخدم تلقائيًا في أي صفحة جديدة تنشئها
          بعد الآن، بدل كتابته من جديد في كل مرة. لا يزال بإمكانك تخصيص رقم مختلف لأي صفحة بعينها من إعداداتها.
        </p>
        {canEdit ? (
          <form action={updateDefaultWhatsAppAction} className="flex flex-col gap-3">
            <Input
              name="whatsapp"
              label="رقم واتساب الافتراضي"
              placeholder="07xxxxxxxxx"
              defaultValue={workspaceRow?.default_whatsapp_number ?? ''}
              dir="ltr"
            />
            <Button type="submit" variant="secondary" className="self-start">
              حفظ
            </Button>
          </form>
        ) : (
          <p className="text-body-sm text-ink-faint">يلزم أن تكون مالكًا أو مشرفًا لتعديل هذا الإعداد.</p>
        )}
      </Card>

      <Card className="max-w-2xl">
        <CardHeader
          title="Meta Pixel"
          action={
            <div className="flex items-center gap-2">
              {!pixelAllowed && <Badge tone="warning" size="sm">يتطلب باقة أساسية أو أعلى</Badge>}
              <ConnectionBadge connected={Boolean(metaPixelId)} />
            </div>
          }
        />
        <p className="mb-4 text-body-sm text-ink-muted">
          تتبّع الزيارات والتحويلات على صفحاتك المنشورة عبر بكسل ميتا. أدخل رقم الـ Pixel من Meta Events Manager —
          لن نُنشئ أو نخمّن هذا الرقم نيابةً عنك.
          {!pixelAllowed && ' يمكنك حفظ الرقم الآن، لكنه لن يُفعَّل فعليًا على صفحاتك إلا بعد الترقية.'}
        </p>
        {canEdit ? (
          <form action={updateMetaPixelAction} className="flex flex-col gap-3">
            <Input
              name="metaPixelId"
              label="Meta Pixel ID"
              placeholder="مثال: 1234567890123456"
              defaultValue={metaPixelId ?? ''}
              required
              pattern="\d{10,20}"
              title="أرقام فقط، من 10 إلى 20 رقمًا"
              hint="أرقام فقط (10 إلى 20 رقمًا)، من Meta Events Manager."
              dir="ltr"
            />
            <Button type="submit" variant="secondary" className="self-start">
              حفظ
            </Button>
          </form>
        ) : (
          <p className="text-body-sm text-ink-faint">يلزم أن تكون مالكًا أو مشرفًا لتعديل هذا الإعداد.</p>
        )}
      </Card>

      <Card className="max-w-2xl">
        <CardHeader
          title="Google Analytics 4"
          action={<ConnectionBadge connected={Boolean(workspaceRow?.ga4_measurement_id)} />}
        />
        <p className="mb-4 text-body-sm text-ink-muted">
          أدخل معرّف القياس (Measurement ID) من حساب Google Analytics الخاص بك لتتبع زوار صفحات الهبوط المنشورة.
        </p>
        {canEdit ? (
          <form action={updateGa4Action} className="flex flex-col gap-3">
            <Input
              name="ga4MeasurementId"
              label="GA4 Measurement ID"
              placeholder="G-XXXXXXXXXX"
              defaultValue={workspaceRow?.ga4_measurement_id ?? ''}
              dir="ltr"
            />
            <Button type="submit" variant="secondary" className="self-start">
              حفظ
            </Button>
          </form>
        ) : (
          <p className="text-body-sm text-ink-faint">يلزم أن تكون مالكًا أو مشرفًا لتعديل هذا الإعداد.</p>
        )}
      </Card>

      <Card className="max-w-2xl">
        <CardHeader title="حالة المنصة" description="خدمات مُفعّلة على مستوى المنصة بالكامل، وليست خاصة بمساحة عملك وحدها." />
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3 rounded-md bg-surface-subtle px-3 py-2">
            <span className="flex items-center gap-2 text-body-sm text-ink">
              <ShieldCheck size={15} className="text-ink-faint" />
              حماية النماذج من الروبوتات (CAPTCHA)
            </span>
            <ConnectionBadge connected={turnstileConfigured} label={turnstileConfigured ? 'مُفعّلة' : 'غير مُفعّلة'} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md bg-surface-subtle px-3 py-2">
            <span className="flex items-center gap-2 text-body-sm text-ink">
              <Mail size={15} className="text-ink-faint" />
              إرسال البريد الإلكتروني (دعوات الفريق)
            </span>
            <ConnectionBadge connected={emailConfigured} label={emailConfigured ? 'مُفعّل' : 'غير مُفعّل — دعوات الفريق تعمل برابط فقط'} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md bg-surface-subtle px-3 py-2">
            <span className="flex items-center gap-2 text-body-sm text-ink">
              <Sparkles size={15} className="text-ink-faint" />
              اقتراح رسائل بالذكاء الاصطناعي المجاني
            </span>
            <ConnectionBadge
              connected={aiConfigured}
              label={aiConfigured ? 'مُفعّل' : 'اقتراح أساسي فقط — فعّل مفتاح Gemini المجاني لجودة أفضل'}
            />
          </div>
        </div>
      </Card>

      <Card className="max-w-2xl" tone="sunken">
        <CardHeader title="ربط مباشر مع فيسبوك / إنستغرام / واتساب بزنس / إعلانات جوجل" />
        <p className="text-body-sm text-ink-muted">
          زر اتصال حقيقي بضغطة واحدة (OAuth) لهذه المنصات يتطلب تسجيل تطبيق مطوّر خاص بحساب مشغّل هذه المنصة نفسها
          عند فيسبوك/جوجل — وهي خطوة تُنفَّذ مرة واحدة من خارج التطبيق ولا يمكن للنظام إنجازها تلقائيًا نيابة عن
          أحد. إلى أن تتوفر تلك الخطوة، الإعداد اليدوي أعلاه (رقم Pixel، معرّف GA4) هو أقرب بديل متاح.
        </p>
        <a
          href="https://developers.facebook.com/docs/development/create-an-app"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-brand-600 hover:underline"
        >
          دليل إنشاء تطبيق Meta للمطورين
          <ExternalLink size={13} />
        </a>
      </Card>
    </div>
  );
}
