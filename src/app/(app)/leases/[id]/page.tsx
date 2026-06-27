import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DEADLINE_LABELS } from '@/lib/database.types';
import type { Deadline } from '@/lib/database.types';
import { formatDateLong, formatMoney, relativeDays } from '@/lib/format';
import { urgencyFor, URGENCY_STYLES, urgencyRank } from '@/lib/deadline-display';
import { deleteDeadline } from '@/lib/actions/deadlines';
import { deleteProperty } from '@/lib/actions/properties';
import AddManualDeadlineForm from '@/components/AddManualDeadlineForm';
import DeadlineRowActions from '@/components/DeadlineRowActions';
import ConfirmButton from '@/components/ConfirmButton';

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: lease } = await supabase
    .from('leases')
    .select(
      `*, deadlines(*),
       unit:units!inner(
         id, unit_label,
         property:properties!inner(id, nickname, address, state)
       )`,
    )
    .eq('id', id)
    .single();

  if (!lease) notFound();

  const l = lease as unknown as {
    [k: string]: unknown;
    tenant_name: string | null;
    tenant_email: string | null;
    lease_start: string | null;
    lease_end: string | null;
    monthly_rent: number | null;
    deposit_amount: number | null;
    deadlines: Deadline[];
    unit: {
      id: string;
      unit_label: string;
      property: {
        id: string;
        nickname: string;
        address: string | null;
        state: string;
      };
    };
  };

  const property = l.unit.property;
  const deadlines = [...(l.deadlines ?? [])].sort(
    (a, b) => urgencyRank(a.due_date) - urgencyRank(b.due_date),
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to dashboard
        </Link>
      </div>

      {/* Lease header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {property.nickname}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {l.unit.unit_label}
            {property.address ? ` · ${property.address}` : ''} · {property.state}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/leases/${id}/edit`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
          <ConfirmButton
            action={deleteProperty.bind(null, property.id)}
            confirmText={`Delete "${property.nickname}" and all its leases and deadlines? This can't be undone.`}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </ConfirmButton>
        </div>
      </div>

      {/* Lease facts */}
      <dl className="mb-8 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-4">
        <Fact label="Tenant" value={l.tenant_name ?? '—'} />
        <Fact
          label="Lease term"
          value={
            l.lease_start || l.lease_end
              ? `${l.lease_start ? formatDateLong(l.lease_start) : '—'} → ${
                  l.lease_end ? formatDateLong(l.lease_end) : '—'
                }`
              : '—'
          }
        />
        <Fact label="Rent" value={formatMoney(l.monthly_rent)} />
        <Fact label="Deposit" value={formatMoney(l.deposit_amount)} />
      </dl>

      {/* Deadlines */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Deadlines</h2>
        <AddManualDeadlineForm leaseId={id} />
      </div>

      {deadlines.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          No deadlines yet. Add lease dates (or a manual deadline) to start
          tracking.
        </p>
      ) : (
        <ul className="space-y-3">
          {deadlines.map((d) => {
            const urgency = urgencyFor(d.due_date);
            const style = URGENCY_STYLES[urgency];
            const isOpen = d.status === 'upcoming';
            return (
              <li
                key={d.id}
                className={`rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${
                  isOpen ? style.accent : 'border-l-slate-200 opacity-70'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {DEADLINE_LABELS[d.type]}
                      </span>
                      {d.source === 'manual' && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          manual
                        </span>
                      )}
                      {d.status !== 'upcoming' && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-500">
                          {d.status}
                        </span>
                      )}
                      {isOpen && d.due_date_overridden && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                          snoozed
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {formatDateLong(d.due_date)}
                      {isOpen && (
                        <span
                          className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
                        >
                          {relativeDays(d.due_date)}
                        </span>
                      )}
                    </p>
                    {d.status === 'done' && (d.completed_at || d.completion_note) && (
                      <p className="mt-1 text-xs text-slate-500">
                        ✓ Completed
                        {d.completed_at
                          ? ` ${new Date(d.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                          : ''}
                        {d.completion_note ? ` — “${d.completion_note}”` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <DeadlineRowActions
                      deadlineId={d.id}
                      leaseId={id}
                      dueDate={d.due_date}
                      status={d.status}
                    />
                    {d.source === 'manual' && (
                      <ConfirmButton
                        action={deleteDeadline.bind(null, d.id, id)}
                        confirmText="Delete this manual deadline?"
                        className="rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
                      >
                        Delete
                      </ConfirmButton>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
