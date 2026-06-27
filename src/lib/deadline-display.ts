// Urgency styling for deadlines, shared by the dashboard and lease detail.
import { daysUntil } from '@/lib/format';

export type Urgency = 'overdue' | 'critical' | 'soon' | 'upcoming';

/**
 * Bucket a deadline by how soon it's due:
 *  - overdue:   due date has passed
 *  - critical:  within 7 days
 *  - soon:      within 30 days
 *  - upcoming:  further out
 */
export function urgencyFor(dueDateIso: string): Urgency {
  const d = daysUntil(dueDateIso);
  if (d < 0) return 'overdue';
  if (d <= 7) return 'critical';
  if (d <= 30) return 'soon';
  return 'upcoming';
}

interface UrgencyStyle {
  /** Pill / badge classes. */
  badge: string;
  /** Left accent border classes for cards/rows. */
  accent: string;
  label: string;
}

export const URGENCY_STYLES: Record<Urgency, UrgencyStyle> = {
  overdue: {
    badge: 'bg-red-100 text-red-800 ring-1 ring-red-200',
    accent: 'border-l-red-500',
    label: 'Overdue',
  },
  critical: {
    badge: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200',
    accent: 'border-l-orange-500',
    label: 'Due soon',
  },
  soon: {
    badge: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    accent: 'border-l-amber-400',
    label: 'This month',
  },
  upcoming: {
    badge: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    accent: 'border-l-slate-300',
    label: 'Upcoming',
  },
};

/** Sort key: overdue first, then soonest due date. */
export function urgencyRank(dueDateIso: string): number {
  return daysUntil(dueDateIso);
}
