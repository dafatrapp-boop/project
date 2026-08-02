import { ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { AddOrderButton } from './add-order-button';
import { OrdersList, type OrderRow } from './orders-list';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { ORDERS_GUIDE } from '@/lib/guide/content';

export default async function OrdersPage() {
  const { supabase, workspaceId, user } = await requireWorkspace();

  const [{ data: orders }, { data: leads }, { data: stats }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, product_name, price, currency, payment_method, status, created_at, leads(full_name, phone)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('leads').select('id, full_name').eq('workspace_id', workspaceId).order('full_name').limit(200),
    supabase.from('order_stats').select('*').eq('workspace_id', workspaceId).maybeSingle(),
  ]);

  const guideDismissed = await getGuideDismissed(supabase, user.id, 'orders');

  const rows = (orders ?? []) as unknown as OrderRow[];

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
    </div>
  );
}
