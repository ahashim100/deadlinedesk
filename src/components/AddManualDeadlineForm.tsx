'use client';

import { useActionState, useState } from 'react';
import { addManualDeadline } from '@/lib/actions/deadlines';
import { DEADLINE_LABELS, type DeadlineType } from '@/lib/database.types';

const TYPES = Object.entries(DEADLINE_LABELS) as [DeadlineType, string][];

export default function AddManualDeadlineForm({ leaseId }: { leaseId: string }) {
  const action = addManualDeadline.bind(null, leaseId);
  const [state, formAction, pending] = useActionState(action, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        + Add manual deadline
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Type</span>
        <select
          name="type"
          className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
          defaultValue="inspection"
        >
          {TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Due date</span>
        <input
          name="due_date"
          type="date"
          required
          className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? 'Adding…' : 'Add'}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
      >
        Cancel
      </button>
      {state.error && (
        <p className="w-full text-sm text-red-700">{state.error}</p>
      )}
    </form>
  );
}
