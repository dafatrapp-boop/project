'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthAlert } from '@/components/auth/auth-alert';

/**
 * Supabase sends the user here already authenticated via a short-lived
 * recovery session (established client-side from the email link's
 * token). We simply ask for the new password and call updateUser.
 */
export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
      return;
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('انتهت صلاحية الرابط أو حدث خطأ. يرجى طلب رابط جديد.');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <AuthShell
      panelTitle="خصوصية حسابك وبيانات عملائك أولويتنا"
      panelSubtitle="اختر كلمة مرور قوية للمتابعة إلى لوحة التحكم بأمان."
    >
      <AuthCard title="تعيين كلمة مرور جديدة" description="اختر كلمة مرور قوية لحسابك.">
        {error && <AuthAlert tone="danger">{error}</AuthAlert>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordInput
            label="كلمة المرور الجديدة"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <PasswordInput
            label="تأكيد كلمة المرور"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            {loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
