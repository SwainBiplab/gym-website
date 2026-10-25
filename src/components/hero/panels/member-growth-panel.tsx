import { PanelShell } from "./panel-shell";

const SPARK = [18, 22, 21, 27, 31, 30, 36, 41, 40, 47, 52, 58];

export function MemberGrowthPanel({ className }: { className?: string }) {
  const w = 160;
  const h = 40;
  const max = Math.max(...SPARK);
  const pts = SPARK.map((v, i) => `${(i / (SPARK.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <PanelShell step={2} title="Members" depth={1} delay={0.8} className={className} icon={<span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />}>
      <p className="text-2xl font-semibold tracking-tight text-white tabular-nums">
        <span className="hero-count" style={{ ["--to" as string]: 2481 }}>2,481</span>
      </p>
      <p className="mt-0.5 text-[11px] text-white/60">
        <span className="font-medium text-accent">+12.4%</span> this quarter
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-10 w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="mg-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#mg-fill)" />
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="hero-draw" pathLength={1} />
      </svg>
    </PanelShell>
  );
}
