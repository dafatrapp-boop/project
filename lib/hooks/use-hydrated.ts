'use client';

import { useEffect, useState } from 'react';

/**
 * True only after the component has mounted in the browser. Gate any
 * render output that depends on the runtime's own clock or timezone
 * (`Date.now()`, `toLocaleString`/`toLocaleDateString` without an
 * explicit `timeZone`) behind this — Next.js server-renders client
 * components too, using the SERVER's clock/timezone (UTC on Vercel),
 * so a value that depends on either one will genuinely differ from
 * what the same code produces in the visitor's own browser, which is
 * a real (not theoretical) hydration mismatch for any visitor not in
 * UTC — not just a rare midnight-boundary race.
 *
 * Effects only ever run after hydration commits, so the first client
 * render is always guaranteed to match the server-rendered HTML
 * exactly; the real value swaps in one frame later instead of ever
 * being wrong during the render React has to reconcile against.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
