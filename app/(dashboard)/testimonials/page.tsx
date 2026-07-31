import { Star, Trash2, MessageSquareQuote } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { EmptyState } from '@/components/ui/empty-state';
import { AddTestimonialButton } from './add-testimonial-button';
import { VisibilityToggle } from './visibility-toggle';
import { deleteTestimonialAction } from './actions';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { TESTIMONIALS_GUIDE } from '@/lib/guide/content';

export default async function TestimonialsPage() {
  const { supabase, workspaceId, user } = await requireWorkspace();

  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  const guideDismissed = await getGuideDismissed(supabase, user.id, 'testimonials');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">آراء العملاء</h1>
          <p className="text-sm text-ink-muted">
            أضف قسم &quot;آراء العملاء&quot; من محرر صفحة الهبوط لعرضها بتصميم Slider احترافي.
          </p>
        </div>
        <AddTestimonialButton workspaceId={workspaceId} />
      </div>

      <PageGuide
        guideKey="testimonials"
        title={TESTIMONIALS_GUIDE.title}
        steps={TESTIMONIALS_GUIDE.steps}
        initiallyDismissed={guideDismissed}
      />

      {!testimonials || testimonials.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="لا توجد شهادات بعد"
          description="أضف أول شهادة عميل لعرضها في صفحاتك."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-subtle">
              <div className="flex items-center gap-3">
                {t.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">
                    {t.customer_name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-ink">{t.customer_name}</p>
                  {t.subtitle && <p className="text-xs text-ink-muted">{t.subtitle}</p>}
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} className={n <= t.rating ? 'fill-warning text-warning' : 'text-border'} />
                ))}
              </div>

              <p className="line-clamp-4 text-sm text-ink-muted">{t.body}</p>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                <VisibilityToggle id={t.id} isVisible={t.is_visible} />
                <form action={deleteTestimonialAction.bind(null, t.id)}>
                  <button type="submit" className="rounded p-1 text-danger hover:bg-danger/10" aria-label="حذف">
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
