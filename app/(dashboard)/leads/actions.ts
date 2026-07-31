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

  await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)
    .eq('workspace_id', workspaceId); // RLS also enforces this, kept explicit for clarity

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
}

export async function addNoteAction(leadId: string, formData: FormData) {
  const { supabase, user, workspaceId } = await requireWorkspace();

  const body = String(formData.get('body') ?? '').trim();
  if (!body) return;

  await supabase.from('lead_notes').insert({
    lead_id: leadId,
    workspace_id: workspaceId,
    author_id: user.id,
    body,
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function createFollowUpAction(leadId: string, formData: FormData) {
  const { supabase, workspaceId } = await requireWorkspace();

  const dueAt = String(formData.get('dueAt') ?? '');
  const note = String(formData.get('note') ?? '').trim() || null;
  if (!dueAt) return;

    await supabase.from('lead_follow_ups').insert({
    lead_id: leadId,
    workspace_id: workspaceId,
    due_at: new Date(dueAt).toISOString(),
    note,
    assigned_to: null,
    completed_at: null,
  });


  revalidatePath(`/leads/${leadId}`);
}

export async function completeFollowUpAction(followUpId: string, leadId: string) {
  const { supabase, workspaceId } = await requireWorkspace();

  await supabase
    .from('lead_follow_ups')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', followUpId)
    .eq('workspace_id', workspaceId); // RLS also enforces this; kept explicit for consistency

  revalidatePath(`/leads/${leadId}`);
}

export async function updateLeadTagsAction(leadId: string, tags: string[]) {
  const { supabase, workspaceId, plan } = await requireWorkspace();

  if (!hasFeature(plan, 'tags')) return;

  const cleaned = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))).slice(0, 10);

  await supabase
    .from('leads')
    .update({ tags: cleaned })
    .eq('id', leadId)
    .eq('workspace_id', workspaceId);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
}

export async function deleteLeadAction(leadId: string) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/leads?error=not_authorized');
  }

  await supabase.from('leads').delete().eq('id', leadId).eq('workspace_id', workspaceId);

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
