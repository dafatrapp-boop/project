'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert } from '@/components/ui/alert';
import { AuthShell } from '@/components/auth/auth-shell';
import { Loader2 } from 'lucide-react';

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

  const mismatch = confirm.length > 0 && password !== confirm;

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
    <AuthShell title="تعيين كلمة مرور جديدة" subtitle="اختر كلمة مرور قوية لحسابك.">
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <PasswordInput
          label="كلمة المرور الجديدة"
          autoComplete="new-password"
          hint="8 أحرف على الأقل"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordInput
          label="تأكيد كلمة المرور"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? 'كلمتا المرور غير متطابقتين.' : undefined}
          required
        />
        <Button type="submit" size="lg" disabled={loading} aria-busy={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              جارٍ الحفظ...
            </>
          ) : (
            'حفظ كلمة المرور'
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
