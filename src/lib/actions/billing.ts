'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

/** Ensure the profile has a Stripe customer; create one if needed. */
async function ensureCustomer(): Promise<string> {
  const { user } = await requireUser();
  const supabase = await createClient();
  const stripe = getStripe();

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: profile?.email ?? user.email ?? undefined,
    metadata: { supabase_user_id: user.id },
  });

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', user.id);

  return customer.id;
}

/** Start a subscription Checkout session and redirect to Stripe. */
export async function startCheckout(): Promise<void> {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw new Error('STRIPE_PRICE_ID is not set');

  const customer = await ensureCustomer();
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    customer,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl()}/settings?checkout=success`,
    cancel_url: `${siteUrl()}/settings?checkout=cancelled`,
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  redirect(session.url);
}

/** Open the Stripe Customer Portal (manage / cancel subscription). */
export async function openBillingPortal(): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  const stripe = getStripe();

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) redirect('/settings');

  const session = await stripe.billingPortal.sessions.create({
    customer: profile!.stripe_customer_id!,
    return_url: `${siteUrl()}/settings`,
  });

  redirect(session.url);
}
