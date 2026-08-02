'use client';

import { useMemo, useState, useTransition } from 'react';
import { Search, Star, Trash2, Eye, EyeOff, MessageSquareQuote, Quote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { deleteTestimonialAction, toggleTestimonialVisibilityAction } from './actions';

export interface TestimonialRow {
  id: string;
  customer_name: string;
  avatar_url: string | null;
  subtitle: string | null;
  rating: number;
  body: string;
  is_visible: boolean;
}

function VisibilityToggle({ id, isVisible }: { id: string; isVisible: boolean }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleTestimonialVisibilityAction(id, !isVisible);
          show(isVisible ? 'تم إخفاء الشهادة' : 'تم إظهار الشهادة', 'success');
        })
      }
      className="focus-visible:outline-none"
    >
      <Badge tone={isVisible ? 'success' : 'neutral'} dot className="cursor-pointer transition-opacity hover:opacity-80">
        {isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
        {isVisible ? 'ظاهرة في الصفحات' : 'مخفية'}
      </Badge>
    </button>
  );
}

function DeleteTestimonialButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label={`حذف شهادة ${name}`}
      disabled={pending}
      className="hover:bg-danger-50 hover:text-danger"
      onClick={() => {
        if (!window.confirm(`هل تريد حذف شهادة "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
        startTransition(async () => {
          await deleteTestimonialAction(id);
          show('تم حذف الشهادة', 'success');
        });
      }}
    >
      <Trash2 size={14} />
    </IconButton>
  );
}

export function TestimonialsList({ rows }: { rows: TestimonialRow[] }) {
  const [q, setQ] = useState('');
  const [visibility, setVisibility] = useState<'' | 'visible' | 'hidden'>('');

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (visibility === 'visible' && !r.is_visible) return false;
      if (visibility === 'hidden' && r.is_visible) return false;
      if (q && !r.customer_name.toLowerCase().includes(q.toLowerCase()) && !r.body.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, q, visibility]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareQuote}
        title="لا توجد شهادات بعد"
        description="أضف أول شهادة عميل لعرضها في صفحاتك."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute inset-y-0 start-3.5 my-auto text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو نص الشهادة..." className="!ps-9" />
        </div>
        <div className="sm:w-44">
          <Select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}>
            <option value="">الكل</option>
            <option value="visible">ظاهرة فقط</option>
            <option value="hidden">مخفية فقط</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="لا توجد نتائج" description="جرّب كلمة بحث أو فلتر مختلف." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.id} className={cn('flex h-full flex-col', !t.is_visible && 'opacity-70')}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {t.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <Avatar name={t.customer_name} />
                  )}
                  <div>
                    <p className="text-body-sm font-medium text-ink">{t.customer_name}</p>
                    {t.subtitle && <p className="text-caption text-ink-muted">{t.subtitle}</p>}
                  </div>
                </div>
                <Quote size={18} className="shrink-0 text-brand-100" aria-hidden />
              </div>

              <div className="mt-3 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} className={n <= t.rating ? 'fill-warning text-warning' : 'text-border'} />
                ))}
              </div>

              <p className="mt-2 line-clamp-4 text-body-sm text-ink-muted">{t.body}</p>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                <VisibilityToggle id={t.id} isVisible={t.is_visible} />
                <DeleteTestimonialButton id={t.id} name={t.customer_name} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
