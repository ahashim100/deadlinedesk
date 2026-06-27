'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';

const prefsSchema = z.object({
  notify_email: z.boolean(),
  notify_sms: z.boolean(),
  phone: z.string().nullable(),
  lead_times: z.array(z.number().int().positive()).min(1, 'Add at least one lead time.'),
  cc_recipients: z.array(z.string().email('One of the CC emails is invalid.')).max(5),
});

export interface SettingsResult {
  error?: string;
  ok?: boolean;
}

export async function updateNotificationPrefs(
  _prev: SettingsResult,
  formData: FormData,
): Promise<SettingsResult> {
  const { user } = await requireUser();
  const supabase = await createClient();

  // lead_times comes in as a comma-separated string like "60,30,7,1".
  const rawLeads = (formData.get('lead_times') as string) ?? '';
  const lead_times = Array.from(
    new Set(
      rawLeads
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ).sort((a, b) => b - a);

  // CC recipients come in as a comma/whitespace-separated string.
  const cc_recipients = ((formData.get('cc_recipients') as string) ?? '')
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = prefsSchema.safeParse({
    notify_email: formData.get('notify_email') === 'on',
    notify_sms: formData.get('notify_sms') === 'on',
    phone: ((formData.get('phone') as string) ?? '').trim() || null,
    lead_times,
    cc_recipients,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  // If SMS is on, require a phone number.
  if (parsed.data.notify_sms && !parsed.data.phone) {
    return { error: 'Add a phone number to receive SMS reminders.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { ok: true };
}
