import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
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
          <AuthAlert tone="danger">
            حدث خطأ أثناء إنشاء الحساب. يرجى التحقق من البيانات والمحاولة مرة أخرى.
          </AuthAlert>
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
          <Button type="submit" size="lg" className="mt-2 w-full">إنشاء الحساب</Button>
        </form>

        <p className="mt-7 text-center text-sm text-ink-muted">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="font-semibold text-brand-600 transition-colors hover:text-brand-700">
            تسجيل الدخول
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
