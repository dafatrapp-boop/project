import { PageHeader } from '@/components/ui/page-header';
import { requireWorkspace } from '@/lib/workspace';
import { RuleCard } from './rule-card';
import { CampaignTagRules } from './campaign-tag-rules';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { AUTOMATIONS_GUIDE } from '@/lib/guide/content';
import { defaultConfigFor } from '@/lib/automation/constants';

export default async function AutomationsPage() {
  const { supabase, workspaceId, user } = await requireWorkspace();

  const [{ data: rules }, { data: campaigns }] = await Promise.all([
    supabase.from('automation_rules').select('*').eq('workspace_id', workspaceId),
    supabase.from('campaigns').select('id, name').eq('workspace_id', workspaceId).order('name'),
  ]);

  const guideDismissed = await getGuideDismissed(supabase, user.id, 'automations');

  const staleRule = rules?.find((r) => r.rule_type === 'lead_stale_reminder');
  const followupRule = rules?.find((r) => r.rule_type === 'interested_followup');
  const inactivityRule = rules?.find((r) => r.rule_type === 'inactivity_flag');
  const campaignTagRules = (rules ?? []).filter((r) => r.rule_type === 'campaign_tag') as {
    id: string;
    enabled: boolean;
    config: { campaign_id?: string; tag?: string };
  }[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الأتمتة" description="قواعد جاهزة وبسيطة — فعّل ما يناسبك واضبط رقمه فقط." />

      <PageGuide
        guideKey="automations"
        title={AUTOMATIONS_GUIDE.title}
        steps={AUTOMATIONS_GUIDE.steps}
        initiallyDismissed={guideDismissed}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RuleCard
          ruleType="lead_stale_reminder"
          existingId={staleRule?.id}
          enabled={staleRule?.enabled ?? false}
          configKey="hours"
          configLabel="بعد"
          configUnit="ساعة"
          configValue={
            (staleRule?.config as { hours?: number })?.hours ?? (defaultConfigFor('lead_stale_reminder').hours as number)
          }
        />
        <RuleCard
          ruleType="interested_followup"
          existingId={followupRule?.id}
          enabled={followupRule?.enabled ?? false}
          configKey="days"
          configLabel="بعد"
          configUnit="يوم"
          configValue={
            (followupRule?.config as { days?: number })?.days ?? (defaultConfigFor('interested_followup').days as number)
          }
        />
        <RuleCard
          ruleType="inactivity_flag"
          existingId={inactivityRule?.id}
          enabled={inactivityRule?.enabled ?? false}
          configKey="days"
          configLabel="بعد"
          configUnit="يوم"
          configValue={
            (inactivityRule?.config as { days?: number })?.days ?? (defaultConfigFor('inactivity_flag').days as number)
          }
        />
        <CampaignTagRules rules={campaignTagRules} campaigns={campaigns ?? []} />
      </div>
    </div>
  );
}
