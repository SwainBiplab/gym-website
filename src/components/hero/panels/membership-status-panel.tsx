import { PanelShell } from "./panel-shell";

export function MembershipStatusPanel({ className }: { className?: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = 0.62; // days used in the billing period
  return (
    <PanelShell step={3} title="Membership" depth={2} delay={2.1} className={className}>
      <div className="flex items-center gap-3">
        <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0" aria-hidden>
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 32 32)" className="hero-arc" style={{ ["--c" as string]: c, ["--off" as string]: c * (1 - pct) }} />
          <text x="32" y="36" textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff">
            12d
          </text>
        </svg>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" /> Active
          </p>
          <p className="text-[11px] text-white/60">Elite · renews 7 Nov</p>
          <p className="text-[11px] text-white/60">Auto-pay · Visa ··42</p>
        </div>
      </div>
    </PanelShell>
  );
}
