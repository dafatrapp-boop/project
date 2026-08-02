/**
 * Shared by every place in the app that inserts a `landing_pages` row
 * with an auto-generated slug: the dashboard's create/duplicate
 * actions AND the onboarding flow's auto-created first page.
 *
 * `slug` is unique across the whole table, not just per-workspace
 * (migration 0022 — closes the cross-tenant slug collision bug from
 * the architecture review, where the public /p/[slug] route assumed
 * at most one matching row system-wide but the DB only enforced
 * uniqueness per workspace). A collision on the random suffix is rare
 * but no longer impossible with many signups, so every insertion
 * point needs to retry with a fresh suffix instead of letting the raw
 * unique-violation bubble up as a hard failure — which is exactly
 * what broke new-account creation until this was centralized here.
 */

export function slugify(input: string) {
  const ascii = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii || 'page';
}

export function randomSlugSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

export const POSTGRES_UNIQUE_VIOLATION = '23505';

export async function insertWithUniqueSlug<T>(
  attemptInsert: (slug: string) => PromiseLike<{ data: T | null; error: { code?: string; message: string } | null }>,
  baseSlug: string,
  maxAttempts = 5
): Promise<{ data: T | null; error: { code?: string; message: string } | null }> {
  let lastResult: { data: T | null; error: { code?: string; message: string } | null } = {
    data: null,
    error: { message: 'unreachable' },
  };
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = `${baseSlug}-${randomSlugSuffix()}`;
    lastResult = await attemptInsert(slug);
    if (!lastResult.error || lastResult.error.code !== POSTGRES_UNIQUE_VIOLATION) {
      return lastResult;
    }
  }
  return lastResult;
}
