// Stripe webhook: keeps profiles.subscription_status in sync. Uses the
// service-role client because Stripe is not an authenticated user.
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

// Stripe needs the raw body to verify the signature.
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'webhook secret not set' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid signature';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createAdminClient();

  async function syncByCustomer(
    customerId: string,
    fields: {
      subscription_status: string;
      stripe_subscription_id: string | null;
    },
  ) {
    await admin
      .from('profiles')
      .update(fields)
      .eq('stripe_customer_id', customerId);
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await syncByCustomer(sub.customer as string, {
        subscription_status:
          event.type === 'customer.subscription.deleted'
            ? 'canceled'
            : sub.status,
        stripe_subscription_id: sub.id,
      });
      break;
    }
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription' && session.customer) {
        await syncByCustomer(session.customer as string, {
          subscription_status: 'active',
          stripe_subscription_id: (session.subscription as string) ?? null,
        });
      }
      break;
    }
    default:
      // Ignore other event types.
      break;
  }

  return NextResponse.json({ received: true });
}
