'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { LEAD_STATUS_LABELS, type LeadStatus } from '@/lib/leads/constants';
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

  const noteTypeRaw = String(formData.get('noteType') ?? 'general');
  const noteType = (['general', 'call', 'meeting', 'email', 'whatsapp'].includes(noteTypeRaw)
    ? noteTypeRaw
    : 'general') as 'general' | 'call' | 'meeting' | 'email' | 'whatsapp';

  const { error } = await supabase.from('lead_notes').insert({
    lead_id: leadId,
    workspace_id: workspaceId,
    author_id: user.id,
    body,
    note_type: noteType,
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

/**
 * AI-drafted follow-up message (see lib/ai/client.ts) — free at every
 * tier: tries the free Gemini/Groq API if a key is configured, and
 * always falls back to a rule-based offline draft otherwise, so this
 * never returns nothing. Not saved anywhere; just returned to the
 * caller to review/edit/send.
 */
export async function suggestFollowUpMessageAction(
  leadId: string
): Promise<{ message: string; source: 'gemini' | 'groq' | 'offline' } | null> {
  const { supabase, workspaceId } = await requireWorkspace();
  const { suggestFollowUpMessage } = await import('@/lib/ai/client');

  const { data: lead } = await supabase
    .from('leads')
    .select('full_name, status, tags, created_at')
    .eq('id', leadId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  if (!lead) return null;

  const { data: notes } = await supabase
    .from('lead_notes')
    .select('body')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(3);

  const daysSinceCreated = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);

  return suggestFollowUpMessage({
    fullName: lead.full_name,
    status: lead.status,
    statusLabel: LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status,
    tags: lead.tags ?? [],
    recentNotes: (notes ?? []).map((n) => n.body),
    daysSinceCreated,
  });
}

/**
 * Attachments (migration 0035, product-gaps review ب.3) — records
 * metadata for a file already uploaded client-side to the private
 * `lead-attachments` Storage bucket (see lib/storage/lead-attachments.ts).
 */
export async function recordLeadAttachmentAction(
  leadId: string,
  file: { path: string; name: string; size: number; contentType: string }
) {
  const { supabase, workspaceId, user } = await requireWorkspace();

  const { error } = await supabase.from('lead_attachments').insert({
    lead_id: leadId,
    workspace_id: workspaceId,
    uploaded_by: user.id,
    file_path: file.path,
    file_name: file.name,
    file_size: file.size,
    content_type: file.contentType,
  });
  if (error) {
    console.error('[lead_attachments] insert failed:', error);
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function deleteLeadAttachmentAction(attachmentId: string, filePath: string) {
  const { supabase } = await requireWorkspace();

  await supabase.storage.from('lead-attachments').remove([filePath]);
  const { error } = await supabase.from('lead_attachments').delete().eq('id', attachmentId);
  if (error) {
    console.error('[lead_attachments] delete failed:', error);
  }

  revalidatePath('/leads');
}

/**
 * Custom fields (migration 0033, product-gaps review ب.1) — saves the
 * per-lead values for whatever fields the workspace has defined in
 * Settings. Stored as a single JSONB blob rather than one column per
 * field, since the set of fields is workspace-defined and changes
 * over time.
 */
export async function updateLeadCustomFieldsAction(leadId: string, values: Record<string, string>) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase
    .from('leads')
    .update({ custom_fields: values })
    .eq('id', leadId)
    .eq('workspace_id', workspaceId);
  if (error) {
    console.error('[leads] update custom fields failed:', error);
  }

  revalidatePath(`/leads/${leadId}`);
}

/**
 * Deal value (migration 0032, product-gaps review أ.2) — a plain
 * numeric estimate of what this lead is worth, shown on the lead
 * detail page and summed per-column on the Kanban board so a pipeline
 * total is finally visible somewhere.
 */
export async function updateLeadValueAction(leadId: string, value: number | null) {
  const { supabase, workspaceId } = await requireWorkspace();

  const cleaned = value === null || Number.isNaN(value) || value < 0 ? null : value;

  const { error } = await supabase
    .from('leads')
    .update({ estimated_value: cleaned })
    .eq('id', leadId)
    .eq('workspace_id', workspaceId);
  if (error) {
    console.error('[leads] update value failed:', error);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads/pipeline');
}

/**
 * Soft delete (migration 0031) — moves the lead to the Trash
 * (`/leads/trash`) instead of destroying it immediately. Accidental
 * deletion used to be unrecoverable the instant it happened; now it
 * can be restored for 30 days before the daily cleanup job purges it
 * permanently.
 */
export async function deleteLeadAction(leadId: string) {
  const { supabase, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') {
    redirect('/leads?error=not_authorized');
  }

  const { error } = await supabase.rpc('soft_delete_lead', { p_lead_id: leadId });
  if (error) {
    console.error('[leads] soft delete failed:', error);
  }

  revalidatePath('/leads');
  revalidatePath('/leads/trash');
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
