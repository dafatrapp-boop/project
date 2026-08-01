'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Phase 2 — new primitive. Not wired into the header/sidebar yet
 * (that's a Phase 3/4 layout decision); this is the self-contained
 * building block. Persists to localStorage only — no account/profile
 * field, no Supabase write, purely a client-side presentation choice.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('ss-theme', next ? 'dark' : 'light');
    } catch {
      /* localStorage unavailable (private mode etc.) — theme just won't persist */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
      aria-pressed={dark}
      className={cn(
        'relative flex h-11 w-11 items-center justify-center rounded-md text-ink-muted transition-colors',
        'hover:bg-surface-subtle hover:text-ink',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20',
        className
      )}
    >
      <Sun size={19} className={cn('absolute transition-all duration-base ease-out', dark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100')} />
      <Moon size={19} className={cn('absolute transition-all duration-base ease-out', dark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0')} />
    </button>
  );
}
