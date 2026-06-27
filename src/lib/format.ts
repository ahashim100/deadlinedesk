// Display formatting helpers.
import { parseDate } from '@/lib/rules/dates';

/** "Jun 26, 2026" from a YYYY-MM-DD string. */
export function formatDateLong(iso: string): string {
  return parseDate(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** "$1,500" from a number. Returns "—" for null. */
export function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Whole days from today (UTC) until the given date. Negative if past. */
export function daysUntil(iso: string): number {
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const target = parseDate(iso).getTime();
  return Math.round((target - todayUtc) / 86_400_000);
}

/** "in 12 days", "today", "3 days ago". */
export function relativeDays(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d === -1) return 'yesterday';
  if (d > 1) return `in ${d} days`;
  return `${Math.abs(d)} days ago`;
}
