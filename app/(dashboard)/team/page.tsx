import { requireWorkspace } from '@/lib/workspace';
import { Badge } from '@/components/ui/badge';
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

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceTabs />
      <div>
        <h1 className="text-xl font-semibold text-ink">الفريق والباقة</h1>
        <p className="text-sm text-ink-muted">إدارة أعضاء الفريق وصلاحياتهم، ومتابعة حدود باقتك.</p>
      </div>

      {searchParams.error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {ERROR_MESSAGES[searchParams.error] ?? 'حدث خطأ. حاول مرة أخرى.'}
        </div>
      )}
      {searchParams.success === 'invited' && (
        <div className="rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
          تم إنشاء الدعوة. شارك رابط القبول مع الشخص المدعو (لا يوجد إرسال بريد تلقائي بعد).
        </div>
      )}

      {/* Plan section */}
      <section className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">الباقة الحالية</h2>
          <Badge tone="brand">{PLAN_LABELS[plan]}</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <UsageRow
            label="صفحات الهبوط"
            used={pagesCount ?? 0}
            limit={limits.maxLandingPages}
          />
          <UsageRow label="أعضاء الفريق" used={(members ?? []).length} limit={limits.maxTeamMembers} />
          <UsageRow label="الحملات" used={campaignsCount ?? 0} limit={limits.maxCampaigns} />
        </div>

        {role === 'owner' && (
          <div className="mt-4 border-t border-border pt-4">
            {stripeConfigured ? (
              <UpgradeButtons hasStripeSubscription={Boolean(stripeCustomerId)} />
            ) : (
              <>
                <p className="mb-2 text-xs text-ink-faint">
                  لا يوجد نظام دفع فعلي متصل بعد (Stripe) — هذا محدد اختباري يدوي فقط لتجربة حدود كل باقة.
                  أضف مفاتيح Stripe في .env لتفعيل الدفع الحقيقي (راجع .env.example).
                </p>
                <PlanTestingSelector currentPlan={plan} />
              </>
            )}
          </div>
        )}
      </section>

      {/* Members */}
      <section className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
        <h2 className="mb-3 text-sm font-semibold text-ink">أعضاء الفريق</h2>
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
      </section>

      {/* Invitations (admins only) */}
      {isAdmin && (
        <section className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
          <h2 className="mb-3 text-sm font-semibold text-ink">دعوة عضو جديد</h2>
          <InviteForm />

          {pendingInvites.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-medium text-ink-muted">دعوات قيد الانتظار</h3>
              <div className="flex flex-col gap-2">
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-md bg-surface-subtle p-2 text-sm">
                    <div>
                      <p className="text-ink">
                        {inv.email} · {ROLE_LABELS[inv.role]}
                      </p>
                      <p className="text-xs text-ink-faint" dir="ltr">
                        /invite/{inv.token}
                      </p>
                    </div>
                    <CancelInvitationButton invitationId={inv.id} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = limit === -1;
  const overLimit = !isUnlimited && used >= limit;
  return (
    <div className="rounded-md bg-surface-subtle p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 font-medium ${overLimit ? 'text-danger' : 'text-ink'}`}>
        {used} / {isUnlimited ? '∞' : limit}
      </p>
    </div>
  );
}
