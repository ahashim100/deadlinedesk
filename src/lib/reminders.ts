// Reminder scheduling logic, shared and unit-tested.
//
// NOTE: the Edge Function (supabase/functions/daily-reminders/index.ts) runs in
// Deno and keeps its own copy of `currentBucket`. Keep the two in sync — this
// module is the tested source of truth for the algorithm.

/**
 * Which lead-time milestone a deadline has reached: the smallest configured
 * lead time L such that L >= daysUntil. Returns null when the deadline is
 * further out than the largest lead time (no reminder yet).
 *
 * Picking the *smallest* eligible lead time means that as a deadline gets
 * closer it advances through milestones (60 → 30 → 7 → 1), sending one reminder
 * per milestone, and that a missed daily run still catches up (because the
 * comparison is `>=`, not `===`).
 */
export function currentBucket(
  daysUntil: number,
  leadTimes: number[],
): number | null {
  const eligible = leadTimes
    .filter((l) => l >= daysUntil)
    .sort((a, b) => a - b);
  return eligible.length ? eligible[0] : null;
}
