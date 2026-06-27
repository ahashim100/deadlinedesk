import Link from 'next/link';
import { requireUser, getProfile, hasActiveSubscription } from '@/lib/auth';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();
  const profile = await getProfile();
  const active = hasActiveSubscription(profile);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              D
            </span>
            <span className="font-semibold tracking-tight">DeadlineDesk</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Dashboard
            </Link>
            <Link
              href="/properties"
              className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Properties
            </Link>
            <Link
              href="/activity"
              className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Activity
            </Link>
            <Link
              href="/settings"
              className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Settings
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      {!active && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-amber-900">
            <span>
              Reminders are paused — you won&apos;t get email/SMS alerts until you
              subscribe.
            </span>
            <Link
              href="/settings#billing"
              className="font-semibold underline underline-offset-2 hover:text-amber-950"
            >
              Turn on reminders →
            </Link>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Signed in as {user.email} · DeadlineDesk reminds you, it doesn&apos;t give
        legal advice.
      </footer>
    </div>
  );
}
