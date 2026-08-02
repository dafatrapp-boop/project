import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthAlert } from '@/components/auth/auth-alert';

async function requestResetAction(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '');
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
      panelTitle="لا تفوّت أي رسالة من عميل محتمل"
      panelSubtitle="نظّم كل محادثاتك وطلباتك في مكان واحد، مهما كانت المنصة التي جاء منها العميل."
    >
      <AuthCard title="استعادة كلمة المرور" description="أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.">
        {searchParams.sent && (
          <AuthAlert tone="success">
            إذا كان البريد الإلكتروني مسجلًا لدينا، فستصلك رسالة تحتوي على رابط الاستعادة خلال دقائق.
          </AuthAlert>
        )}

        <form action={requestResetAction} className="flex flex-col gap-4">
          <Input name="email" type="email" label="البريد الإلكتروني" placeholder="you@example.com" required autoComplete="email" />
          <SubmitButton size="lg" className="mt-2 w-full">إرسال رابط الاستعادة</SubmitButton>
        </form>

        <p className="mt-7 text-center text-body-sm text-ink-muted">
          تذكرت كلمة المرور؟{' '}
          <Link href="/login" className="font-semibold text-brand-600 transition-colors hover:text-brand-700">
            تسجيل الدخول
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
