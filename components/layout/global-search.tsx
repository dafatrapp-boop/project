'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, FileText, Megaphone, Loader2 } from 'lucide-react';
import type { SearchResult } from '@/app/api/search/route';

const TYPE_ICON = { lead: Users, landing_page: FileText, campaign: Megaphone };
const TYPE_LABEL = { lead: 'عميل محتمل', landing_page: 'صفحة هبوط', campaign: 'حملة' };

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against out-of-order responses: if query A's request is
  // still in flight when query B fires, and A's response happens to
  // land after B's, it would otherwise overwrite B's correct results
  // with stale ones. `cancelled` is a fresh local flag per effect run
  // (the standard pattern for this — see React's own docs on data
  // fetching in effects) — this run's own callback checks it before
  // touching state, so only the most recent request's response ever
  // actually applies.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    let cancelled = false;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!cancelled) setResults(data.results ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="بحث عن عميل، صفحة، أو حملة..."
          className="h-10 w-full rounded-md border border-border bg-surface-subtle ps-9 pe-3 text-sm text-ink placeholder:text-ink-faint focus-visible:border-brand-500 focus-visible:bg-surface"
        />
        {loading && <Loader2 size={14} className="absolute inset-y-0 end-3 my-auto animate-spin text-ink-faint" />}
      </div>

      {open && query.trim().length >= 2 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute start-0 z-50 mt-2 w-full min-w-[20rem] rounded-lg border border-border bg-surface shadow-card">
            {results.length === 0 && !loading ? (
              <p className="p-4 text-center text-sm text-ink-faint">لا توجد نتائج.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((r) => {
                  const Icon = TYPE_ICON[r.type];
                  return (
                    <li key={`${r.type}-${r.id}`}>
                      <button
                        onClick={() => {
                          setOpen(false);
                          setQuery('');
                          router.push(r.href);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm hover:bg-surface-subtle"
                      >
                        <Icon size={16} className="shrink-0 text-ink-faint" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-ink">{r.title}</p>
                          <p className="text-xs text-ink-faint">
                            {TYPE_LABEL[r.type]} {r.subtitle ? `· ${r.subtitle}` : ''}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
