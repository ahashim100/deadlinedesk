// Shown while the dashboard's data is loading.
export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-40 rounded bg-slate-200" />
      <div className="mb-6 h-9 w-72 rounded-lg bg-slate-200" />
      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="h-20 rounded-xl border border-slate-200 bg-white">
            <div className="flex h-full items-center gap-4 p-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="h-3 w-56 rounded bg-slate-100" />
              </div>
              <div className="h-6 w-16 rounded-full bg-slate-100" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
