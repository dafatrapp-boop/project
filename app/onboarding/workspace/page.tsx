import { redirect } from 'next/navigation';
import {
  Stethoscope,
  Sparkles,
  Building2,
  GraduationCap,
  Scale,
  Briefcase,
  ShoppingBag,
  UtensilsCrossed,
  LayoutGrid,
  Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthAlert } from '@/components/auth/auth-alert';
import { OnboardingSteps } from '@/components/auth/onboarding-steps';
import { TEMPLATES } from '@/lib/landing-pages/templates';

const INDUSTRIES: {
  value:
    | 'clinic'
    | 'beauty_salon'
    | 'real_estate'
    | 'training_center'
    | 'lawyer'
    | 'consultant'
    | 'instagram_store'
    | 'restaurant'
    | 'other';
  label: string;
  hint: string;
  icon: typeof Stethoscope;
}[] = [
  { value: 'clinic', label: 'عيادة أو مركز طبي', hint: 'أسنان، جلدية، تجميل، علاج طبيعي', icon: Stethoscope },
  { value: 'beauty_salon', label: 'صالون تجميل', hint: 'حلاقة، مكياج، عناية بالبشرة والشعر', icon: Sparkles },
  { value: 'real_estate', label: 'عقارات', hint: 'مكاتب عقارية، وسطاء، بيع شقق', icon: Building2 },
  { value: 'training_center', label: 'مركز تدريب / أكاديمية', hint: 'دورات لغات، برمجة، تدريب مهني', icon: GraduationCap },
  { value: 'lawyer', label: 'محاماة', hint: 'استشارات قانونية وقضايا', icon: Scale },
  { value: 'consultant', label: 'استشارات', hint: 'استشارات أعمال، تسويق، إدارية', icon: Briefcase },
  { value: 'instagram_store', label: 'متجر انستغرام', hint: 'أزياء، عطور، إكسسوارات، منتجات منزلية', icon: ShoppingBag },
  { value: 'restaurant', label: 'مطعم', hint: 'طلبات عبر السوشيال ميديا', icon: UtensilsCrossed },
  { value: 'other', label: 'مجال آخر', hint: 'أي نشاط تجاري آخر', icon: LayoutGrid },
];

type Industry = (typeof INDUSTRIES)[number]['value'];

function slugify(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `workspace-${Date.now()}`
  );
}

async function createWorkspaceAction(formData: FormData) {
  'use server';

  const name = String(formData.get('name') ?? '').trim();

  const industry = String(
    formData.get('industry') ?? 'other'
  ) as Industry;

  if (!name) {
    redirect('/onboarding/workspace?error=missing_name');
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const baseSlug = slugify(name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name,
      slug,
      industry,
      owner_id: user.id,
    })
    .select('id')
    .single();

  if (workspaceError || !workspace) {
    console.error('WORKSPACE ERROR:', workspaceError);

    redirect(
      `/onboarding/workspace?error=${encodeURIComponent(
        workspaceError?.message ?? 'workspace_create_failed'
      )}`
    );
  }

  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    });

  if (memberError) {
    console.error('MEMBERSHIP ERROR:', memberError);

    redirect(
      `/onboarding/workspace?error=${encodeURIComponent(
        memberError.message
      )}`
    );
  }

  const template =
    TEMPLATES.find((t) => t.id === industry) ??
    TEMPLATES[TEMPLATES.length - 1];

  const pageSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { error: pageError } = await supabase
    .from('landing_pages')
    .insert({
      workspace_id: workspace.id,
      title: 'صفحتي الأولى',
      slug: pageSlug,
      template: template.id,
      status: 'draft',
      sections: template.sections,
      whatsapp_number: null,
      meta_title: null,
      meta_description: null,
    });

  if (pageError) {
    console.error('LANDING PAGE ERROR:', pageError);

    redirect(
      `/onboarding/workspace?error=${encodeURIComponent(
        pageError.message
      )}`
    );
  }

  redirect('/onboarding/setup');
}

export default function WorkspaceOnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessage =
    searchParams.error === 'missing_name'
      ? 'يرجى إدخال اسم النشاط التجاري.'
      : searchParams.error
        ? 'تعذر إنشاء مساحة العمل. حاول مرة أخرى.'
        : null;

  return (
    <AuthShell
      formWidth="lg"
      panelTitle="سنجهّز صفحتك تلقائيًا بناءً على نشاطك"
      panelSubtitle="اختر المجال الأقرب لعملك، وسنقترح عليك قالب صفحة هبوط جاهز يمكنك تعديله لاحقًا بحرية."
    >
      <AuthCard title="أنشئ مساحة عملك" description="سنخصص لك التجربة بناءً على نوع نشاطك التجاري.">
        <OnboardingSteps current={1} />
        {errorMessage && <AuthAlert tone="danger">{errorMessage}</AuthAlert>}

        <form action={createWorkspaceAction} className="flex flex-col gap-6">
          <Input
            name="name"
            label="اسم النشاط التجاري"
            placeholder="مثال: عيادة الابتسامة"
            required
            autoComplete="organization"
          />

          <fieldset>
            <legend className="mb-3 text-body-sm font-medium text-ink">مجال النشاط</legend>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {INDUSTRIES.map((industry, i) => {
                const Icon = industry.icon;
                return (
                  <label
                    key={industry.value}
                    className="group relative flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-3.5 text-start transition-all duration-fast ease-out hover:border-border-strong hover:shadow-subtle has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:shadow-glow"
                  >
                    <input
                      type="radio"
                      name="industry"
                      value={industry.value}
                      defaultChecked={i === 0}
                      className="peer sr-only"
                      required
                    />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-ink-muted transition-colors peer-checked:bg-brand-500 peer-checked:text-white">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-body-sm font-medium text-ink">{industry.label}</span>
                      <span className="block text-caption leading-relaxed text-ink-muted">{industry.hint}</span>
                    </span>
                    <span className="absolute end-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <SubmitButton size="lg" className="w-full">
            متابعة
          </SubmitButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
