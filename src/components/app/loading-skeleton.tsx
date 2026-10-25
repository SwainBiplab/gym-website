/** Route-level loading state for the operational surface. */
export function LoadingSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <div className="mb-8 space-y-3">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-9 w-72 rounded bg-white/10" />
        <div className="h-4 w-96 max-w-full rounded bg-white/6" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass glass-sm h-28" />
        ))}
      </div>
      <div className="glass mt-6 h-80" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
