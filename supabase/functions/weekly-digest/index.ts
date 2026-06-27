// DeadlineDesk — weekly digest (Supabase Edge Function, Deno runtime).
//
// Runs once a week (see supabase/migrations/0004_schedule_digest.sql). Emails
// each subscribed landlord a summary of deadlines due in the next 30 days, so
// they get a single "here's your week/month" overview in addition to the
// per-deadline reminders. Requires Resend to be configured.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'DeadlineDesk <reminders@example.com>';

const ACTIVE_STATUSES = ['active', 'trialing'];
const DIGEST_HORIZON_DAYS = 30;

const DEADLINE_LABELS: Record<string, string> = {
  lease_renewal: 'Lease renewal',
  rent_increase_notice: 'Rent-increase notice',
  deposit_return: 'Security deposit return',
  inspection: 'Inspection',
  insurance_renewal: 'Insurance renewal',
  license_renewal: 'License / registration renewal',
};

function todayUtcIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
function daysUntil(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - todayUtc) / 86_400_000);
}

async function sendEmail(to: string[], subject: string, text: string) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const today = todayUtcIso();
  const horizon = addDaysIso(today, DIGEST_HORIZON_DAYS);

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, email, notify_email, cc_recipients, subscription_status')
    .in('subscription_status', ACTIVE_STATUSES);
  if (profErr) {
    return new Response(JSON.stringify({ error: profErr.message }), { status: 500 });
  }

  // Upcoming deadlines within the horizon, grouped by owner.
  const { data: deadlines, error: dlErr } = await supabase
    .from('deadlines')
    .select(
      `type, due_date,
       lease:leases!inner(
         unit:units!inner(
           property:properties!inner(nickname, user_id)
         )
       )`,
    )
    .eq('status', 'upcoming')
    .gte('due_date', today)
    .lte('due_date', horizon)
    .order('due_date', { ascending: true });
  if (dlErr) {
    return new Response(JSON.stringify({ error: dlErr.message }), { status: 500 });
  }

  const byUser = new Map<string, string[]>();
  for (const d of deadlines ?? []) {
    // deno-lint-ignore no-explicit-any
    const ctx = d as any;
    const uid = ctx.lease.unit.property.user_id as string;
    const line =
      `• ${d.due_date} (in ${daysUntil(d.due_date)}d) — ` +
      `${DEADLINE_LABELS[d.type] ?? d.type} · ${ctx.lease.unit.property.nickname}`;
    const arr = byUser.get(uid) ?? [];
    arr.push(line);
    byUser.set(uid, arr);
  }

  let sent = 0;
  const errors: string[] = [];

  for (const profile of profiles ?? []) {
    if (!profile.notify_email || !profile.email) continue;
    const lines = byUser.get(profile.id);
    if (!lines || lines.length === 0) continue; // nothing to report

    const subject = `Your DeadlineDesk week — ${lines.length} deadline${lines.length === 1 ? '' : 's'} ahead`;
    const text =
      `Here are your deadlines due in the next ${DIGEST_HORIZON_DAYS} days:\n\n` +
      lines.join('\n') +
      `\n\nLog in to DeadlineDesk to manage them.`;

    try {
      await sendEmail(
        [profile.email, ...((profile.cc_recipients ?? []) as string[])],
        subject,
        text,
      );
      sent++;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, errors }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
