'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Phase 2: restyled as a segmented control (pill background sliding
 * behind the active tab) instead of a bottom-border underline — reads
 * as more "premium SaaS" and is more legible against the new elevated
 * card tier. API unchanged (tabs, defaultTab), so every existing call
 * site (currently: landing page editor) picks this up automatically.
 */
export function Tabs({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  return (
    <div>
      <div role="tablist" className="inline-flex gap-1 rounded-lg bg-surface-sunken p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-body-sm font-medium transition-all duration-fast ease-out',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20',
              active === tab.id
                ? 'bg-surface text-ink shadow-subtle'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-5">{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
