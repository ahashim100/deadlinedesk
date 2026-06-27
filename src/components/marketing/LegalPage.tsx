import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

// Shared shell for /terms and /privacy. Body text is passed as plain strings
// (not JSX) so legal copy can use apostrophes freely.
export default function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>

        {/* Prominent, honest disclaimer that this is a template. */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This is a starting-point template, not legal advice. Have a qualified
          attorney review and adapt it before you rely on it in production.
        </div>

        <p className="mt-6 text-slate-700">{intro}</p>

        <div className="mt-8 space-y-8">
          {sections.map((s, i) => (
            <section key={s.heading}>
              <h2 className="text-lg font-semibold text-slate-900">
                {i + 1}. {s.heading}
              </h2>
              <div className="mt-2 space-y-3">
                {s.paragraphs.map((p, j) => (
                  <p key={j} className="text-sm leading-relaxed text-slate-700">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
