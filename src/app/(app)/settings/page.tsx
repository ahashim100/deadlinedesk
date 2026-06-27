import { getProfile, hasActiveSubscription, hasPro, requireUser } from '@/lib/auth';
import { startCheckout, openBillingPortal } from '@/lib/actions/billing';
import NotificationPrefsForm from '@/components/NotificationPrefsForm';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import CalendarFeed from '@/components/CalendarFeed';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  await requireUser();
  const { checkout } = await searchParams;
  const profile = await getProfile();
  const active = hasActiveSubscription(profile);
  const isPro = hasPro(profile);
  const tier = profile?.subscription_tier ?? 'free';

  if (!profile) {
    return (
      <p className="text-sm text-slate-600">
        Couldn&apos;t load your profile. Try signing out and back in.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {checkout === 'success' && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Subscription active — your reminders are now on. (It may take a moment
          to reflect below while Stripe confirms.)
        </div>
      )}
      {checkout === 'cancelled' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Checkout cancelled — no charge was made. You can subscribe anytime
          below.
        </div>
      )}

      {/* Notifications */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold">Notifications</h2>
        <p className="mb-5 text-sm text-slate-500">
          How and when DeadlineDesk reminds you.
        </p>
        <NotificationPrefsForm profile={profile} />
      </section>

      {/* Calendar feed (Pro) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-lg font-semibold">Calendar sync</h2>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
            Pro
          </span>
        </div>
        {isPro ? (
          <div className="mt-4">
            <CalendarFeed
              url={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/calendar/${profile.calendar_token}`}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Upgrade to Pro to sync your deadlines to Google, Apple, or Outlook Calendar.
          </p>
        )}
      </section>

      {/* Account */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold">Account</h2>
        <p className="mb-5 text-sm text-slate-500">
          Signed in as {profile.email}.
        </p>
        <ChangePasswordForm />
      </section>

      {/* Billing */}
      <section
        id="billing"
        className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <h2 className="mb-1 text-lg font-semibold">Billing</h2>
        <p className="mb-5 text-sm text-slate-500">
          Base ($9.99/mo) unlocks email &amp; SMS reminders. Pro ($19.99/mo) adds
          calendar sync, weekly digest, and CC recipients.
        </p>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
              tier === 'pro'
                ? 'bg-purple-100 text-purple-800'
                : tier === 'base'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-slate-100 text-slate-700'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                tier === 'pro'
                  ? 'bg-purple-500'
                  : tier === 'base'
                    ? 'bg-green-500'
                    : 'bg-slate-400'
              }`}
            />
            {tier === 'pro'
              ? 'Pro plan'
              : tier === 'base'
                ? 'Base plan'
                : 'Free plan'}
          </span>
        </div>

        <div className="mt-5">
          {active ? (
            <form action={openBillingPortal}>
              <button className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Manage subscription
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-3">
              <form action={startCheckout}>
                <input type="hidden" name="plan" value="base" />
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                  Subscribe Base — $9.99/mo
                </button>
              </form>
              <form action={startCheckout}>
                <input type="hidden" name="plan" value="pro" />
                <button className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Subscribe Pro — $19.99/mo
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
