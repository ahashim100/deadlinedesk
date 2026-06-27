// Stripe server client. Used only in server routes/actions — never the browser.
import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    // apiVersion omitted -> uses the account's default, avoiding version drift.
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** Subscription statuses we treat as "reminders on". */
export const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'];
