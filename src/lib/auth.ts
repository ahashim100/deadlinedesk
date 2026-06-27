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

/** True when the profile has a Base or Pro subscription. */
export function hasActiveSubscription(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.subscription_tier === 'base' || profile.subscription_tier === 'pro') return true;
  // Fallback for the brief window between checkout and webhook delivery.
  return ACTIVE_STATUSES.includes(profile.subscription_status);
}

/** True when the profile is on the Pro tier (calendar sync, CC, weekly digest). */
export function hasPro(profile: Profile | null): boolean {
  return !!profile && profile.subscription_tier === 'pro';
}
