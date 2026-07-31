'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import type { OrderStatus } from '@/lib/orders/constants';

export async function createOrderAction(formData: FormData) {
  const { supabase, workspaceId } = await requireWorkspace();

  const productName = String(formData.get('productName') ?? '').trim();
  const priceRaw = String(formData.get('price') ?? '').trim();
  const currency = String(formData.get('currency') ?? 'SAR');
  const paymentMethod = String(formData.get('paymentMethod') ?? '').trim() || null;
  const leadId = String(formData.get('leadId') ?? '') || null;

  if (!productName || !priceRaw) {
    redirect('/orders?error=missing_fields');
  }

  const price = Number(priceRaw);
  if (Number.isNaN(price) || price < 0) {
    redirect('/orders?error=invalid_price');
  }

  const { error } = await supabase.from('orders').insert({
    workspace_id: workspaceId,
    lead_id: leadId,
    product_name: productName,
    price,
    currency,
    payment_method: paymentMethod,
    status: 'pending',
  });

  if (error) {
    redirect('/orders?error=create_failed');
  }

  revalidatePath('/orders');
  revalidatePath('/dashboard');
  redirect('/orders');
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  const { supabase, workspaceId } = await requireWorkspace();

  await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('workspace_id', workspaceId);

  revalidatePath('/orders');
  revalidatePath('/dashboard');
}

export async function deleteOrderAction(orderId: string) {
  const { supabase, workspaceId, role } = await requireWorkspace();

  if (role !== 'owner' && role !== 'admin') return;

  await supabase.from('orders').delete().eq('id', orderId).eq('workspace_id', workspaceId);

  revalidatePath('/orders');
  revalidatePath('/dashboard');
}
