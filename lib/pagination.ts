/**
 * Shared range-based pagination helper for server-rendered list pages.
 *
 * Every list page in the app used to run `.limit(N)` with no offset,
 * which silently hides everything past row N once a workspace grows
 * past that count — the single highest-priority gap flagged by the
 * architecture review. This computes a `[from, to]` pair for Supabase's
 * `.range()` and fetches one extra row so the UI can show a "next page"
 * control without running a separate (expensive) COUNT(*) query.
 */
export const DEFAULT_PAGE_SIZE = 50;

export function parsePageParam(value: string | undefined): number {
  const page = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function getPageRange(page: number, pageSize: number = DEFAULT_PAGE_SIZE): [number, number] {
  const from = (page - 1) * pageSize;
  // Fetch one extra row past the page size so callers can detect
  // "is there a next page" without a separate count query.
  const to = from + pageSize; // inclusive index of the extra lookahead row
  return [from, to];
}

/** Split a `pageSize + 1`-row result into the page to render + whether more exist. */
export function splitPage<T>(rows: T[], pageSize: number = DEFAULT_PAGE_SIZE): { rows: T[]; hasMore: boolean } {
  if (rows.length > pageSize) {
    return { rows: rows.slice(0, pageSize), hasMore: true };
  }
  return { rows, hasMore: false };
}
