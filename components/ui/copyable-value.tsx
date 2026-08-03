'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { IconButton } from './button';

/**
 * A read-only value (a URL, usually) with a one-click copy button.
 * Used anywhere a generated link needs to be handed to the user to
 * paste elsewhere (team invite links, campaign UTM tracking links) —
 * a single component so both places share the same clipboard-fallback
 * behavior instead of re-implementing it.
 */
export function CopyableValue({ value, dir = 'ltr' }: { value: string; dir?: 'ltr' | 'rtl' }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // navigator.clipboard can be unavailable (very old browser, or a
      // non-secure context) — fall back to the classic selection+copy
      // trick so the button still works instead of silently failing.
      const el = document.createElement('textarea');
      el.value = value;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      try {
        document.execCommand('copy');
      } catch {
        // Nothing more we can do — the user can still select the text manually.
      }
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
      <p dir={dir} className="min-w-0 flex-1 truncate text-body-sm text-ink" title={value}>
        {value}
      </p>
      <IconButton
        type="button"
        aria-label="نسخ"
        size="sm"
        variant={copied ? 'primary' : 'secondary'}
        onClick={handleCopy}
        title="نسخ"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </IconButton>
    </div>
  );
}
