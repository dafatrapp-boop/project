import { MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';

export default function CheckEmailPage() {
  return (
    <AuthShell
      title="تحقق من بريدك الإلكتروني"
      subtitle=""
      footer={
        <a href="/login" className="font-medium text-brand-600 hover:underline">
          العودة إلى تسجيل الدخول
        </a>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="text-sm leading-6 text-ink-muted">
          أرسلنا رابط تأكيد إلى بريدك الإلكتروني. افتح الرسالة واضغط على الرابط لتفعيل
          حسابك والمتابعة.
        </p>
        <p className="text-xs text-ink-faint">
          لم تصلك الرسالة؟ تحقق من مجلد الرسائل غير المرغوبة، أو{' '}
          <a href="/signup" className="text-brand-600 hover:underline">
            جرّب بريدًا آخر
          </a>
          .
        </p>
      </div>
    </AuthShell>
  );
}
