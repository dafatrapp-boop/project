'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Tag as TagIcon } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { upsertAutomationRuleAction, toggleAutomationRuleAction, deleteAutomationRuleAction } from './actions';
import { AUTOMATION_RULE_LABELS, AUTOMATION_RULE_DESCRIPTIONS } from '@/lib/automation/constants';

interface CampaignTagRule {
  id: string;
  enabled: boolean;
  config: { campaign_id?: string; tag?: string };
}

export function CampaignTagRules({
  rules,
  campaigns,
}: {
  rules: CampaignTagRule[];
  campaigns: { id: string; name: string }[];
}) {
  const [campaignId, setCampaignId] = useState('');
  const [tag, setTag] = useState('');
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  function campaignName(id?: string) {
    return campaigns.find((c) => c.id === id)?.name ?? '—';
  }

  function addRule() {
    if (!campaignId || !tag.trim()) return;
    startTransition(async () => {
      await upsertAutomationRuleAction('campaign_tag', { campaign_id: campaignId, tag: tag.trim() });
      setCampaignId('');
      setTag('');
      show('تمت إضافة القاعدة', 'success');
    });
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
          <TagIcon size={15} />
        </span>
        <h3 className="text-body-sm font-semibold text-ink">{AUTOMATION_RULE_LABELS.campaign_tag}</h3>
      </div>
      <p className="text-caption text-ink-muted">{AUTOMATION_RULE_DESCRIPTIONS.campaign_tag}</p>

      {rules.length > 0 && (
        <div className="flex flex-col gap-2">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-md bg-surface-subtle px-3 py-2 text-body-sm">
              <span className="flex items-center gap-1.5">
                {campaignName(r.config.campaign_id)}
                <span className="text-ink-faint">←</span>
                <Badge tone="neutral" size="sm">{r.config.tag}</Badge>
              </span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={r.enabled}
                  disabled={pending}
                  onChange={(next) => startTransition(() => toggleAutomationRuleAction(r.id, next))}
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="حذف القاعدة"
                  className="hover:bg-danger-50 hover:text-danger"
                  onClick={() => {
                    if (!window.confirm('هل تريد حذف قاعدة الوسم التلقائي هذه؟')) return;
                    startTransition(() => deleteAutomationRuleAction(r.id));
                  }}
                >
                  <Trash2 size={13} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {campaigns.length === 0 ? (
        <p className="text-caption text-ink-faint">أنشئ حملة أولًا لتتمكن من ربطها بوسم تلقائي.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <Select label="الحملة" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="min-w-[10rem]">
            <option value="">— اختر —</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Input label="الوسم" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="مثال: من_حملة_رمضان" className="w-40" />
          <Button size="sm" variant="secondary" disabled={pending} onClick={addRule}>
            <Plus size={14} /> إضافة
          </Button>
        </div>
      )}
    </Card>
  );
}
