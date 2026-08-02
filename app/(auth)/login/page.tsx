import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthAlert } from '@/components/auth/auth-alert';

async function loginAction(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '/dashboard');

  if (!email || !password) {
    redirect('/login?error=missing_fields');
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect('/login?error=invalid_credentials');
  }

  redirect(redirectTo);
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirectTo?: string };
}) {
  const errorMessages: Record<string, string> = {
    missing_fields: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
    invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  };

  return (
    <AuthShell
      panelTitle="حوّل رسائل السوشيال ميديا إلى عملاء بشكل تلقائي"
      panelSubtitle="لوحة تحكم واحدة لصفحاتك، عملائك، وطلباتك — من أول رسالة حتى إتمام البيع."
    >
      <AuthCard title="تسجيل الدخول" description="مرحبًا بعودتك إلى SocialSales OS">
        {searchParams.error && (
          <AuthAlert tone="danger">
            {errorMessages[searchParams.error] ?? 'حدث خطأ غير متوقع. حاول مرة أخرى.'}
          </AuthAlert>
        )}

        <form action={loginAction} className="flex flex-col gap-4">
          <input type="hidden" name="redirectTo" value={searchParams.redirectTo ?? '/dashboard'} />
          <Input name="email" type="email" label="البريد الإلكتروني" placeholder="you@example.com" required autoComplete="email" />
          <div className="flex flex-col gap-1.5">
            <PasswordInput name="password" label="كلمة المرور" placeholder="••••••••" required autoComplete="current-password" />
            <Link href="/reset-password" className="self-start text-sm font-medium text-brand-600 transition-colors hover:text-brand-700">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <SubmitButton size="lg" className="mt-2 w-full">تسجيل الدخول</SubmitButton>
        </form>

        <p className="mt-7 text-center text-sm text-ink-muted">
          ليس لديك حساب؟{' '}
          <Link href="/signup" className="font-semibold text-brand-600 transition-colors hover:text-brand-700">
            إنشاء حساب جديد
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
