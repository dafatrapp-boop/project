import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthCard } from '@/components/auth/auth-card';

export default function CheckEmailPage() {
  return (
    <AuthShell
      panelTitle="أنت على بعد خطوة واحدة من استقبال أول عميل"
      panelSubtitle="بمجرد تفعيل حسابك، ستكون جاهزًا لإنشاء صفحتك وربطها بواتساب."
    >
      <AuthCard align="center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <MailCheck size={26} />
        </div>
        <h1 className="mb-2 text-title-lg text-ink">تحقق من بريدك الإلكتروني</h1>
        <p className="text-body-lg leading-relaxed text-ink-muted">
          أرسلنا رابط تأكيد إلى بريدك الإلكتروني. يرجى فتحه لتفعيل حسابك والمتابعة.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-block text-body-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          العودة إلى تسجيل الدخول
        </Link>
      </AuthCard>
    </AuthShell>
  );
}
