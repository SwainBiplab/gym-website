import { PanelShell } from "./panel-shell";

const SERIES = [32, 35, 33, 40, 44, 43, 50, 56, 55, 63, 70, 78];

export function RevenuePanel({ className }: { className?: string }) {
  const w = 180;
  const h = 56;
  const max = 85;
  const pt = (v: number, i: number) => [(i / (SERIES.length - 1)) * w, h - (v / max) * h] as const;
  const d = SERIES.map((v, i) => {
    const [x, y] = pt(v, i);
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pt(SERIES[i - 1], i - 1);
    const cx = (px + x) / 2;
    return `C${cx},${py} ${cx},${y} ${x},${y}`;
  }).join(" ");
  const [lx, ly] = pt(SERIES.at(-1)!, SERIES.length - 1);
  return (
    <PanelShell step={4} title="Revenue · MRR" depth={3} delay={0.2} className={className}>
      <p className="text-2xl font-semibold tracking-tight text-white tabular-nums">$84.2k</p>
      <p className="mt-0.5 text-[11px] text-white/60">
        <span className="font-medium text-accent">▲ 9.8%</span> vs last month
      </p>
      <svg viewBox={`0 0 ${w} ${h + 6}`} className="mt-2 h-14 w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="rv-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        ))}
        <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#rv-fill)" className="hero-fade-in" />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" className="hero-draw" pathLength={1} />
        <circle cx={lx} cy={ly} r="3.5" fill="var(--accent)" className="hero-dot" />
        <circle cx={lx} cy={ly} r="3.5" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="hero-dot-pulse" />
      </svg>
    </PanelShell>
  );
}
