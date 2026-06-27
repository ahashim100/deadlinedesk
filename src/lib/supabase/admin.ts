// Service-role Supabase client. Bypasses RLS — use ONLY in trusted server
// contexts (Stripe webhook, never in the browser). The Edge Function has its
// own copy in supabase/functions/.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
