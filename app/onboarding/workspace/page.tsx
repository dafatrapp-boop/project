import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}[] = [
  { value: 'clinic', label: 'عيادة أو مركز طبي', hint: 'أسنان، جلدية، تجميل، علاج طبيعي' },
  { value: 'beauty_salon', label: 'صالون تجميل', hint: 'حلاقة، مكياج، عناية بالبشرة والشعر' },
  { value: 'real_estate', label: 'عقارات', hint: 'مكاتب عقارية، وسطاء، بيع شقق' },
  { value: 'training_center', label: 'مركز تدريب / أكاديمية', hint: 'دورات لغات، برمجة، تدريب مهني' },
  { value: 'lawyer', label: 'محاماة', hint: 'استشارات قانونية وقضايا' },
  { value: 'consultant', label: 'استشارات', hint: 'استشارات أعمال، تسويق، إدارية' },
  { value: 'instagram_store', label: 'متجر انستغرام', hint: 'أزياء، عطور، إكسسوارات، منتجات منزلية' },
  { value: 'restaurant', label: 'مطعم', hint: 'طلبات عبر السوشيال ميديا' },
  { value: 'other', label: 'مجال آخر', hint: 'أي نشاط تجاري آخر' },
];

type Industry =
  | 'clinic'
  | 'beauty_salon'
  | 'real_estate'
  | 'training_center'
  | 'lawyer'
  | 'consultant'
  | 'instagram_store'
  | 'restaurant'
  | 'other';

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
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-subtle px-4 py-10">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-card">
        <h1 className="mb-1 text-xl font-semibold text-ink">
          أنشئ مساحة عملك
        </h1>

        <p className="mb-6 text-sm text-ink-muted">
          سنخصص لك التجربة بناءً على نوع نشاطك التجاري.
        </p>

        {searchParams.error && (
          <div className="mb-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {searchParams.error}
          </div>
        )}

        <form action={createWorkspaceAction} className="flex flex-col gap-5">
          <Input
            name="name"
            label="اسم النشاط التجاري"
            placeholder="مثال: عيادة الابتسامة"
            required
          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">
              مجال النشاط
            </legend>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {INDUSTRIES.map((industry, i) => (
                <label
                  key={industry.value}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-start has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
                >
                  <input
                    type="radio"
                    name="industry"
                    value={industry.value}
                    defaultChecked={i === 0}
                    className="mt-1"
                    required
                  />

                  <span>
                    <span className="block text-sm font-medium text-ink">
                      {industry.label}
                    </span>

                    <span className="block text-xs text-ink-muted">
                      {industry.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Button type="submit" size="lg">
            متابعة
          </Button>
        </form>
      </div>
    </main>
  );
}
