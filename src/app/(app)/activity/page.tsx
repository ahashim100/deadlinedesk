import { getReminderLog } from '@/lib/queries';
import { DEADLINE_LABELS } from '@/lib/database.types';
import { formatDateLong } from '@/lib/format';

function formatSentAt(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
};

export default async function ActivityPage() {
  const entries = await getReminderLog();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Reminder activity</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every email and SMS reminder DeadlineDesk has sent for your deadlines.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">No reminders sent yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Reminders appear here once the daily job sends them — they require an
            active subscription and deadlines coming within your lead times.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatSentAt(e.sent_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">
                      {DEADLINE_LABELS[e.deadline.type]}
                    </span>
                    <span className="block text-xs text-slate-500">
                      due {formatDateLong(e.deadline.due_date)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {e.deadline.lease.unit.property.nickname}
                    <span className="block text-xs text-slate-400">
                      {e.deadline.lease.unit.unit_label}
                      {e.deadline.lease.tenant_name
                        ? ` · ${e.deadline.lease.tenant_name}`
                        : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 uppercase text-slate-600">
                    {e.channel}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.lead_time}d</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        STATUS_STYLES[e.status] ?? 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
