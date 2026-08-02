import { requireWorkspace } from '@/lib/workspace';
import { getAppBaseUrl } from '@/lib/site-url';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { CopyableValue } from '@/components/ui/copyable-value';
import { PLAN_LABELS, PLAN_LIMITS, type Plan } from '@/lib/plans/constants';
import { ROLE_LABELS } from './constants';
import { MemberRow } from './member-row';
import { InviteForm } from './invite-form';
import { CancelInvitationButton } from './cancel-invitation-button';
import { PlanTestingSelector } from './plan-testing-selector';
import { UpgradeButtons } from './upgrade-buttons';
import { isStripeConfigured } from '@/lib/stripe/client';
import { WorkspaceTabs } from '@/components/layout/workspace-tabs';

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: 'يلزم أن تكون مالكًا أو مشرفًا للقيام بهذا الإجراء.',
  missing_email: 'يرجى إدخال بريد إلكتروني صالح.',
  plan_limit_reached: 'وصلت للحد الأقصى لعدد أعضاء الفريق في باقتك الحالية.',
  invite_failed: 'تعذر إرسال الدعوة. تحقق من عدم وجود دعوة سابقة لنفس البريد.',
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const { supabase, user, workspaceId, role } = await requireWorkspace();
  const isAdmin = role === 'owner' || role === 'admin';

  const [{ data: members }, { data: invitations }, { data: workspace }, { count: pagesCount }, { count: campaignsCount }] =
    await Promise.all([
      supabase.from('workspace_members').select('user_id, role').eq('workspace_id', workspaceId),
      isAdmin
        ? supabase
            .from('workspace_invitations')
            .select('id, email, role, expires_at, accepted_at, token')
            .eq('workspace_id', workspaceId)
            .is('accepted_at', null)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase.from('workspaces').select('plan, stripe_customer_id').eq('id', workspaceId).single(),
      supabase
        .from('landing_pages')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      supabase
        .from('campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
    ]);

  // workspace_members and profiles both reference auth.users independently
  // (no direct FK between the two tables), so PostgREST can't embed this
  // join automatically — fetch profiles separately and merge here instead.
  const memberIds = (members ?? []).map((m) => m.user_id);
  const { data: memberProfiles } =
    memberIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', memberIds)
      : { data: [] };
  const profileById = new Map((memberProfiles ?? []).map((p) => [p.id, p.full_name]));

  const plan = (workspace?.plan ?? 'free') as Plan;
  const stripeConfigured = isStripeConfigured();
  const stripeCustomerId = workspace?.stripe_customer_id ?? null;
  const limits = PLAN_LIMITS[plan];
  const pendingInvites = (invitations ?? []).filter((i) => new Date(i.expires_at) > new Date());
  const baseUrl = getAppBaseUrl();

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceTabs />
      <PageHeader title="الفريق والباقة" description="إدارة أعضاء الفريق وصلاحياتهم، ومتابعة حدود باقتك." />

      {searchParams.error && (
        <div className="rounded-md border border-danger/30 bg-danger-50 px-3 py-2 text-body-sm text-danger">
          {ERROR_MESSAGES[searchParams.error] ?? 'حدث خطأ. حاول مرة أخرى.'}
        </div>
      )}
      {searchParams.success === 'invited' && (
        <div className="rounded-md border border-success/30 bg-success-50 px-3 py-2 text-body-sm text-success">
          <p className="mb-2">
            تم إنشاء الدعوة. لا يوجد إرسال بريد تلقائي بعد — انسخ الرابط التالي وشاركه مع الشخص المدعو:
          </p>
          {pendingInvites[0] && (
            <CopyableValue value={`${baseUrl}/invite/${pendingInvites[0].token}`} />
          )}
        </div>
      )}

      {/* Plan section */}
      <Card>
        <CardHeader title="الباقة الحالية" action={<Badge tone="brand">{PLAN_LABELS[plan]}</Badge>} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <UsageRow label="صفحات الهبوط" used={pagesCount ?? 0} limit={limits.maxLandingPages} />
          <UsageRow label="أعضاء الفريق" used={(members ?? []).length} limit={limits.maxTeamMembers} />
          <UsageRow label="الحملات" used={campaignsCount ?? 0} limit={limits.maxCampaigns} />
        </div>

        {role === 'owner' && (
          <div className="mt-4 border-t border-border pt-4">
            {stripeConfigured ? (
              <UpgradeButtons hasStripeSubscription={Boolean(stripeCustomerId)} currentPlan={plan} />
            ) : (
              <>
                <p className="mb-2 text-caption text-ink-faint">
                  لا يوجد نظام دفع فعلي متصل بعد (Stripe) — هذا محدد اختباري يدوي فقط لتجربة حدود كل باقة.
                  أضف مفاتيح Stripe في .env لتفعيل الدفع الحقيقي (راجع .env.example).
                </p>
                <PlanTestingSelector currentPlan={plan} />
              </>
            )}
          </div>
        )}
      </Card>

      {/* Members */}
      <Card>
        <CardHeader
          title="أعضاء الفريق"
          description="المالك والمشرف يمكنهما إدارة الفريق والإعدادات والباقة؛ موظف المبيعات يستخدم النظام يوميًا دون الوصول لهذه الصفحة."
        />
        <div className="flex flex-col gap-2">
          {(members ?? []).map((m) => (
            <MemberRow
              key={m.user_id}
              userId={m.user_id}
              name={profileById.get(m.user_id) ?? 'بدون اسم'}
              role={m.role}
              isSelf={m.user_id === user.id}
            />
          ))}
        </div>
      </Card>

      {/* Invitations (admins only) */}
      {isAdmin && (
        <Card>
          <CardHeader title="دعوة عضو جديد" />
          <InviteForm />

          {pendingInvites.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="mb-2 text-caption font-medium text-ink-muted">دعوات قيد الانتظار</h3>
              <div className="flex flex-col gap-2">
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex flex-col gap-2 rounded-md bg-surface-subtle p-2 text-body-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-ink">
                        {inv.email} · {ROLE_LABELS[inv.role]}
                      </p>
                      <div className="mt-1.5">
                        <CopyableValue value={`${baseUrl}/invite/${inv.token}`} />
                      </div>
                    </div>
                    <CancelInvitationButton invitationId={inv.id} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = limit === -1;
  const overLimit = !isUnlimited && used >= limit;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  return (
    <div className="rounded-md bg-surface-subtle p-3">
      <p className="text-caption text-ink-muted">{label}</p>
      <p className={`mt-1 text-body-sm font-medium ${overLimit ? 'text-danger' : 'text-ink'}`}>
        {used} / {isUnlimited ? '∞' : limit}
      </p>
      {!isUnlimited && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-[width] duration-slow ease-out ${overLimit ? 'bg-danger' : 'bg-brand-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
