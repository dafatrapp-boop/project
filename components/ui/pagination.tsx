import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  hasMore: boolean;
  /** Current search params so filters (q/status/tag/...) survive page changes. */
  searchParams: Record<string, string | undefined>;
  /** Base path of the current page, e.g. "/leads". */
  basePath: string;
  /** Query param name to bump — lets one page host more than one paginated list. */
  paramName?: string;
}

function buildHref(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  page: number,
  paramName: string
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === paramName) continue;
    if (value) params.set(key, value);
  }
  if (page > 1) params.set(paramName, String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Prev/Next pagination control. Deliberately not page-number based —
 * that would require a COUNT(*) over the whole table on every render,
 * which is its own performance trap on large tenants. The server query
 * feeding this fetches one extra row to determine `hasMore` instead.
 */
export function Pagination({ page, hasMore, searchParams, basePath, paramName = 'page' }: PaginationProps) {
  if (page === 1 && !hasMore) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-1" dir="rtl">
      <span className="text-body-sm text-ink-faint">صفحة {page}</span>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <Button variant="secondary" size="sm" disabled>
            <ChevronRight size={15} />
            السابق
          </Button>
        ) : (
          <Link href={buildHref(basePath, searchParams, page - 1, paramName)}>
            <Button variant="secondary" size="sm">
              <ChevronRight size={15} />
              السابق
            </Button>
          </Link>
        )}
        {!hasMore ? (
          <Button variant="secondary" size="sm" disabled>
            التالي
            <ChevronLeft size={15} />
          </Button>
        ) : (
          <Link href={buildHref(basePath, searchParams, page + 1, paramName)}>
            <Button variant="secondary" size="sm">
              التالي
              <ChevronLeft size={15} />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
