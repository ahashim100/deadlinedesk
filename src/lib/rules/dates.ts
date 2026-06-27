// Small, dependency-free date helpers for the rules engine.
// We deliberately work in plain YYYY-MM-DD strings (UTC) to avoid timezone
// drift between the browser, the server, and the Postgres `date` type.

/** Parse a YYYY-MM-DD string into a UTC Date (midnight). */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format a Date back to YYYY-MM-DD (UTC). */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Add `days` to a YYYY-MM-DD string and return a new YYYY-MM-DD string. */
export function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

/** Subtract `days` from a YYYY-MM-DD string. */
export function subDays(iso: string, days: number): string {
  return addDays(iso, -days);
}
