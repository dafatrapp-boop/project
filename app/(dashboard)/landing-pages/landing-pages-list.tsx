'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Copy, FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, type Column } from '@/components/ui/table';
import { duplicateLandingPageAction } from './actions';

interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  created_at: string;
}

/**
 * Phase 4.2 — client-side search + status filter. landing_pages has no
 * full-text search column (unlike leads' search_vector), and adding one
 * would mean a migration — out of scope for a UI-only phase. Workspaces
 * are plan-limited to a modest number of pages, so filtering the
 * already-fetched list in the browser is instant and doesn't need a
 * server round-trip.
 */
export function LandingPagesList({ pages }: { pages: PageRow[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | 'draft' | 'published'>('');

  const filtered = useMemo(() => {
    return pages.filter((p) => {
      if (status && p.status !== status) return false;
      if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [pages, q, status]);

  const columns: Column<PageRow>[] = [
    {
      header: 'العنوان',
      cell: (row) => (
        <Link href={`/landing-pages/${row.id}/edit`} className="font-medium text-brand-600 hover:underline">
          {row.title}
        </Link>
      ),
    },
    {
      header: 'الحالة',
      cell: (row) => (
        <Badge tone={row.status === 'published' ? 'success' : 'neutral'} dot>
          {row.status === 'published' ? 'منشورة' : 'مسودة'}
        </Badge>
      ),
    },
    {
      header: 'الرابط العام',
      cell: (row) =>
        row.status === 'published' ? (
          <a
            href={`/p/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-brand-600 hover:underline"
          >
            /p/{row.slug} <ExternalLink size={12} />
          </a>
        ) : (
          <span className="text-ink-faint">غير منشورة بعد</span>
        ),
    },
    {
      header: 'تاريخ الإنشاء',
      // Explicit timeZone so this renders identically during SSR and
      // client hydration regardless of the visitor's own timezone —
      // see orders-list.tsx for the same fix and full reasoning.
      cell: (row) => new Date(row.created_at).toLocaleDateString('ar-SA', { timeZone: 'UTC' }),
    },
    {
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === 'published' && (
            <a
              href={`/p/${row.slug}`}
              target="_blank"
              rel="noreferrer"
              title="معاينة الصفحة المنشورة"
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-subtle hover:text-ink"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <form action={duplicateLandingPageAction.bind(null, row.id)}>
            <button
              type="submit"
              title="نسخ الصفحة"
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-subtle hover:text-ink"
            >
              <Copy size={14} />
            </button>
          </form>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute inset-y-0 start-3.5 my-auto text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بعنوان الصفحة..." className="!ps-9" />
        </div>
        <div className="sm:w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="">كل الحالات</option>
            <option value="published">منشورة</option>
            <option value="draft">مسودة</option>
          </Select>
        </div>
      </div>

      <Table<PageRow>
        keyField={(row) => row.id}
        rows={filtered}
        emptyIcon={FileText}
        emptyTitle={pages.length === 0 ? 'لا توجد صفحات هبوط بعد' : 'لا توجد نتائج مطابقة'}
        emptyMessage={
          pages.length === 0
            ? 'أنشئ أول صفحة لتبدأ باستقبال العملاء.'
            : 'جرّب كلمة بحث أو فلتر حالة مختلف.'
        }
        columns={columns}
      />
    </div>
  );
}
