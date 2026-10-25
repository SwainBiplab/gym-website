import { addDays, format, startOfWeek, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Visit map: the brand's attendance visualization. 7 rows (Mon–Sun) × N weeks.
 * Cells are hex-ish rounded squares; intensity = visits that day, with a spark on the best day.
 */
export function AttendanceMap({ dates, weeks = 16, className }: { dates: Date[]; weeks?: number; className?: string }) {
  const end = new Date();
  const start = startOfWeek(subWeeks(end, weeks - 1), { weekStartsOn: 1 });
  const counts = new Map<string, number>();
  for (const d of dates) {
    const k = format(d, "yyyy-MM-dd");
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const max = Math.max(1, ...counts.values());
  const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  const total = dates.filter((d) => d >= start).length;
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const streak = (() => {
    let s = 0;
    for (let i = 0; i < 60; i++) {
      const k = format(addDays(end, -i), "yyyy-MM-dd");
      if (counts.get(k)) s++;
      else if (i > 0) break;
    }
    return s;
  })();
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-fg-muted">
          <span className="text-lg font-semibold text-fg tabular-nums">{total}</span> visits in {weeks} weeks
        </p>
        <p className="text-sm text-fg-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-accent align-middle shadow-[0_0_8px_var(--accent)]" /> {streak}-day streak
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1.5" style={{ minWidth: weeks * 18 }}>
          <div className="grid shrink-0 grid-rows-7 gap-1.5 pr-1 text-[10px] leading-3 text-fg-subtle">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="grid h-3 place-items-center">{d}</span>
            ))}
          </div>
          {cols.map((col, w) => (
            <div key={w} className="grid grid-rows-7 gap-1.5">
              {col.map((d) => {
                const k = format(d, "yyyy-MM-dd");
                const n = counts.get(k) ?? 0;
                const future = d > end;
                const a = n === 0 ? 0 : 0.35 + (n / max) * 0.65;
                const isBest = best && best[0] === k;
                return (
                  <span
                    key={k}
                    title={`${format(d, "EEE, MMM d")}: ${n} visit${n === 1 ? "" : "s"}`}
                    className={cn("h-3 w-3 rounded-[3px]", future && "opacity-20")}
                    style={{ background: n ? `rgba(200,250,95,${a})` : "rgba(255,255,255,0.07)", boxShadow: isBest ? "0 0 8px var(--accent)" : undefined }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-fg-subtle">{format(start, "MMM d")} → {format(end, "MMM d")} · darker lime = more visits that day</p>
    </div>
  );
}
