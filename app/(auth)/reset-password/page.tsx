import { redirect } from 'next/navigation';
import { Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Alert } from '@/components/ui/alert';
import { AuthShell } from '@/components/auth/auth-shell';

async function requestResetAction(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '').trim();
  if (email) {
    const supabase = createClient();
    // redirectTo must be an allow-listed URL in Supabase Auth settings.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/confirm`,
    });
  }

  // Always redirect to the same "sent" state whether or not the email
  // exists, to avoid leaking which emails are registered.
  redirect('/reset-password?sent=1');
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { sent?: string };
}) {
  return (
    <AuthShell
      title="استعادة كلمة المرور"
      subtitle="أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور."
      footer={
        <>
          تذكرت كلمة المرور؟{' '}
          <a href="/login" className="font-medium text-brand-600 hover:underline">
            تسجيل الدخول
          </a>
        </>
      }
    >
      {searchParams.sent && (
        <Alert variant="success" className="mb-4">
          إذا كان البريد الإلكتروني مسجلًا لدينا، فستصلك رسالة تحتوي على رابط الاستعادة
          خلال دقائق.
        </Alert>
      )}

      <form action={requestResetAction} className="flex flex-col gap-4" noValidate>
        <Input
          name="email"
          type="email"
          label="البريد الإلكتروني"
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          required
        />
        <SubmitButton pendingText="جارٍ الإرسال...">إرسال رابط الاستعادة</SubmitButton>
      </form>
    </AuthShell>
  );
}
