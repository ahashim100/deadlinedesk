'use client';

import { useState, useTransition } from 'react';
import { regenerateCalendarToken } from '@/lib/actions/calendar';

export default function CalendarFeed({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked; the input is selectable as a fallback.
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        Subscribe to this URL in Google, Apple, or Outlook Calendar to see your
        deadlines alongside the rest of your schedule. It updates automatically.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          if (
            window.confirm(
              'Generate a new link? Your old subscribed calendars will stop updating.',
            )
          ) {
            start(() => regenerateCalendarToken());
          }
        }}
        disabled={pending}
        className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-700"
      >
        {pending ? 'Working…' : 'Reset link'}
      </button>
    </div>
  );
}
