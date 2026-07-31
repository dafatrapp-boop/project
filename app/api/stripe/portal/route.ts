import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspace } from '@/lib/workspace';
import { getStripeClient } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 });
  }

  const { supabase, workspaceId, role } = await requireWorkspace();
  if (role !== 'owner') {
    return NextResponse.json({ error: 'not_authorized' }, { status: 403 });
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('stripe_customer_id')
    .eq('id', workspaceId)
    .single();

  if (!workspace?.stripe_customer_id) {
    return NextResponse.json({ error: 'no_subscription' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${appUrl}/team`,
  });

  return NextResponse.json({ url: session.url });
}
