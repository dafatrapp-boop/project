import { redirect } from 'next/navigation';
import { Mail, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/alert';
import { AuthShell } from '@/components/auth/auth-shell';

const errorMessages: Record<string, string> = {
  missing_fields: 'يرجى تعبئة جميع الحقول.',
  weak_password: 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.',
};

async function signUpAction(formData: FormData) {
  'use server';

  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
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
    const knownMessage = errorMessages[error.message];
    redirect(`/signup?error=${encodeURIComponent(knownMessage ? error.message : 'generic')}`);
  }

  redirect('/signup/check-email');
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const message = searchParams.error
    ? errorMessages[searchParams.error] ?? 'حدث خطأ أثناء إنشاء الحساب. يرجى التحقق من البيانات والمحاولة مرة أخرى.'
    : null;

  return (
    <AuthShell
      title="إنشاء حساب جديد"
      subtitle="ابدأ في تحويل زوار إعلاناتك إلى عملاء حقيقيين."
      footer={
        <>
          لديك حساب بالفعل؟{' '}
          <a href="/login" className="font-medium text-brand-600 hover:underline">
            تسجيل الدخول
          </a>
        </>
      }
    >
      {message && (
        <Alert variant="error" className="mb-4">
          {message}
        </Alert>
      )}

      <form action={signUpAction} className="flex flex-col gap-4" noValidate>
        <Input
          name="fullName"
          label="الاسم الكامل"
          placeholder="مثال: أحمد محمد"
          autoComplete="name"
          icon={<User className="h-4 w-4" />}
          required
        />
        <Input
          name="email"
          type="email"
          label="البريد الإلكتروني"
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          required
        />
        <PasswordInput
          name="password"
          label="كلمة المرور"
          placeholder="••••••••"
          autoComplete="new-password"
          hint="8 أحرف على الأقل"
          minLength={8}
          required
        />
        <SubmitButton pendingText="جارٍ إنشاء الحساب...">إنشاء الحساب</SubmitButton>
      </form>

      <p className="mt-4 text-center text-xs leading-5 text-ink-faint">
        بإنشائك حسابًا فإنك توافق على{' '}
        <a href="/terms" className="underline hover:text-ink-muted">
          شروط الاستخدام
        </a>{' '}
        و{' '}
        <a href="/privacy" className="underline hover:text-ink-muted">
          سياسة الخصوصية
        </a>
        .
      </p>
    </AuthShell>
  );
}
