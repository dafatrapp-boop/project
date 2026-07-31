import Link from 'next/link';
import { ShieldAlert, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthAlert } from '@/components/auth/auth-alert';
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
    <AuthShell
      panelTitle="اعمل مع فريقك على مساحة عمل واحدة"
      panelSubtitle="شارك زملاءك إدارة المحادثات، الطلبات، والصفحات بصلاحيات مخصصة لكل عضو."
    >
      <AuthCard align="center">
        {!invitation || !invitation.valid ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger">
              <ShieldAlert size={26} />
            </div>
            <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.01em] text-ink">الدعوة غير صالحة</h1>
            <p className="text-[15px] leading-relaxed text-ink-muted">
              انتهت صلاحية هذه الدعوة أو أنها استُخدمت من قبل. يرجى طلب دعوة جديدة من مالك مساحة العمل.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <UserPlus size={26} />
            </div>
            <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.01em] text-ink">
              دعوة للانضمام إلى {invitation.workspace_name}
            </h1>
            <p className="mb-7 text-[15px] leading-relaxed text-ink-muted">
              تمت دعوتك للانضمام بصفة &quot;{ROLE_LABELS[invitation.role]}&quot;.
            </p>

            {searchParams.error && (
              <AuthAlert tone="danger">
                تعذر قبول الدعوة. تأكد من تسجيل الدخول بنفس البريد المدعو ({invitation.email}).
              </AuthAlert>
            )}

            {user ? (
              <form action={async () => acceptInvitationAction(params.token)}>
                <Button type="submit" size="lg" className="w-full">
                  قبول الدعوة
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-2.5">
                <p className="mb-1 text-xs text-ink-faint">
                  سجّل الدخول أو أنشئ حسابًا بالبريد {invitation.email} لقبول الدعوة.
                </p>
                <Link href={`/login?redirectTo=${encodeURIComponent(`/invite/${params.token}`)}`}>
                  <Button size="lg" className="w-full">تسجيل الدخول</Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="w-full">إنشاء حساب جديد</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
}
