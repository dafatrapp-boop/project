'use client';

import { useState, useTransition, type DragEvent } from 'react';
import Link from 'next/link';
import { updateLeadStatusAction } from '../actions';
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, type LeadStatus } from '@/lib/leads/constants';

export interface PipelineLead {
  id: string;
  full_name: string;
  phone: string | null;
  tags: string[];
  status: LeadStatus;
}

const COLUMN_TONE: Record<LeadStatus, string> = {
  new: 'border-t-ink-faint',
  contacted: 'border-t-brand-500',
  interested: 'border-t-brand-600',
  negotiating: 'border-t-warning',
  won: 'border-t-success',
  lost: 'border-t-danger',
};

export function KanbanBoard({ initialLeads }: { initialLeads: PipelineLead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function moveLead(leadId: string, newStatus: LeadStatus) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    startTransition(() => updateLeadStatusAction(leadId, newStatus));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, status: LeadStatus) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) moveLead(leadId, status);
    setDraggingId(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {LEAD_STATUS_ORDER.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, status)}
            className={`flex w-64 shrink-0 flex-col gap-2 rounded-lg border-t-4 bg-surface-subtle p-3 ${COLUMN_TONE[status]}`}
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-ink">{LEAD_STATUS_LABELS[status]}</h3>
              <span className="text-xs text-ink-faint">{columnLeads.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', lead.id);
                    setDraggingId(lead.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  className={`cursor-grab rounded-md border border-border bg-surface p-3 shadow-subtle active:cursor-grabbing ${
                    draggingId === lead.id ? 'opacity-40' : ''
                  }`}
                >
                  <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-ink hover:text-brand-600">
                    {lead.full_name}
                  </Link>
                  {lead.phone && <p className="text-xs text-ink-faint">{lead.phone}</p>}
                  {lead.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {lead.tags.map((t) => (
                        <span key={t} className="rounded-full bg-surface-subtle px-1.5 py-0.5 text-[10px] text-ink-muted">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Mobile/touch fallback — native HTML5 drag has poor touch
                      support, so every card also has a plain select to move it. */}
                  <select
                    value={status}
                    onChange={(e) => moveLead(lead.id, e.target.value as LeadStatus)}
                    className="mt-2 w-full rounded border border-border bg-surface-subtle px-1 py-1 text-xs text-ink sm:hidden"
                  >
                    {LEAD_STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {LEAD_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {columnLeads.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-ink-faint">
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
