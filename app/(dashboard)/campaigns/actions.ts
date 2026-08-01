'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import type { CampaignPlatform, CampaignStatus } from '@/lib/campaigns/constants';
import { PLAN_LIMITS, isUnderLimit } from '@/lib/plans/constants';

function slugifyUtm(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || `campaign_${Date.now()}`
  );
}

export async function createCampaignAction(formData: FormData) {
  const { supabase, workspaceId, plan } = await requireWorkspace();

  const name = String(formData.get('name') ?? '').trim();
  const platform = String(formData.get('platform') ?? 'other') as CampaignPlatform;
  const landingPageId = String(formData.get('landingPageId') ?? '') || null;
  const budgetRaw = String(formData.get('budget') ?? '').trim();
  const startsAt = String(formData.get('startsAt') ?? '') || null;
  const endsAt = String(formData.get('endsAt') ?? '') || null;

  if (!name) {
    redirect('/campaigns/new?error=missing_name');
  }

  const { count: existingCount } = await supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  const limit = PLAN_LIMITS[plan].maxCampaigns;
  if (!isUnderLimit(existingCount ?? 0, limit)) {
    redirect('/campaigns/new?error=plan_limit_reached');
  }

  const utmCampaign = slugifyUtm(name);

  const { error } = await supabase.from('campaigns').insert({
    workspace_id: workspaceId,
    name,
    platform,
    utm_campaign: utmCampaign,
    landing_page_id: landingPageId,
    status: 'draft',
    budget: budgetRaw ? Number(budgetRaw) : null,
    starts_at: startsAt,
    ends_at: endsAt,
  });

  if (error) {
    // utm_campaign collisions are the most likely real-world failure
    // (unique per workspace) — surface a clear reason instead of a
    // generic error so the merchant knows to pick a different name.
    const reason = error.code === '23505' ? 'duplicate_name' : 'create_failed';
    redirect(`/campaigns/new?error=${reason}`);
  }

  revalidatePath('/campaigns');
  redirect('/campaigns');
}

export async function updateCampaignStatusAction(campaignId: string, status: CampaignStatus) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase
    .from('campaigns')
    .update({ status })
    .eq('id', campaignId)
    .eq('workspace_id', workspaceId);
  if (error) {
    console.error('[campaigns] update/delete failed:', error);
  }

  revalidatePath('/campaigns');
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function deleteCampaignAction(campaignId: string) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { error } = await supabase.from('campaigns').delete().eq('id', campaignId).eq('workspace_id', workspaceId);
  if (error) {
    console.error('[campaigns] update/delete failed:', error);
  }

  revalidatePath('/campaigns');
  redirect('/campaigns');
}
