// Minimal iCalendar (.ics) generation — no dependencies.
// Produces all-day VEVENTs that calendar apps (Google/Apple/Outlook) can
// subscribe to.

export interface IcsEvent {
  uid: string;
  /** YYYY-MM-DD */
  date: string;
  summary: string;
  description?: string;
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** YYYY-MM-DD -> YYYYMMDD */
function toIcsDate(iso: string): string {
  return iso.replace(/-/g, '');
}

/** Next day (for all-day DTEND, which is exclusive). */
function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return toIcsDate(dt.toISOString().slice(0, 10));
}

function fold(line: string): string {
  // RFC 5545 recommends folding lines longer than 75 octets.
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    chunks.push(' ' + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) chunks.push(' ' + rest);
  return chunks.join('\r\n');
}

export function buildIcs(calendarName: string, events: IcsEvent[]): string {
  const stamp =
    new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DeadlineDesk//Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(e.date)}`,
      `DTEND;VALUE=DATE:${nextDay(e.date)}`,
      fold(`SUMMARY:${escapeText(e.summary)}`),
    );
    if (e.description) {
      lines.push(fold(`DESCRIPTION:${escapeText(e.description)}`));
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
