'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { upsertAutomationRuleAction, toggleAutomationRuleAction } from './actions';
import { AUTOMATION_RULE_LABELS, AUTOMATION_RULE_DESCRIPTIONS, type AutomationRuleType } from '@/lib/automation/constants';

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

  function save(nextEnabled: boolean) {
    startTransition(async () => {
      if (existingId) {
        await upsertAutomationRuleAction(ruleType, { [configKey]: value }, existingId);
        if (nextEnabled !== enabled) await toggleAutomationRuleAction(existingId, nextEnabled);
      } else {
        await upsertAutomationRuleAction(ruleType, { [configKey]: value }, undefined, nextEnabled);
      }
      show('تم حفظ القاعدة', 'success');
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-subtle">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{AUTOMATION_RULE_LABELS[ruleType]}</h3>
        <Badge tone={isEnabled ? 'success' : 'neutral'}>{isEnabled ? 'مفعّلة' : 'معطّلة'}</Badge>
      </div>
      <p className="mb-4 text-xs text-ink-muted">{AUTOMATION_RULE_DESCRIPTIONS[ruleType]}</p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          تفعيل
        </label>
        <Input
          type="number"
          min={1}
          label={`${configLabel} (${configUnit})`}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-32"
        />
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => save(isEnabled)}>
          حفظ
        </Button>
      </div>
    </div>
  );
}
