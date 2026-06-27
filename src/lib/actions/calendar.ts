'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';

/** Rotate the calendar feed token (invalidates the old subscribe URL). */
export async function regenerateCalendarToken(): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase
    .from('profiles')
    .update({ calendar_token: randomUUID() })
    .eq('id', user.id);
  revalidatePath('/settings');
}
