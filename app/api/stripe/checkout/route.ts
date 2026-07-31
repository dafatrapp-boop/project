import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspace } from '@/lib/workspace';
import { getStripeClient, STRIPE_PRICE_IDS } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      { error: 'billing_not_configured', message: 'Stripe غير مُفعّل على هذا المشروع بعد.' },
      { status: 501 }
    );
  }

  const { supabase, workspaceId, user, role } = await requireWorkspace();

  if (role !== 'owner') {
    return NextResponse.json({ error: 'not_authorized' }, { status: 403 });
  }

  const { plan } = (await request.json()) as { plan: 'starter' | 'growth' | 'pro' };
  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: 'price_not_configured', message: `لم يتم إعداد Price ID لباقة ${plan} في .env` },
      { status: 501 }
    );
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('stripe_customer_id')
    .eq('id', workspaceId)
    .single();

  let customerId = workspace?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { workspace_id: workspaceId },
    });
    customerId = customer.id;
    await supabase.from('workspaces').update({ stripe_customer_id: customerId }).eq('id', workspaceId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/team?checkout=success`,
    cancel_url: `${appUrl}/team?checkout=cancelled`,
    metadata: { workspace_id: workspaceId, plan },
    subscription_data: { metadata: { workspace_id: workspaceId, plan } },
  });

  return NextResponse.json({ url: session.url });
}
