'use server';

import { revalidatePath } from 'next/cache';
import { requireWorkspace } from '@/lib/workspace';
import type { AutomationRuleType } from '@/lib/automation/constants';

export async function upsertAutomationRuleAction(
  ruleType: AutomationRuleType,
  config: Record<string, unknown>,
  existingId?: string,
  enabled = true
) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') return;

  if (existingId) {
    const { error } = await supabase
      .from('automation_rules')
      .update({ config })
      .eq('id', existingId)
      .eq('workspace_id', workspaceId);
    if (error) {
      console.error('[automation_rules] update/delete failed:', error);
    }
  } else {
    const { error } = await supabase.from('automation_rules').insert({
      workspace_id: workspaceId,
      rule_type: ruleType,
      config,
      enabled,
    });
    if (error) {
      console.error('[automation_rules] update/delete failed:', error);
    }
  }

  revalidatePath('/automations');
}

export async function toggleAutomationRuleAction(ruleId: string, enabled: boolean) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') return;

  const { error } = await supabase
    .from('automation_rules')
    .update({ enabled })
    .eq('id', ruleId)
    .eq('workspace_id', workspaceId);
  if (error) {
    console.error('[automation_rules] update/delete failed:', error);
  }

  revalidatePath('/automations');
}

export async function deleteAutomationRuleAction(ruleId: string) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') return;

  const { error } = await supabase.from('automation_rules').delete().eq('id', ruleId).eq('workspace_id', workspaceId);
  if (error) {
    console.error('[automation_rules] update/delete failed:', error);
  }

  revalidatePath('/automations');
}

/** Called opportunistically from page loads (dashboard/leads) — see
 * run_workspace_automations() in 0019_automation.sql for why this is a
 * plain RPC call rather than a real background job. */
export async function runAutomationsAction(workspaceId: string) {
  const { supabase } = await requireWorkspace();
  const { error } = await supabase.rpc('run_workspace_automations', { p_workspace_id: workspaceId });
  if (error) {
    console.error('[run_workspace_automations] rpc failed:', error);
  }
}
