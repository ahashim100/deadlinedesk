import Link from 'next/link';

// Shared footer for public marketing + legal pages.
export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                D
              </span>
              <span className="font-semibold tracking-tight">DeadlineDesk</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Deadline reminders for small landlords. Never miss a date that
              costs you money.
            </p>
          </div>

          <FooterColumn
            title="Product"
            links={[
              { label: 'Features', href: '/#features' },
              { label: 'Pricing', href: '/#pricing' },
              { label: 'FAQ', href: '/#faq' },
            ]}
          />
          <FooterColumn
            title="Account"
            links={[
              { label: 'Sign in', href: '/login' },
              { label: 'Create account', href: '/login' },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Privacy Policy', href: '/privacy' },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} DeadlineDesk. All rights reserved.</p>
          <p>
            DeadlineDesk sends reminders — it does not provide legal advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-slate-500 hover:text-slate-900">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
