import Link from 'next/link';
import { getPropertiesWithUnits, summariseDeadlines } from '@/lib/queries';
import { formatDateLong, formatMoney, relativeDays } from '@/lib/format';

export default async function PropertiesPage() {
  const properties = await getPropertiesWithUnits();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
          <p className="mt-1 text-sm text-slate-600">
            {properties.length === 0
              ? 'No properties yet.'
              : `${properties.length} propert${properties.length === 1 ? 'y' : 'ies'}.`}
          </p>
        </div>
        <Link
          href="/properties/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Add your first property
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Properties hold your units and leases. DeadlineDesk derives the dates
            you can&apos;t afford to miss from each lease.
          </p>
          <Link
            href="/properties/new"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add your first property
          </Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {properties.map((property) => {
            const { upcoming, soonest } = summariseDeadlines(property);
            return (
            <li
              key={property.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {property.nickname}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {property.address ? `${property.address} · ` : ''}
                    {property.state}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {upcoming === 0
                      ? 'No upcoming deadlines'
                      : `${upcoming} upcoming deadline${upcoming === 1 ? '' : 's'}` +
                        (soonest ? ` · next ${relativeDays(soonest)}` : '')}
                  </p>
                </div>
                <Link
                  href={`/properties/${property.id}/leases/new`}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  + Add unit / lease
                </Link>
              </div>

              {property.units.length === 0 ? (
                <p className="text-sm text-slate-500">No units yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {property.units.flatMap((unit) =>
                    (unit.leases.length > 0
                      ? unit.leases
                      : [null]
                    ).map((lease, i) => (
                      <li
                        key={lease ? lease.id : `${unit.id}-empty-${i}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">
                            {unit.unit_label}
                            {lease?.tenant_name ? (
                              <span className="font-normal text-slate-500">
                                {' '}· {lease.tenant_name}
                              </span>
                            ) : null}
                          </p>
                          {lease ? (
                            <p className="text-xs text-slate-500">
                              {lease.lease_start || lease.lease_end
                                ? `${lease.lease_start ? formatDateLong(lease.lease_start) : '—'} → ${
                                    lease.lease_end
                                      ? formatDateLong(lease.lease_end)
                                      : '—'
                                  }`
                                : 'No lease term set'}
                              {lease.monthly_rent != null
                                ? ` · ${formatMoney(lease.monthly_rent)}/mo`
                                : ''}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400">No lease yet</p>
                          )}
                        </div>
                        {lease && (
                          <Link
                            href={`/leases/${lease.id}`}
                            className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            View →
                          </Link>
                        )}
                      </li>
                    )),
                  )}
                </ul>
              )}
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
