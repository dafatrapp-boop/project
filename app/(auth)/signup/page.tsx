import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthAlert } from '@/components/auth/auth-alert';

async function signUpAction(formData: FormData) {
  'use server';

  const fullName = String(formData.get('fullName') ?? '');
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!fullName || !email || !password) {
    redirect('/signup?error=missing_fields');
  }
  if (password.length < 8) {
    redirect('/signup?error=weak_password');
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/signup/check-email');
}

// Phase 4.4 — "validation feedback": the form previously showed one
// generic message for every failure (missing fields, a weak password,
// an already-registered email all looked identical). Supabase's raw
// error strings are English and vary by project config, so this maps
// the two first-party checks precisely and catches the single most
// common Supabase Auth message; anything else still gets a clear
// fallback instead of silently mistranslating.
function errorMessageFor(code: string): string {
  if (code === 'missing_fields') return 'يرجى تعبئة جميع الحقول.';
  if (code === 'weak_password') return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.';
  if (/already registered|already exists/i.test(code)) return 'هذا البريد الإلكتروني مسجّل بالفعل. جرّب تسجيل الدخول بدلًا من ذلك.';
  return 'حدث خطأ أثناء إنشاء الحساب. يرجى التحقق من البيانات والمحاولة مرة أخرى.';
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <AuthShell
      panelTitle="ابدأ ببناء صفحتك الأولى في أقل من ٥ دقائق"
      panelSubtitle="أنشئ حسابًا، اختر مجال نشاطك، وسنجهّز لك صفحة هبوط جاهزة لاستقبال العملاء فورًا."
    >
      <AuthCard title="إنشاء حساب جديد" description="ابدأ في تحويل زوار إعلاناتك إلى عملاء حقيقيين">
        {searchParams.error && (
          <AuthAlert tone="danger">{errorMessageFor(searchParams.error)}</AuthAlert>
        )}

        <form action={signUpAction} className="flex flex-col gap-4">
          <Input name="fullName" label="الاسم الكامل" placeholder="مثال: أحمد محمد" required autoComplete="name" />
          <Input name="email" type="email" label="البريد الإلكتروني" placeholder="you@example.com" required autoComplete="email" />
          <PasswordInput
            name="password"
            label="كلمة المرور"
            placeholder="8 أحرف على الأقل"
            required
            minLength={8}
            autoComplete="new-password"
            hint="استخدم 8 أحرف على الأقل لحماية أفضل."
          />
          <SubmitButton size="lg" className="mt-2 w-full">إنشاء الحساب</SubmitButton>
        </form>

        <p className="mt-7 text-center text-body-sm text-ink-muted">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="font-semibold text-brand-600 transition-colors hover:text-brand-700">
            تسجيل الدخول
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
