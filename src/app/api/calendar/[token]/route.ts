// Public calendar feed. Authenticated by the secret token in the URL (calendar
// apps can't log in), so it uses the service-role client. Pro-gated.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildIcs, type IcsEvent } from '@/lib/ics';
import { DEADLINE_LABELS } from '@/lib/database.types';
import { ACTIVE_SUBSCRIPTION_STATUSES } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('id, subscription_status')
    .eq('calendar_token', token)
    .single();

  // Unknown token -> 404. Don't reveal anything.
  if (!profile) {
    return new NextResponse('Not found', { status: 404 });
  }

  let events: IcsEvent[] = [];

  // Calendar sync is a Pro feature; only populate when subscribed.
  if (ACTIVE_SUBSCRIPTION_STATUSES.includes(profile.subscription_status)) {
    const { data: deadlines } = await admin
      .from('deadlines')
      .select(
        `id, type, due_date, status,
         lease:leases!inner(
           tenant_name,
           unit:units!inner(
             unit_label,
             property:properties!inner(nickname, user_id)
           )
         )`,
      )
      .eq('status', 'upcoming');

    // Scope to this user (service role bypasses RLS).
    // deno-lint friendly cast
    const rows = (deadlines ?? []) as unknown as Array<{
      id: string;
      type: keyof typeof DEADLINE_LABELS;
      due_date: string;
      lease: {
        tenant_name: string | null;
        unit: { unit_label: string; property: { nickname: string; user_id: string } };
      };
    }>;

    events = rows
      .filter((d) => d.lease.unit.property.user_id === profile.id)
      .map((d) => {
        const where = `${d.lease.unit.property.nickname} · ${d.lease.unit.unit_label}`;
        return {
          uid: `${d.id}@deadlinedesk`,
          date: d.due_date,
          summary: `${DEADLINE_LABELS[d.type]} — ${d.lease.unit.property.nickname}`,
          description:
            `${DEADLINE_LABELS[d.type]} for ${where}` +
            (d.lease.tenant_name ? ` (${d.lease.tenant_name})` : ''),
        };
      });
  }

  const ics = buildIcs('DeadlineDesk', events);

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="deadlinedesk.ics"',
      // Let calendar clients re-poll periodically.
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
