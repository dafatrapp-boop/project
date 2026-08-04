'use client';

import { useEffect, useState, useTransition, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftRight, Phone } from 'lucide-react';
import { updateLeadStatusAction } from '../actions';
import { createClient } from '@/lib/supabase/client';
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, type LeadStatus } from '@/lib/leads/constants';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { digitsOnly } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface PipelineLead {
  id: string;
  full_name: string;
  phone: string | null;
  tags: string[];
  status: LeadStatus;
  estimated_value: number | null;
}

function formatValue(value: number) {
  return new Intl.NumberFormat('ar', { maximumFractionDigits: 0 }).format(value);
}

const COLUMN_TONE: Record<LeadStatus, string> = {
  new: 'border-t-ink-faint',
  contacted: 'border-t-brand-500',
  interested: 'border-t-brand-600',
  negotiating: 'border-t-warning',
  won: 'border-t-success',
  lost: 'border-t-danger',
};

/**
 * Phase 4.1 — the mobile-only <select> fallback from v1 (added because
 * native HTML5 drag-and-drop has no touch or keyboard support) has been
 * replaced with a DropdownMenu shown at every breakpoint. This is the
 * real accessibility fix Phase 1 flagged: a keyboard-only or switch
 * user on desktop previously had no way to move a card between stages
 * at all, since the old fallback was `sm:hidden`. Mouse drag-and-drop
 * still works exactly as before as a progressive-enhancement shortcut.
 */
export function KanbanBoard({ initialLeads, workspaceId }: { initialLeads: PipelineLead[]; workspaceId: string }) {
  const [leads, setLeads] = useState(initialLeads);
  const [, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);
  const router = useRouter();

  // Keep local state in sync whenever the server re-renders this page
  // with fresh props (e.g. after router.refresh() below).
  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  // Realtime (migration 0039, gaps-checklist 6.1) — another user moving
  // a card in a separate tab/session used to be invisible here until a
  // manual reload. RLS still applies to what this subscription actually
  // receives; this just avoids polling for it.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`pipeline-${workspaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `workspace_id=eq.${workspaceId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, router]);

  function moveLead(leadId: string, newStatus: LeadStatus) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    startTransition(() => updateLeadStatusAction(leadId, newStatus));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, status: LeadStatus) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) moveLead(leadId, status);
    setDraggingId(null);
    setDragOverStatus(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {LEAD_STATUS_ORDER.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        const columnTotal = columnLeads.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0);
        const isDropTarget = dragOverStatus === status;
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverStatus !== status) setDragOverStatus(status);
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
            onDrop={(e) => handleDrop(e, status)}
            className={cn(
              'flex w-64 shrink-0 flex-col gap-2 rounded-lg border-t-4 bg-surface-subtle p-3 transition-colors duration-fast',
              COLUMN_TONE[status],
              isDropTarget && 'bg-brand-50/60 ring-2 ring-inset ring-brand-300'
            )}
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-body-sm font-semibold text-ink">{LEAD_STATUS_LABELS[status]}</h3>
              <Badge tone="neutral" size="sm">{columnLeads.length}</Badge>
            </div>
            {columnTotal > 0 && (
              <p className="px-1 text-caption text-ink-faint">إجمالي القيمة: {formatValue(columnTotal)}</p>
            )}

            <div className="flex flex-col gap-2">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', lead.id);
                    setDraggingId(lead.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverStatus(null);
                  }}
                  className={cn(
                    'group cursor-grab rounded-md border border-border bg-surface p-3 shadow-subtle transition-all duration-fast active:cursor-grabbing',
                    draggingId === lead.id ? 'rotate-1 scale-95 opacity-40' : 'hover:-translate-y-0.5 hover:shadow-card'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/leads/${lead.id}`} className="text-body-sm font-medium text-ink hover:text-brand-600">
                      {lead.full_name}
                    </Link>
                    <DropdownMenu
                      align="end"
                      trigger={
                        <IconButton
                          variant="ghost"
                          size="sm"
                          aria-label={`نقل ${lead.full_name} إلى حالة أخرى`}
                          className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <ArrowLeftRight size={13} />
                        </IconButton>
                      }
                      items={LEAD_STATUS_ORDER.map((s) => ({
                        label: LEAD_STATUS_LABELS[s],
                        disabled: s === status,
                        onSelect: () => moveLead(lead.id, s),
                      }))}
                    />
                  </div>
                  {lead.phone && (
                    <a
                      href={`tel:${digitsOnly(lead.phone)}`}
                      className="mt-1 flex w-fit items-center gap-1 text-caption text-ink-faint transition-colors hover:text-brand-600"
                    >
                      <Phone size={11} />
                      {lead.phone}
                    </a>
                  )}
                  {lead.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {lead.tags.map((t) => (
                        <Badge key={t} tone="neutral" size="sm">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {columnLeads.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-3 text-center text-caption text-ink-faint">
                  لا يوجد عملاء هنا
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
