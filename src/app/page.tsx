import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';

// Public marketing home page. Signed-in users go straight to their dashboard.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <LogosStrip />
        <HowItWorks />
        <Features />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------------------------------------------------------------- Hero ---- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 to-white" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            For small independent landlords
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Never miss a date that costs you money.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">
            DeadlineDesk tracks the deadlines that actually matter — lease
            renewals, deposit returns, rent-increase notices, inspections,
            insurance and license renewals — and reminds you by email and text
            before they slip.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Get started free
            </Link>
            <Link
              href="/#pricing"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Free to add your properties · Reminders from $9.99/month · No credit card to start
          </p>
        </div>

        {/* Product preview */}
        <PreviewCard />
      </div>
    </section>
  );
}

function PreviewCard() {
  const rows = [
    { title: 'Lease renewal', sub: 'Oak Ave Single · Sam Rivera', when: 'Overdue', tone: 'red' },
    { title: 'License renewal', sub: 'Oak Ave Single', when: 'in 5 days', tone: 'orange' },
    { title: 'Inspection', sub: 'Maple St Duplex · Unit B', when: 'in 12 days', tone: 'amber' },
    { title: 'Deposit return', sub: 'Oak Ave Single', when: 'in 16 days', tone: 'amber' },
  ] as const;
  const tones: Record<string, { bar: string; pill: string }> = {
    red: { bar: 'bg-red-500', pill: 'bg-red-100 text-red-800' },
    orange: { bar: 'bg-orange-500', pill: 'bg-orange-100 text-orange-800' },
    amber: { bar: 'bg-amber-400', pill: 'bg-amber-100 text-amber-800' },
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60">
      <div className="mb-3 flex items-center justify-between px-2">
        <span className="text-sm font-semibold text-slate-900">Deadlines</span>
        <span className="text-xs text-slate-400">Next 90 days</span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.title}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 border-l-4 bg-white p-3"
            style={{ borderLeftColor: 'transparent' }}
          >
            <span className={`-ml-3 mr-1 h-10 w-1 rounded ${tones[r.tone].bar}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {r.title}
              </p>
              <p className="truncate text-xs text-slate-500">{r.sub}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${tones[r.tone].pill}`}
            >
              {r.when}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Logos ---- */
function LogosStrip() {
  const items = [
    'Lease renewals',
    'Deposit returns',
    'Rent-increase notices',
    'Inspections',
    'Insurance renewals',
    'License renewals',
  ];
  return (
    <section className="border-y border-slate-100 bg-slate-50/60">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-6 text-sm font-medium text-slate-500">
        <span className="text-slate-400">Tracks every deadline that bites:</span>
        {items.map((i) => (
          <span key={i}>{i}</span>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------- How it works -- */
function HowItWorks() {
  const steps = [
    {
      n: '1',
      title: 'Add a lease',
      body: 'Enter a property, unit and lease once — the dates you already have.',
    },
    {
      n: '2',
      title: 'We compute the deadlines',
      body: 'Rules turn those dates into the deadlines that matter, including state-specific ones like California’s 21-day deposit return.',
    },
    {
      n: '3',
      title: 'We remind you in time',
      body: 'Email and text reminders fire 60/30/7/1 days out — whether or not you ever open the app.',
    },
  ];
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          How it works
        </h2>
        <p className="mt-3 text-slate-600">
          Set it up in minutes. Stop carrying deadlines in your head.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {s.n}
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Features --- */
function Features() {
  const features = [
    {
      icon: '🧮',
      title: 'Deadlines computed for you',
      body: 'No calendar math. Enter a lease and the right deadlines appear automatically.',
    },
    {
      icon: '📨',
      title: 'Email + SMS reminders',
      body: 'Reminders reach you on your schedule and fire server-side, even if the app is closed.',
    },
    {
      icon: '⚖️',
      title: 'State-aware rules',
      body: 'California rules built in (deposit returns, rent-increase notice windows). More states to come.',
    },
    {
      icon: '📊',
      title: 'One clear dashboard',
      body: 'Everything due in the next 30/60/90 days, color-coded by urgency, across all your properties.',
    },
    {
      icon: '🏠',
      title: 'Built for 1–10 units',
      body: 'Properties, units and leases — simple enough for a duplex, organized enough for ten.',
    },
    {
      icon: '🔒',
      title: 'Private by design',
      body: 'Your data is isolated to your account with row-level security. We never sell it.',
    },
  ];
  return (
    <section id="features" className="scroll-mt-16 bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-3 text-slate-600">
            DeadlineDesk does one job well. It&apos;s not property management —
            no rent collection, no accounting, no tenant portal.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Pricing --- */
function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Simple, honest pricing
          </h2>
          <p className="mt-3 text-slate-600">
            Start free. Turn on reminders when you&apos;re ready. Cancel anytime.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8">
            <h3 className="text-lg font-semibold text-slate-900">Free</h3>
            <p className="mt-1 text-sm text-slate-500">
              See the value before you pay.
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold tracking-tight text-slate-900">
                $0
              </span>
              <span className="text-sm text-slate-500">/month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
              <Check>Add properties, units &amp; leases</Check>
              <Check>Automatic deadline calculation</Check>
              <Check>Full dashboard &amp; urgency view</Check>
              <Cross>Automated reminders</Cross>
            </ul>
            <Link
              href="/login"
              className="mt-8 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Get started free
            </Link>
          </div>

          {/* Base — Most popular */}
          <div className="relative flex flex-col rounded-2xl border-2 border-blue-600 bg-white p-8 shadow-lg shadow-blue-100">
            <span className="absolute -top-3 left-8 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              Most popular
            </span>
            <h3 className="text-lg font-semibold text-slate-900">Base</h3>
            <p className="mt-1 text-sm text-slate-500">
              Reminders that reach you.
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold tracking-tight text-slate-900">
                $9.99
              </span>
              <span className="text-sm text-slate-500">/month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
              <Check>Everything in Free</Check>
              <Check>Email reminders (daily)</Check>
              <Check>SMS / text reminders</Check>
              <Check>Snooze &amp; reschedule deadlines</Check>
              <Check>Completion records &amp; proof log</Check>
              <Cross>Calendar sync &amp; weekly digest</Cross>
            </ul>
            <Link
              href="/login"
              className="mt-8 rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Start with Base
            </Link>
          </div>

          {/* Pro */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8">
            <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
            <p className="mt-1 text-sm text-slate-500">
              Everything, automated.
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold tracking-tight text-slate-900">
                $19.99
              </span>
              <span className="text-sm text-slate-500">/month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
              <Check>Everything in Base</Check>
              <Check>Calendar sync (.ics feed)</Check>
              <Check>Weekly digest email</Check>
              <Check>CC recipients (up to 5)</Check>
            </ul>
            <Link
              href="/login"
              className="mt-8 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Start with Pro
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-green-600">✓</span>
      <span>{children}</span>
    </li>
  );
}
function Cross({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-slate-400">
      <span className="mt-0.5">✕</span>
      <span>{children}</span>
    </li>
  );
}

/* ----------------------------------------------------------------- FAQ --- */
function Faq() {
  const faqs = [
    {
      q: 'Is DeadlineDesk property management software?',
      a: 'No — and that’s on purpose. It doesn’t collect rent, do accounting, screen tenants, or handle maintenance. It does one job: make sure you never miss a deadline that costs you money.',
    },
    {
      q: 'How are the deadlines calculated?',
      a: 'A built-in rules engine turns your lease dates into deadlines. For example, in California a security deposit must be returned within 21 days of move-out, so entering a move-out date creates that deadline automatically.',
    },
    {
      q: 'Will reminders work if I never open the app?',
      a: 'Yes. Reminders are sent from our servers on a daily schedule by email and/or text, whether or not you log in. That’s the whole point.',
    },
    {
      q: 'Which states are supported?',
      a: 'California is supported in this version, with the rules structured so more states can be added. Always verify the specific legal timeframes for your jurisdiction.',
    },
    {
      q: 'Is this legal advice?',
      a: 'No. DeadlineDesk is a reminder tool, not a law firm. Verify deadlines and requirements with a qualified professional. See our Terms of Service for details.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. Manage or cancel your subscription anytime from Settings; your account and data stay accessible on the free tier.',
    },
  ];
  return (
    <section id="faq" className="scroll-mt-16 bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Frequently asked questions
        </h2>
        <div className="mt-10 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {faqs.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-900">
                {f.q}
                <span className="ml-4 text-slate-400 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Final CTA -- */
function FinalCta() {
  return (
    <section className="bg-blue-600">
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Stop carrying deadlines in your head.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-blue-100">
          Add your first property in minutes and let DeadlineDesk watch the
          calendar for you.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
        >
          Get started free
        </Link>
      </div>
    </section>
  );
}
