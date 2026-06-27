// Server-side helpers for the current user + profile.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/database.types';

/** Returns the authenticated user, redirecting to /login if there is none. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

/** Returns the current user's profile row (creating nothing — the DB trigger does). */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

const ACTIVE_STATUSES = ['active', 'trialing'];

/** True when the profile's Stripe subscription is active/trialing. */
export function hasActiveSubscription(profile: Profile | null): boolean {
  return !!profile && ACTIVE_STATUSES.includes(profile.subscription_status);
}
