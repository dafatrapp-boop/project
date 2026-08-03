'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import type { LeadStatus } from '@/lib/leads/constants';
import { hasFeature } from '@/lib/plans/constants';

export async function createLeadAction(formData: FormData) {
  const { supabase, workspaceId } = await requireWorkspace();

  const fullName = String(formData.get('fullName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const email = String(formData.get('email') ?? '').trim() || null;
  const source = String(formData.get('source') ?? '').trim() || null;

  if (!fullName) {
    redirect('/leads?error=missing_name');
  }

    const { error } = await supabase.from('leads').insert({
    workspace_id: workspaceId,
    full_name: fullName,
    phone,
    email,
    source,
    status: 'new',
    campaign_id: null,
    assigned_to: null,
    notes: null,
  });


  if (error) {
    redirect('/leads?error=create_failed');
  }

  revalidatePath('/leads');
  redirect('/leads');
}

export async function updateLeadStatusAction(leadId: string, status: LeadStatus) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)
    .eq('workspace_id', workspaceId); // RLS also enforces this, kept explicit for clarity

  revalidatePath(`/leads/${leadId}`);
  if (error) {
    console.error('[leads] update/delete failed:', error);
  }
  revalidatePath('/leads');
}

export async function addNoteAction(leadId: string, formData: FormData) {
  const { supabase, user, workspaceId } = await requireWorkspace();

  const body = String(formData.get('body') ?? '').trim();
  if (!body) return;

  const { error } = await supabase.from('lead_notes').insert({
    lead_id: leadId,
    workspace_id: workspaceId,
    author_id: user.id,
    body,
  });
  if (error) {
    console.error('[lead_notes] update/delete failed:', error);
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function createFollowUpAction(leadId: string, formData: FormData) {
  const { supabase, workspaceId } = await requireWorkspace();

  // Already converted to a correct UTC instant client-side (see
  // follow-up-form.tsx) — the browser knows the visitor's real
  // timezone, this server action does not, so it trusts the ISO value
  // rather than re-parsing the original timezone-less datetime-local
  // string itself.
  const dueAtIso = String(formData.get('dueAtIso') ?? '');
  const note = String(formData.get('note') ?? '').trim() || null;
  if (!dueAtIso) return;

  const dueAt = new Date(dueAtIso);
  if (Number.isNaN(dueAt.getTime())) return;

  const { error } = await supabase.from('lead_follow_ups').insert({
    lead_id: leadId,
    workspace_id: workspaceId,
    due_at: dueAt.toISOString(),
    note,
    assigned_to: null,
    completed_at: null,
  });
  if (error) {
    console.error('[lead_follow_ups] insert failed:', error);
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function completeFollowUpAction(followUpId: string, leadId: string) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase
    .from('lead_follow_ups')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', followUpId)
    .eq('workspace_id', workspaceId); // RLS also enforces this; kept explicit for consistency

  revalidatePath(`/leads/${leadId}`);
  if (error) {
    console.error('[lead_follow_ups] update/delete failed:', error);
  }
}

export async function updateLeadTagsAction(leadId: string, tags: string[]) {
  const { supabase, workspaceId, plan } = await requireWorkspace();

  if (!hasFeature(plan, 'tags')) return;

  const cleaned = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))).slice(0, 10);

  const { error } = await supabase
    .from('leads')
    .update({ tags: cleaned })
    .eq('id', leadId)
    .eq('workspace_id', workspaceId);
  if (error) {
    console.error('[leads] update/delete failed:', error);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
}

export async function deleteLeadAction(leadId: string) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/leads?error=not_authorized');
  }

  const { error } = await supabase.from('leads').delete().eq('id', leadId).eq('workspace_id', workspaceId);
  if (error) {
    console.error('[leads] update/delete failed:', error);
  }

  revalidatePath('/leads');
  redirect('/leads');
}

export async function checkDuplicateLeadAction(phone: string, email: string) {
  const { supabase, workspaceId, plan } = await requireWorkspace();

  if (!hasFeature(plan, 'duplicateDetection')) {
    return null;
  }

  const { data } = await supabase.rpc('find_duplicate_lead', {
    p_workspace_id: workspaceId,
    p_phone: phone || null,
    p_email: email || null,
  });

  return data?.[0] ?? null;
}
