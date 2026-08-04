import { PageHeader } from '@/components/ui/page-header';
import { requireWorkspace } from '@/lib/workspace';
import { AddTestimonialButton } from './add-testimonial-button';
import { TestimonialsList } from './testimonials-list';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { TESTIMONIALS_GUIDE } from '@/lib/guide/content';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_PAGE_SIZE, getPageRange, parsePageParam, splitPage } from '@/lib/pagination';

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { supabase, workspaceId, user } = await requireWorkspace();
  const page = parsePageParam(searchParams.page);
  const [from, to] = getPageRange(page, DEFAULT_PAGE_SIZE);

  const [{ data: testimonialsRaw }, guideDismissed] = await Promise.all([
    supabase
      .from('testimonials')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, to),
    getGuideDismissed(supabase, user.id, 'testimonials'),
  ]);
  const { rows: testimonials, hasMore } = splitPage(testimonialsRaw ?? [], DEFAULT_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="آراء العملاء"
        description={'أضف قسم "آراء العملاء" من محرر صفحة الهبوط لعرضها بتصميم Slider احترافي.'}
        actions={<AddTestimonialButton workspaceId={workspaceId} />}
      />

      <PageGuide
        guideKey="testimonials"
        title={TESTIMONIALS_GUIDE.title}
        steps={TESTIMONIALS_GUIDE.steps}
        initiallyDismissed={guideDismissed}
      />

      <TestimonialsList rows={testimonials} />

      <Pagination page={page} hasMore={hasMore} searchParams={searchParams} basePath="/testimonials" />
    </div>
  );
}
