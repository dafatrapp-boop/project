'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Megaphone, MessageCircle, Share2, type LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, type Column } from '@/components/ui/table';
import {
  PLATFORM_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_TONE,
  type CampaignPlatform,
  type CampaignStatus,
} from '@/lib/campaigns/constants';

export interface CampaignRow {
  id: string;
  name: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  leadsCount: number;
  viewsCount: number;
}

// Broad category icon per platform — lucide has no brand logos to draw
// on, so this groups platforms by channel type (messaging / search /
// social) for quick scanning rather than faking brand marks.
const PLATFORM_ICON: Record<CampaignPlatform, LucideIcon> = {
  facebook: Share2,
  instagram: Share2,
  tiktok: Share2,
  snapchat: Share2,
  google: Search,
  whatsapp: MessageCircle,
  other: Megaphone,
};

/**
 * Phase 4.2 — client-side search + status/platform filters. Campaigns
 * has no dedicated search column either; same reasoning as the landing
 * pages list (Phase 4.2 notes) — filtering the already-fetched,
 * workspace-scoped list in the browser avoids a schema migration.
 */
export function CampaignsList({ rows }: { rows: CampaignRow[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | CampaignStatus>('');
  const [platform, setPlatform] = useState<'' | CampaignPlatform>('');

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (platform && r.platform !== platform) return false;
      if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, q, status, platform]);

  const columns: Column<CampaignRow>[] = [
    {
      header: 'اسم الحملة',
      cell: (row) => {
        const Icon = PLATFORM_ICON[row.platform];
        return (
          <Link href={`/campaigns/${row.id}`} className="flex items-center gap-2 font-medium text-brand-600 hover:underline">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
              <Icon size={12} />
            </span>
            {row.name}
          </Link>
        );
      },
    },
    { header: 'المنصة', cell: (row) => PLATFORM_LABELS[row.platform] },
    {
      header: 'الحالة',
      cell: (row) => <Badge tone={CAMPAIGN_STATUS_TONE[row.status]} dot>{CAMPAIGN_STATUS_LABELS[row.status]}</Badge>,
    },
    { header: 'الزيارات', cell: (row) => row.viewsCount.toLocaleString('ar-SA') },
    { header: 'العملاء المحتملون', cell: (row) => row.leadsCount.toLocaleString('ar-SA') },
    {
      header: 'معدل التحويل',
      cell: (row) =>
        row.viewsCount > 0 ? (
          <Badge tone={row.leadsCount / row.viewsCount >= 0.1 ? 'success' : 'neutral'} size="sm">
            {((row.leadsCount / row.viewsCount) * 100).toFixed(1)}%
          </Badge>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute inset-y-0 start-3.5 my-auto text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الحملة..." className="!ps-9" />
        </div>
        <div className="sm:w-40">
          <Select value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)}>
            <option value="">كل المنصات</option>
            {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        <div className="sm:w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="">كل الحالات</option>
            {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
      </div>

      <Table<CampaignRow>
        keyField={(row) => row.id}
        rows={filtered}
        emptyIcon={Megaphone}
        emptyTitle={rows.length === 0 ? 'لا توجد حملات بعد' : 'لا توجد نتائج مطابقة'}
        emptyMessage={
          rows.length === 0
            ? 'أنشئ حملتك الأولى واربطها بصفحة هبوط لبدء تتبع الإسناد.'
            : 'جرّب كلمة بحث أو فلتر مختلف.'
        }
        columns={columns}
      />
    </div>
  );
}
