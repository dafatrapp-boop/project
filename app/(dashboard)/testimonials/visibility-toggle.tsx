'use client';

import { useTransition } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { toggleTestimonialVisibilityAction } from './actions';

export function VisibilityToggle({ id, isVisible }: { id: string; isVisible: boolean }) {
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
      className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink-muted hover:bg-surface-subtle disabled:opacity-60"
    >
      {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
      {isVisible ? 'ظاهرة' : 'مخفية'}
    </button>
  );
}
