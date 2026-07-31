import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Stripe webhooks must use the SERVICE ROLE client (createAdminClient),
 * not the normal per-request client — there is no logged-in user
 * making this request, Stripe's servers are calling it directly, so
 * there's no session/cookie for RLS to key off of. Signature
 * verification below is what proves the request actually came from
 * Stripe (not RLS), which is why the service-role bypass is safe here.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'billing_not_configured' }, { status: 501 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspace_id;
      const plan = session.metadata?.plan as 'starter' | 'growth' | 'pro' | undefined;
      if (workspaceId && plan) {
        await supabase
          .from('workspaces')
          .update({ plan, stripe_subscription_id: session.subscription as string })
          .eq('id', workspaceId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const workspaceId = subscription.metadata?.workspace_id;
      if (workspaceId) {
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        await supabase
          .from('workspaces')
          .update({ plan_expires_at: subscription.cancel_at_period_end ? periodEnd : null })
          .eq('id', workspaceId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const workspaceId = subscription.metadata?.workspace_id;
      if (workspaceId) {
        // Downgrade to free rather than leaving the workspace on a
        // plan it's no longer paying for.
        await supabase
          .from('workspaces')
          .update({ plan: 'free', stripe_subscription_id: null, plan_expires_at: null })
          .eq('id', workspaceId);
      }
      break;
    }

    default:
      // Unhandled event types are intentionally ignored, not errors.
      break;
  }

  return NextResponse.json({ received: true });
}
