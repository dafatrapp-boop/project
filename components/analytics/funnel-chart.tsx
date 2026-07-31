export interface FunnelStage {
  label: string;
  value: number;
}

/**
 * Simple proportional-width bar funnel — no charting library needed
 * for this shape. Each stage shows its count and conversion rate
 * relative to the very first stage (not the previous one), which is
 * the number that actually matters for "how much of my traffic
 * becomes a sale."
 */
export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = stages[0]?.value || 1;

  return (
    <div className="flex flex-col gap-3">
      {stages.map((stage, i) => {
        const widthPct = max > 0 ? Math.max((stage.value / max) * 100, stage.value > 0 ? 4 : 0) : 0;
        const rateOfFirst = max > 0 ? ((stage.value / max) * 100).toFixed(1) : '0.0';
        return (
          <div key={stage.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink">{stage.label}</span>
              <span className="text-ink-muted">
                {stage.value.toLocaleString('ar-SA')}
                {i > 0 && <span className="text-ink-faint"> ({rateOfFirst}%)</span>}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-subtle">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${widthPct}%`, opacity: 1 - i * 0.15 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
