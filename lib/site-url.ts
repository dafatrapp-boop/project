import { headers } from 'next/headers';

/**
 * Absolute base URL for building links meant to be shared outside the
 * app (invite links, etc.) — a relative path like `/invite/<token>` is
 * meaningless once copied into WhatsApp or an email. Prefers the
 * explicit env var (correct behind a proxy/CDN where the Host header
 * may not match the public domain); falls back to the request's own
 * host so this still works out of the box in local dev/preview
 * environments where the env var isn't set.
 */
export function getAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
