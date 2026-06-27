'use client';

import { useActionState } from 'react';
import { updateNotificationPrefs } from '@/lib/actions/settings';
import type { Profile } from '@/lib/database.types';

export default function NotificationPrefsForm({
  profile,
}: {
  profile: Profile;
}) {
  const [state, formAction, pending] = useActionState(
    updateNotificationPrefs,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="block text-sm font-medium text-slate-800">
            Email reminders
          </span>
          <span className="block text-xs text-slate-500">
            Sent to {profile.email}
          </span>
        </span>
        <input
          type="checkbox"
          name="notify_email"
          defaultChecked={profile.notify_email}
          className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      </label>

      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="block text-sm font-medium text-slate-800">
            SMS reminders
          </span>
          <span className="block text-xs text-slate-500">
            Standard message rates may apply.
          </span>
        </span>
        <input
          type="checkbox"
          name="notify_sms"
          defaultChecked={profile.notify_sms}
          className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-800">
          Phone number (for SMS)
        </span>
        <input
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ''}
          placeholder="+1 555 123 4567"
          className="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-800">
          Reminder lead times (days before)
        </span>
        <input
          name="lead_times"
          defaultValue={(profile.lead_times ?? [60, 30, 7, 1]).join(', ')}
          placeholder="60, 30, 7, 1"
          className="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Comma-separated. You&apos;ll get a reminder this many days before each
          deadline.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-800">
          Also email these people (CC)
        </span>
        <input
          name="cc_recipients"
          defaultValue={(profile.cc_recipients ?? []).join(', ')}
          placeholder="partner@example.com, manager@example.com"
          className="mt-1 block w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Up to 5 extra email addresses (e.g. a partner or property manager) get
          the same reminders.
        </span>
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save preferences'}
      </button>
    </form>
  );
}
