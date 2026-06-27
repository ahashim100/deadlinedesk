// DeadlineDesk — daily reminder job (Supabase Edge Function, Deno runtime).
//
// Runs once a day (see schedule in supabase/migrations/0002_schedule_reminders.sql).
// For every upcoming deadline owned by a *subscribed* landlord, it works out
// which lead-time milestone the deadline has reached (e.g. 30 days out) and
// sends one email and/or SMS per milestone per channel — never twice, thanks to
// a claim row in reminder_log guarded by a unique index.
//
// Reminders fire server-side regardless of whether anyone opens the app.

import { createClient } from 'jsr:@supabase/supabase-js@2';

// --- Config from the environment -------------------------------------------
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'DeadlineDesk <reminders@example.com>';
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER');

const ACTIVE_STATUSES = ['active', 'trialing'];

const DEADLINE_LABELS: Record<string, string> = {
  lease_renewal: 'Lease renewal',
  rent_increase_notice: 'Rent-increase notice',
  deposit_return: 'Security deposit return',
  inspection: 'Inspection',
  insurance_renewal: 'Insurance renewal',
  license_renewal: 'License / registration renewal',
};

// --- Date helpers (UTC, matches the rules engine) --------------------------
function todayUtcIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysUntil(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - todayUtc) / 86_400_000);
}

/**
 * Which lead-time milestone a deadline has reached: the smallest configured
 * lead time L with L >= daysUntil. Returns null if the deadline is further out
 * than the largest lead time. This catches up correctly if a daily run is missed.
 *
 * MIRROR of src/lib/reminders.ts (the unit-tested source of truth). Keep in sync.
 */
function currentBucket(days: number, leadTimes: number[]): number | null {
  const eligible = leadTimes.filter((l) => l >= days).sort((a, b) => a - b);
  return eligible.length ? eligible[0] : null;
}

// --- Senders ---------------------------------------------------------------
async function sendEmail(to: string | string[], subject: string, text: string) {
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

async function sendSms(to: string, body: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error('Twilio env vars not set');
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const form = new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Body: body });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
}

// --- Main ------------------------------------------------------------------
Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const today = todayUtcIso();

  // Subscribed landlords only.
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, email, phone, notify_email, notify_sms, lead_times, cc_recipients, subscription_status')
    .in('subscription_status', ACTIVE_STATUSES);
  if (profErr) {
    return new Response(JSON.stringify({ error: profErr.message }), { status: 500 });
  }
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Upcoming, not-yet-past deadlines with their owner.
  const { data: deadlines, error: dlErr } = await supabase
    .from('deadlines')
    .select(
      `id, type, due_date,
       lease:leases!inner(
         tenant_name,
         unit:units!inner(
           unit_label,
           property:properties!inner(nickname, user_id)
         )
       )`,
    )
    .eq('status', 'upcoming')
    .gte('due_date', today);
  if (dlErr) {
    return new Response(JSON.stringify({ error: dlErr.message }), { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const d of deadlines ?? []) {
    // deno-lint-ignore no-explicit-any
    const ctx = d as any;
    const property = ctx.lease.unit.property;
    const profile = profileById.get(property.user_id);
    if (!profile) {
      skipped++;
      continue; // owner not subscribed
    }

    const days = daysUntil(d.due_date);
    const bucket = currentBucket(days, profile.lead_times ?? [60, 30, 7, 1]);
    if (bucket === null) {
      skipped++;
      continue; // too far out
    }

    const label = DEADLINE_LABELS[d.type] ?? d.type;
    const where = `${property.nickname} · ${ctx.lease.unit.unit_label}`;
    const whenText =
      days <= 0 ? 'is due today' : `is due in ${days} day${days === 1 ? '' : 's'}`;
    const subject = `Reminder: ${label} ${whenText} — ${property.nickname}`;
    const text =
      `${label} for ${where}${ctx.lease.tenant_name ? ` (${ctx.lease.tenant_name})` : ''} ` +
      `${whenText} (${d.due_date}).\n\nLog in to DeadlineDesk to mark it done.`;

    const channels: Array<{ ch: 'email' | 'sms'; on: boolean; to: string | null }> = [
      { ch: 'email', on: profile.notify_email, to: profile.email },
      { ch: 'sms', on: profile.notify_sms, to: profile.phone },
    ];

    for (const { ch, on, to } of channels) {
      if (!on || !to) continue;

      // Claim the send: insert a log row first. The unique index on
      // (deadline_id, channel, lead_time) makes a duplicate claim fail, which
      // is how we guarantee we never double-send the same milestone.
      const { data: claim, error: claimErr } = await supabase
        .from('reminder_log')
        .insert({
          deadline_id: d.id,
          channel: ch,
          lead_time: bucket,
          status: 'pending',
        })
        .select('id')
        .single();

      if (claimErr || !claim) {
        skipped++; // already sent (unique violation) or insert failed
        continue;
      }

      try {
        if (ch === 'email') {
          // Include any CC recipients (partner / property manager) on email.
          const cc = (profile.cc_recipients ?? []) as string[];
          await sendEmail([to, ...cc], subject, text);
        } else {
          await sendSms(to, `${subject}\n${text}`);
        }
        await supabase.from('reminder_log').update({ status: 'sent' }).eq('id', claim.id);
        sent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(msg);
        await supabase.from('reminder_log').update({ status: 'error' }).eq('id', claim.id);
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, today, sent, skipped, errors }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
