import Link from 'next/link';
import { getUpcomingDeadlines } from '@/lib/queries';
import { DEADLINE_LABELS } from '@/lib/database.types';
import { formatDateLong, daysUntil, relativeDays } from '@/lib/format';
import { urgencyFor, URGENCY_STYLES } from '@/lib/deadline-display';
import { setDeadlineStatus } from '@/lib/actions/deadlines';
import type { DeadlineType } from '@/lib/database.types';

const WINDOWS = [30, 60, 90] as const;
const TYPE_KEYS = Object.keys(DEADLINE_LABELS) as DeadlineType[];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string; type?: string }>;
}) {
  const params = await searchParams;
  const windowDays = WINDOWS.includes(Number(params.window) as 30 | 60 | 90)
    ? Number(params.window)
    : 90;
  const typeFilter = TYPE_KEYS.includes(params.type as DeadlineType)
    ? (params.type as DeadlineType)
    : null;

  const all = await getUpcomingDeadlines();

  // Show everything overdue plus anything due within the selected window,
  // optionally narrowed to a single deadline type.
  const visible = all.filter(
    (d) =>
      daysUntil(d.due_date) <= windowDays &&
      (typeFilter === null || d.type === typeFilter),
  );
  const overdueCount = all.filter((d) => daysUntil(d.due_date) < 0).length;

  // Helper to build a dashboard URL preserving the other filter.
  const buildHref = (next: { window?: number; type?: string | null }) => {
    const w = next.window ?? windowDays;
    const t = next.type === undefined ? typeFilter : next.type;
    const qs = new URLSearchParams({ window: String(w) });
    if (t) qs.set('type', t);
    return `/dashboard?${qs.toString()}`;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deadlines</h1>
          <p className="mt-1 text-sm text-slate-600">
            {visible.length === 0
              ? 'Nothing due in this window.'
              : `${visible.length} deadline${visible.length === 1 ? '' : 's'} coming up${
                  overdueCount ? ` · ${overdueCount} overdue` : ''
                }.`}
          </p>
        </div>
        <Link
          href="/properties/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add property
        </Link>
      </div>

      {/* Window selector */}
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm font-medium">
        {WINDOWS.map((w) => (
          <Link
            key={w}
            href={buildHref({ window: w })}
            className={`rounded-md px-3 py-1.5 transition ${
              windowDays === w
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Next {w} days
          </Link>
        ))}
      </div>

      {/* Type filter chips */}
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link
          href={buildHref({ type: null })}
          className={`rounded-full px-3 py-1 transition ${
            typeFilter === null
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
          }`}
        >
          All types
        </Link>
        {TYPE_KEYS.map((t) => (
          <Link
            key={t}
            href={buildHref({ type: t })}
            className={`rounded-full px-3 py-1 transition ${
              typeFilter === t
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
            }`}
          >
            {DEADLINE_LABELS[t]}
          </Link>
        ))}
      </div>

      {all.length === 0 ? (
        <EmptyState />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">
            No deadlines in the next {windowDays} days.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try a longer window above, or add another lease.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((d) => {
            const urgency = urgencyFor(d.due_date);
            const style = URGENCY_STYLES[urgency];
            const property = d.lease.unit.property;
            return (
              <li
                key={d.id}
                className={`flex items-center justify-between gap-4 rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm transition hover:shadow-md ${style.accent}`}
              >
                <Link
                  href={`/leases/${d.lease.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate font-semibold text-slate-900">
                    {DEADLINE_LABELS[d.type]}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-slate-600">
                    {property.nickname} · {d.lease.unit.unit_label}
                    {d.lease.tenant_name ? ` · ${d.lease.tenant_name}` : ''}
                  </p>
                </Link>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
                  >
                    {relativeDays(d.due_date)}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateLong(d.due_date)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <form action={setDeadlineStatus.bind(null, d.id, 'done', d.lease.id)}>
                    <button
                      className="w-full rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                      title="Mark this deadline done"
                    >
                      Done
                    </button>
                  </form>
                  <form
                    action={setDeadlineStatus.bind(null, d.id, 'dismissed', d.lease.id)}
                  >
                    <button
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      title="Dismiss this deadline"
                    >
                      Dismiss
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-2xl">
        📋
      </div>
      <h2 className="text-lg font-semibold text-slate-900">
        Add your first property
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Enter a property, its unit, and the lease details. DeadlineDesk
        automatically works out the dates you can&apos;t afford to miss —
        deposit returns, lease renewals, rent-increase notices and more.
      </p>
      <Link
        href="/properties/new"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        + Add your first property
      </Link>
    </div>
  );
}
