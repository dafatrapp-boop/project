'use client';

import { useState, useTransition, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { updateLeadTagsAction } from '../actions';

const PRESET_TAGS = ['VIP', 'ساخن', 'بارد'];

const TAG_COLOR: Record<string, string> = {
  VIP: 'bg-warning/10 text-warning',
  'ساخن': 'bg-danger/10 text-danger',
  'بارد': 'bg-brand-50 text-brand-700',
};

export function TagEditor({ leadId, initialTags }: { leadId: string; initialTags: string[] }) {
  const [tags, setTags] = useState(initialTags);
  const [input, setInput] = useState('');
  const [pending, startTransition] = useTransition();

  function save(next: string[]) {
    setTags(next);
    startTransition(() => updateLeadTagsAction(leadId, next));
  }

  function addTag(tag: string) {
    const clean = tag.trim();
    if (!clean || tags.includes(clean)) return;
    save([...tags, clean]);
    setInput('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              TAG_COLOR[tag] ?? 'bg-surface-subtle text-ink-muted'
            }`}
          >
            {tag}
            <button
              onClick={() => save(tags.filter((t) => t !== tag))}
              disabled={pending}
              aria-label={`إزالة وسم ${tag}`}
              className="hover:opacity-70"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="أضف وسمًا واضغط Enter"
          className="h-7 min-w-32 flex-1 rounded-md border border-border bg-surface px-2 text-xs text-ink placeholder:text-ink-faint"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
          <button
            key={tag}
            onClick={() => addTag(tag)}
            className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-ink-faint hover:border-brand-500 hover:text-brand-600"
          >
            + {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
