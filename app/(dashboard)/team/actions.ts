'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { PLAN_LIMITS, isUnderLimit, type Plan } from '@/lib/plans/constants';
import { sendEmail } from '@/lib/email/send';
import { getAppBaseUrl } from '@/lib/site-url';
import type { MemberRole } from './constants';

export async function inviteMemberAction(formData: FormData) {
  const { supabase, user, workspaceId, role, plan, name } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/team?error=not_authorized');
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const invitedRole = String(formData.get('role') ?? 'agent') as MemberRole;

  if (!email) {
    redirect('/team?error=missing_email');
  }

  // Ownership must never be handed out through the generic invite flow,
  // and only the owner may create new admins — otherwise an admin could
  // invite themselves (or an accomplice) a way into full workspace
  // control. The DB also enforces this (see 0021_team_role_hardening.sql)
  // but we check here too so the user gets a clear error instead of a
  // raw Postgres exception.
  if (invitedRole === 'owner') {
    redirect('/team?error=cannot_invite_as_owner');
  }
  if (invitedRole === 'admin' && role !== 'owner') {
    redirect('/team?error=only_owner_can_invite_admin');
  }

  const { count: memberCount } = await supabase
    .from('workspace_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  const limit = PLAN_LIMITS[plan].maxTeamMembers;
  if (!isUnderLimit(memberCount ?? 0, limit)) {
    redirect('/team?error=plan_limit_reached');
  }

  const { data: invitation, error } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: workspaceId,
      email,
      role: invitedRole,
      invited_by: user.id,
    })
    .select('token')
    .single();

  if (error) {
    console.error('[team.invite] insert workspace_invitations failed:', error);
    redirect('/team?error=invite_failed');
  }

  // Best-effort email (migration-free — Resend, gaps-checklist 4.4).
  // The invite is fully usable via the shareable link either way (see
  // the Team page), so a failed/unconfigured send never blocks the
  // invite itself — it's a convenience on top of the existing flow,
  // not a replacement for it.
  if (invitation?.token) {
    const inviteUrl = `${getAppBaseUrl()}/invite/${invitation.token}`;
    await sendEmail({
      to: email,
      subject: `دعوة للانضمام إلى ${name || 'مساحة العمل'} على SocialSales OS`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; text-align: right;">
          <p>تمت دعوتك للانضمام إلى فريق "${name || 'مساحة العمل'}" على SocialSales OS.</p>
          <p><a href="${inviteUrl}">اضغط هنا لقبول الدعوة</a></p>
          <p style="color:#888; font-size: 12px;">إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة.</p>
        </div>
      `,
    });
  }

  revalidatePath('/team');
  redirect('/team?success=invited');
}

export async function cancelInvitationAction(invitationId: string) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase
    .from('workspace_invitations')
    .delete()
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId);
  if (error) {
    console.error('[workspace_invitations] update/delete failed:', error);
  }

  revalidatePath('/team');
}

export async function updateMemberRoleAction(memberUserId: string, newRole: MemberRole) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/team?error=not_authorized');
  }

  // Ownership can only ever be assigned once, at workspace creation
  // (handle_new_workspace) — this action must never be able to grant
  // it or take it away. Without this check, any admin could promote
  // themselves to owner, or demote the real owner, and take over the
  // workspace's billing and membership. Enforced again at the DB level
  // as the real boundary (0021_team_role_hardening.sql); this is the
  // app-layer copy so the UI gets a clean error instead of a raw
  // Postgres exception.
  if (newRole === 'owner') {
    redirect('/team?error=cannot_grant_owner_role');
  }

  const { data: target } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberUserId)
    .maybeSingle();

  if (target?.role === 'owner') {
    redirect('/team?error=cannot_change_owner_role');
  }

  const { error } = await supabase
    .from('workspace_members')
    .update({ role: newRole })
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberUserId);
  if (error) {
    console.error('[workspace_members] update/delete failed:', error);
  }

  revalidatePath('/team');
}

export async function removeMemberAction(memberUserId: string) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/team?error=not_authorized');
  }

  // Same reasoning as updateMemberRoleAction: removing the owner row
  // would leave the workspace ownerless (or let an admin engineer that
  // as a takeover step). Leaving/transferring ownership needs its own
  // explicit, deliberate flow — not implemented yet, so block it here.
  const { data: target } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberUserId)
    .maybeSingle();

  if (target?.role === 'owner') {
    redirect('/team?error=cannot_remove_owner');
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberUserId);
  if (error) {
    console.error('[workspace_members] update/delete failed:', error);
  }

  revalidatePath('/team');
}

/**
 * Sets the workspace's plan directly. There is no payment provider
 * wired up yet (see CHECKLIST.md / .env.example — STRIPE_SECRET_KEY is
 * a placeholder), so this exists as an honest manual/testing control,
 * not a real checkout flow. It is clearly labeled as such in the UI.
 */
export async function setPlanForTestingAction(plan: Plan) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner') {
    redirect('/team?error=not_authorized');
  }

  const { error } = await supabase.from('workspaces').update({ plan }).eq('id', workspaceId);
  if (error) {
    console.error('[workspaces] update/delete failed:', error);
  }
  revalidatePath('/team');
}
