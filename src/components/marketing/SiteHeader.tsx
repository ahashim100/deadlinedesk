import Link from 'next/link';

// Shared top nav for public marketing pages (home, terms, privacy).
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            D
          </span>
          <span className="font-semibold tracking-tight">DeadlineDesk</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          <Link
            href="/#features"
            className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Features
          </Link>
          <Link
            href="/#pricing"
            className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Pricing
          </Link>
          <Link
            href="/#faq"
            className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
