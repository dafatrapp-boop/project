import Stripe from 'stripe';

/**
 * Returns null (rather than throwing) when STRIPE_SECRET_KEY isn't
 * set — this project ships without a real Stripe account configured
 * (see CHECKLIST.md), so every caller must handle the "billing isn't
 * configured yet" case instead of crashing the request.
 */
export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Maps our internal plan names to Stripe Price IDs. These come from
 * your own Stripe Dashboard (Products > Pricing) once you create
 * them — there is no default/placeholder price ID that would work
 * across different Stripe accounts.
 */
export const STRIPE_PRICE_IDS: Record<'starter' | 'growth' | 'pro', string | undefined> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER,
  growth: process.env.STRIPE_PRICE_ID_GROWTH,
  pro: process.env.STRIPE_PRICE_ID_PRO,
};
