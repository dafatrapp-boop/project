'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
    <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
      <h3 className="mb-1 text-sm font-semibold text-ink">{AUTOMATION_RULE_LABELS.campaign_tag}</h3>
      <p className="mb-4 text-xs text-ink-muted">{AUTOMATION_RULE_DESCRIPTIONS.campaign_tag}</p>

      {rules.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <span>
                {campaignName(r.config.campaign_id)} <span className="text-ink-faint">←</span> <Badge tone="neutral">{r.config.tag}</Badge>
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    defaultChecked={r.enabled}
                    onChange={(e) => startTransition(() => toggleAutomationRuleAction(r.id, e.target.checked))}
                    className="h-3.5 w-3.5"
                  />
                  مفعّلة
                </label>
                <button
                  onClick={() => startTransition(() => deleteAutomationRuleAction(r.id))}
                  className="rounded p-1 text-danger hover:bg-danger/10"
                  aria-label="حذف"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {campaigns.length === 0 ? (
        <p className="text-xs text-ink-faint">أنشئ حملة أولًا لتتمكن من ربطها بوسم تلقائي.</p>
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
    </div>
  );
}
