import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Every request this client makes must never be cached by Next.js's
 * fetch Data Cache. `@supabase/ssr`/`@supabase/supabase-js` issue
 * plain `fetch()` calls under the hood, and Next.js 14's App Router
 * caches `fetch()` responses by default (keyed by URL — NOT by the
 * caller's session/Authorization header). Two different users' Server
 * Components/Actions can end up hitting the same Supabase REST
 * endpoint shape, and without this override Next can serve one
 * user's cached response to a completely different user — which is
 * what caused one account to briefly show another account's just-
 * entered workspace name. This forces every request through this
 * client to always hit Postgres fresh, tagged `no-store` explicitly
 * so it's also excluded from Vercel's Data Cache in production.
 */
function noStoreFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: 'no-store' });
}

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Uses the anon key + the caller's session cookie so that Postgres RLS
 * policies (auth.uid()) enforce tenant isolation — this client must
 * NEVER be given the service role key.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: noStoreFetch },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component with no write access;
            // session refresh is handled by middleware instead.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // See note above.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the SERVICE ROLE key.
 * Bypasses RLS entirely — only import this inside trusted server-only
 * code paths (e.g. Stripe webhooks, admin cron jobs). Never expose to
 * the client bundle and never call from user-triggered request paths
 * without manually re-checking authorization.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: { fetch: noStoreFetch },
      cookies: { get: () => undefined, set: () => {}, remove: () => {} },
    }
  );
}
