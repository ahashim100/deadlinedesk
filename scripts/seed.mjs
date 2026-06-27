// Seed a demo landlord with two properties and a few leases, plus the
// deadlines the rules engine would derive. Idempotent-ish: re-running reuses
// the demo user and clears their old properties first.
//
// Run with Node's built-in env loader:
//   node --env-file=.env.local scripts/seed.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
//
// NOTE: the deadline math below mirrors src/lib/rules/states/ca.ts. That module
// is the source of truth for the app; this is a standalone copy so the seed has
// no build step. Keep them consistent.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing env. Run: node --env-file=.env.local scripts/seed.mjs\n' +
      '(needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)',
  );
  process.exit(1);
}

const DEMO_EMAIL = 'demo@deadlinedesk.test';
const DEMO_PASSWORD = 'demo-password-123';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// --- date helpers (UTC) ---
const CA_DEPOSIT_RETURN_DAYS = 21;
function iso(d) {
  return d.toISOString().slice(0, 10);
}
function fromToday(days) {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() + days);
  return iso(utc);
}
function addDaysIso(isoStr, days) {
  const [y, m, dd] = isoStr.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, dd));
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
}
function subDaysIso(isoStr, days) {
  return addDaysIso(isoStr, -days);
}

// Mirror of the CA rules engine.
function deriveDeadlines(lease) {
  const out = [];
  if (lease.move_out_date)
    out.push({ type: 'deposit_return', due_date: addDaysIso(lease.move_out_date, CA_DEPOSIT_RETURN_DAYS) });
  if (lease.lease_end) out.push({ type: 'lease_renewal', due_date: lease.lease_end });
  if (lease.rent_increase_notice_days != null && lease.lease_end)
    out.push({
      type: 'rent_increase_notice',
      due_date: subDaysIso(lease.lease_end, lease.rent_increase_notice_days),
    });
  if (lease.inspection_date) out.push({ type: 'inspection', due_date: lease.inspection_date });
  if (lease.insurance_renewal_date)
    out.push({ type: 'insurance_renewal', due_date: lease.insurance_renewal_date });
  if (lease.license_renewal_date)
    out.push({ type: 'license_renewal', due_date: lease.license_renewal_date });
  return out;
}

async function getOrCreateDemoUser() {
  // Try to find an existing demo user.
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users?.find((u) => u.email === DEMO_EMAIL);
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

async function main() {
  const user = await getOrCreateDemoUser();
  console.log(`Demo user: ${user.email} (${user.id})`);

  // Mark the demo profile subscribed so reminders are demonstrable.
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      notify_email: true,
      notify_sms: false,
      lead_times: [60, 30, 7, 1],
    })
    .eq('id', user.id);

  // Clear any previous demo properties (cascades to units/leases/deadlines).
  await supabase.from('properties').delete().eq('user_id', user.id);

  const properties = [
    {
      nickname: 'Maple St Duplex',
      address: '123 Maple St, Oakland, CA',
      state: 'CA',
      units: [
        {
          unit_label: 'Unit A',
          lease: {
            tenant_name: 'Jordan Lee',
            tenant_email: 'jordan@example.com',
            lease_start: fromToday(-290),
            lease_end: fromToday(75),
            monthly_rent: 2400,
            deposit_amount: 3600,
            rent_increase_notice_days: 30,
            insurance_renewal_date: fromToday(20),
          },
        },
        {
          unit_label: 'Unit B',
          lease: {
            tenant_name: 'Priya Shah',
            tenant_email: 'priya@example.com',
            lease_start: fromToday(-180),
            lease_end: fromToday(185),
            monthly_rent: 2200,
            deposit_amount: 3300,
            inspection_date: fromToday(12),
          },
        },
      ],
    },
    {
      nickname: 'Oak Ave Single',
      address: '88 Oak Ave, Berkeley, CA',
      state: 'CA',
      units: [
        {
          unit_label: 'House',
          lease: {
            tenant_name: 'Sam Rivera',
            tenant_email: 'sam@example.com',
            lease_start: fromToday(-400),
            lease_end: fromToday(-35),
            monthly_rent: 3100,
            deposit_amount: 4600,
            move_out_date: fromToday(-5), // deposit return due in ~16 days
            license_renewal_date: fromToday(5),
          },
        },
      ],
    },
  ];

  let leaseCount = 0;
  let deadlineCount = 0;
  let reminderCount = 0;

  for (const p of properties) {
    const { data: property } = await supabase
      .from('properties')
      .insert({ user_id: user.id, nickname: p.nickname, address: p.address, state: p.state })
      .select()
      .single();

    for (const u of p.units) {
      const { data: unit } = await supabase
        .from('units')
        .insert({ property_id: property.id, unit_label: u.unit_label })
        .select()
        .single();

      const { data: lease } = await supabase
        .from('leases')
        .insert({ unit_id: unit.id, ...u.lease })
        .select()
        .single();
      leaseCount++;

      const deadlines = deriveDeadlines(u.lease).map((d) => ({
        lease_id: lease.id,
        type: d.type,
        due_date: d.due_date,
        status: 'upcoming',
        source: 'rule',
      }));
      if (deadlines.length) {
        const { data: inserted } = await supabase
          .from('deadlines')
          .insert(deadlines)
          .select('id');
        deadlineCount += deadlines.length;

        // Seed a couple of sample "sent" reminders for the first deadline so
        // the Activity page isn't empty in the demo.
        if (inserted && inserted.length) {
          const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
          const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
          await supabase.from('reminder_log').insert([
            {
              deadline_id: inserted[0].id,
              channel: 'email',
              lead_time: 30,
              sent_at: sevenDaysAgo,
              status: 'sent',
            },
            {
              deadline_id: inserted[0].id,
              channel: 'email',
              lead_time: 7,
              sent_at: twoDaysAgo,
              status: 'sent',
            },
          ]);
          reminderCount += 2;
        }
      }
    }
  }

  console.log(
    `Seeded ${properties.length} properties, ${leaseCount} leases, ${deadlineCount} deadlines, ${reminderCount} sample reminders.`,
  );
  console.log(`\nSign in at /login with:\n  email:    ${DEMO_EMAIL}\n  password: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
