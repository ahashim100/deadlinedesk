// Keeps a lease's rule-derived deadlines in sync with its fields.
// Manual deadlines are never touched.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Lease } from '@/lib/database.types';
import { deriveDeadlines, type LeaseInput } from '@/lib/rules';

type DB = SupabaseClient<Database>;

function toLeaseInput(lease: Lease): LeaseInput {
  return {
    lease_start: lease.lease_start,
    lease_end: lease.lease_end,
    monthly_rent: lease.monthly_rent,
    deposit_amount: lease.deposit_amount,
    move_out_date: lease.move_out_date,
    rent_increase_notice_days: lease.rent_increase_notice_days,
    license_renewal_date: lease.license_renewal_date,
    insurance_renewal_date: lease.insurance_renewal_date,
    inspection_date: lease.inspection_date,
  };
}

/**
 * Re-derive rule deadlines for a lease and persist them:
 *  - upsert each derived deadline (one per type, see unique index)
 *  - delete rule deadlines whose type no longer applies (e.g. a cleared
 *    move-out date removes the deposit-return deadline)
 *  - preserve done/dismissed status when a deadline already exists
 */
export async function syncLeaseDeadlines(
  supabase: DB,
  lease: Lease,
  state: string,
): Promise<void> {
  const derived = deriveDeadlines(toLeaseInput(lease), state);
  const derivedTypes = derived.map((d) => d.type);

  // Existing rule deadlines for this lease.
  const { data: existing } = await supabase
    .from('deadlines')
    .select('id, type, due_date, status, due_date_overridden')
    .eq('lease_id', lease.id)
    .eq('source', 'rule');

  const existingByType = new Map(
    (existing ?? []).map((d) => [d.type, d]),
  );

  // Upsert derived deadlines.
  for (const d of derived) {
    const prior = existingByType.get(d.type);
    if (prior) {
      // Only update the date; keep the landlord's done/dismissed choice, and
      // never overwrite a date the landlord manually snoozed/rescheduled.
      if (prior.due_date !== d.due_date && !prior.due_date_overridden) {
        await supabase
          .from('deadlines')
          .update({ due_date: d.due_date })
          .eq('id', prior.id);
      }
    } else {
      await supabase.from('deadlines').insert({
        lease_id: lease.id,
        type: d.type,
        due_date: d.due_date,
        status: 'upcoming',
        source: 'rule',
      });
    }
  }

  // Remove rule deadlines that no longer apply.
  const stale = (existing ?? []).filter(
    (d) => !derivedTypes.includes(d.type),
  );
  if (stale.length > 0) {
    await supabase
      .from('deadlines')
      .delete()
      .in(
        'id',
        stale.map((d) => d.id),
      );
  }
}
