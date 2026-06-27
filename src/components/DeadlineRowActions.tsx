'use client';

import { useState, useTransition } from 'react';
import {
  setDeadlineStatus,
  completeWithNote,
  snoozeDeadline,
} from '@/lib/actions/deadlines';
import { addDays } from '@/lib/rules/dates';

export default function DeadlineRowActions({
  deadlineId,
  leaseId,
  dueDate,
  status,
}: {
  deadlineId: string;
  leaseId: string;
  dueDate: string;
  status: 'upcoming' | 'done' | 'dismissed';
}) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<'idle' | 'note' | 'snooze'>('idle');
  const [note, setNote] = useState('');
  const [customDate, setCustomDate] = useState('');

  if (status !== 'upcoming') {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => setDeadlineStatus(deadlineId, 'upcoming', leaseId))}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Reopen
      </button>
    );
  }

  if (mode === 'note') {
    return (
      <div className="flex w-full flex-wrap items-center gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you do? (optional, for your records)"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await completeWithNote(deadlineId, leaseId, note || null);
              setMode('idle');
              setNote('');
            })
          }
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
        >
          Save as done
        </button>
        <button
          type="button"
          onClick={() => setMode('idle')}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (mode === 'snooze') {
    const snoozeTo = (date: string) =>
      start(async () => {
        await snoozeDeadline(deadlineId, leaseId, date);
        setMode('idle');
      });
    return (
      <div className="flex w-full flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Snooze:</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => snoozeTo(addDays(dueDate, 7))}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          +1 week
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => snoozeTo(addDays(dueDate, 30))}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          +1 month
        </button>
        <input
          type="date"
          value={customDate}
          onChange={(e) => setCustomDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
        />
        <button
          type="button"
          disabled={pending || !customDate}
          onClick={() => customDate && snoozeTo(customDate)}
          className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Set
        </button>
        <button
          type="button"
          onClick={() => setMode('idle')}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setMode('note')}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
      >
        Mark done
      </button>
      <button
        type="button"
        onClick={() => setMode('snooze')}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Snooze
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => setDeadlineStatus(deadlineId, 'dismissed', leaseId))}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Dismiss
      </button>
    </div>
  );
}
