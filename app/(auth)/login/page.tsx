import { redirect } from 'next/navigation';
import { Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/alert';
import { AuthShell } from '@/components/auth/auth-shell';

async function loginAction(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '/dashboard');

  if (!email || !password) {
    redirect(`/login?error=missing_fields&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=invalid_credentials&redirectTo=${encodeURIComponent(redirectTo)}`);
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
  const redirectTo = searchParams.redirectTo ?? '/dashboard';

  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="مرحبًا بعودتك إلى SocialSales OS"
      footer={
        <>
          ليس لديك حساب؟{' '}
          <a href="/signup" className="font-medium text-brand-600 hover:underline">
            إنشاء حساب جديد
          </a>
        </>
      }
    >
      {searchParams.error && (
        <Alert variant="error" className="mb-4">
          {errorMessages[searchParams.error] ?? 'حدث خطأ غير متوقع. حاول مرة أخرى.'}
        </Alert>
      )}

      <form action={loginAction} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Input
          name="email"
          type="email"
          label="البريد الإلكتروني"
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          required
        />
        <div className="flex flex-col gap-1.5">
          <PasswordInput
            name="password"
            label="كلمة المرور"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <a href="/reset-password" className="self-start text-sm text-brand-600 hover:underline">
            نسيت كلمة المرور؟
          </a>
        </div>
        <SubmitButton pendingText="جارٍ تسجيل الدخول...">تسجيل الدخول</SubmitButton>
      </form>
    </AuthShell>
  );
}
