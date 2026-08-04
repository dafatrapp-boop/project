import { ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { AddOrderButton } from './add-order-button';
import { OrdersList, type OrderRow } from './orders-list';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { ORDERS_GUIDE } from '@/lib/guide/content';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_PAGE_SIZE, getPageRange, parsePageParam, splitPage } from '@/lib/pagination';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { supabase, workspaceId, user } = await requireWorkspace();
  const page = parsePageParam(searchParams.page);
  const [from, to] = getPageRange(page, DEFAULT_PAGE_SIZE);

  const [{ data: ordersRaw }, { data: leads }, { data: stats }, guideDismissed] = await Promise.all([
    supabase
      .from('orders')
      .select('id, product_name, price, currency, payment_method, status, created_at, leads(full_name, phone)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(from, to),
    // Used only to populate the "add order" lead picker — not a report
    // list, so a generous bounded cap (not unbounded) is fine here.
    supabase.from('leads').select('id, full_name').eq('workspace_id', workspaceId).order('full_name').limit(500),
    supabase.from('order_stats').select('*').eq('workspace_id', workspaceId).maybeSingle(),
    getGuideDismissed(supabase, user.id, 'orders'),
  ]);

  const { rows: ordersPage, hasMore } = splitPage(ordersRaw ?? [], DEFAULT_PAGE_SIZE);
  const rows = ordersPage as unknown as OrderRow[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الطلبات"
        description="سجّل بسيط للطلبات — بدون مخزون أو شحن أو محاسبة معقدة."
        actions={<AddOrderButton leads={leads ?? []} />}
      />

      <PageGuide guideKey="orders" title={ORDERS_GUIDE.title} steps={ORDERS_GUIDE.steps} initiallyDismissed={guideDismissed} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={ShoppingBag} label="إجمالي الطلبات" value={stats?.total_orders ?? 0} />
        <StatCard icon={TrendingUp} label="إجمالي المبيعات" value={stats?.total_sales ?? 0} />
        <StatCard icon={Wallet} label="الإيراد المُحصَّل" value={stats?.revenue ?? 0} />
      </div>

      <OrdersList rows={rows} />

      <Pagination page={page} hasMore={hasMore} searchParams={searchParams} basePath="/orders" />
    </div>
  );
}
