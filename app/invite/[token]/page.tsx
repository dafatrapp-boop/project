import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from '@/app/(dashboard)/team/constants';
import { acceptInvitationAction } from './actions';

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase.rpc('get_invitation_by_token', { p_token: params.token });
  const invitation = data?.[0];

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 text-center shadow-card">
        {!invitation || !invitation.valid ? (
          <>
            <h1 className="mb-2 text-xl font-semibold text-ink">الدعوة غير صالحة</h1>
            <p className="text-sm text-ink-muted">
              انتهت صلاحية هذه الدعوة أو أنها استُخدمت من قبل. يرجى طلب دعوة جديدة من مالك مساحة العمل.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-xl font-semibold text-ink">دعوة للانضمام إلى {invitation.workspace_name}</h1>
            <p className="mb-6 text-sm text-ink-muted">
              تمت دعوتك للانضمام بصفة &quot;{ROLE_LABELS[invitation.role]}&quot;.
            </p>

            {searchParams.error && (
              <div className="mb-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                تعذر قبول الدعوة. تأكد من تسجيل الدخول بنفس البريد المدعو ({invitation.email}).
              </div>
            )}

            {user ? (
              <form action={async () => acceptInvitationAction(params.token)}>
                <Button type="submit" size="lg" className="w-full">
                  قبول الدعوة
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-ink-faint">
                  سجّل الدخول أو أنشئ حسابًا بالبريد {invitation.email} لقبول الدعوة.
                </p>
                <a href={`/login?redirectTo=${encodeURIComponent(`/invite/${params.token}`)}`}>
                  <Button size="lg" className="w-full">تسجيل الدخول</Button>
                </a>
                <a href="/signup">
                  <Button size="lg" variant="secondary" className="w-full">إنشاء حساب جديد</Button>
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
