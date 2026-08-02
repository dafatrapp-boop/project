'use client';

import { useState, useTransition } from 'react';
import { Zap, ArrowLeftCircle, Clock, UserCheck, AlertTriangle, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { upsertAutomationRuleAction, toggleAutomationRuleAction } from './actions';
import { AUTOMATION_RULE_LABELS, AUTOMATION_RULE_DESCRIPTIONS, type AutomationRuleType } from '@/lib/automation/constants';

const RULE_ICON: Record<AutomationRuleType, LucideIcon> = {
  lead_stale_reminder: Clock,
  interested_followup: UserCheck,
  campaign_tag: Zap,
  inactivity_flag: AlertTriangle,
};

/** Every description follows "إذا [الشرط]، [الإجراء]." — split once on
 * the Arabic comma so trigger and resulting action can be shown as two
 * distinct, icon-labeled lines instead of one running sentence. Falls
 * back to the full sentence if a description doesn't match the pattern. */
function splitTriggerAction(description: string): [string, string] | null {
  const idx = description.indexOf('،');
  if (idx === -1) return null;
  return [description.slice(0, idx).replace(/^إذا\s*/, ''), description.slice(idx + 1).trim()];
}

export function RuleCard({
  ruleType,
  existingId,
  enabled,
  configKey,
  configLabel,
  configValue,
  configUnit,
}: {
  ruleType: AutomationRuleType;
  existingId?: string;
  enabled: boolean;
  configKey: string;
  configLabel: string;
  configValue: number;
  configUnit: string;
}) {
  const [value, setValue] = useState(configValue);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  function persist(nextEnabled: boolean, nextValue: number) {
    startTransition(async () => {
      if (existingId) {
        await upsertAutomationRuleAction(ruleType, { [configKey]: nextValue }, existingId);
        if (nextEnabled !== enabled) await toggleAutomationRuleAction(existingId, nextEnabled);
      } else {
        await upsertAutomationRuleAction(ruleType, { [configKey]: nextValue }, undefined, nextEnabled);
      }
      show('تم حفظ القاعدة', 'success');
    });
  }

  // Toggling now takes effect immediately (Phase 4.3 fix — previously
  // a plain checkbox required a separate "Save" click before an
  // enable/disable actually applied, which read as broken). The Save
  // button below is only for the numeric threshold.
  function handleToggle(next: boolean) {
    setIsEnabled(next);
    persist(next, value);
  }

  const Icon = RULE_ICON[ruleType];
  const parts = splitTriggerAction(AUTOMATION_RULE_DESCRIPTIONS[ruleType]);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${isEnabled ? 'bg-brand-50 text-brand-600' : 'bg-surface-subtle text-ink-faint'}`}>
            <Icon size={15} />
          </span>
          <h3 className="text-body-sm font-semibold text-ink">{AUTOMATION_RULE_LABELS[ruleType]}</h3>
        </div>
        <Switch checked={isEnabled} onChange={handleToggle} disabled={pending} />
      </div>

      {parts ? (
        <div className="flex flex-col gap-1.5 rounded-md bg-surface-subtle p-3 text-caption">
          <p className="flex items-start gap-1.5 text-ink-muted">
            <Zap size={12} className="mt-0.5 shrink-0 text-warning" />
            <span><span className="font-medium text-ink">الشرط:</span> {parts[0]}</span>
          </p>
          <p className="flex items-start gap-1.5 text-ink-muted">
            <ArrowLeftCircle size={12} className="icon-flip mt-0.5 shrink-0 text-brand-500" />
            <span><span className="font-medium text-ink">الإجراء:</span> {parts[1]}</span>
          </p>
        </div>
      ) : (
        <p className="text-caption text-ink-muted">{AUTOMATION_RULE_DESCRIPTIONS[ruleType]}</p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
        <Input
          type="number"
          min={1}
          label={`${configLabel} (${configUnit})`}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-32"
        />
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => persist(isEnabled, value)}>
          حفظ
        </Button>
      </div>

      {!existingId && !isEnabled && (
        <Badge tone="neutral" size="sm" className="w-fit">لم تُفعَّل بعد</Badge>
      )}
    </Card>
  );
}
