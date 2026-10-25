import { PanelShell } from "./panel-shell";

// Deterministic pseudo-QR pattern (decorative only).
const N = 13;
const CELLS: boolean[] = Array.from({ length: N * N }, (_, i) => {
  const x = i % N;
  const y = Math.floor(i / N);
  const finder = (x < 4 && y < 4) || (x > N - 5 && y < 4) || (x < 4 && y > N - 5);
  if (finder) return !((x === 1 || x === 2) && (y === 1 || y === 2)) ? (x === 0 || y === 0 || x === 3 || y === 3 || (x >= 1 && x <= 2 && y >= 1 && y <= 2)) : true;
  return ((x * 7 + y * 13 + ((x * y) % 5)) % 3) === 0;
});

export function QrCheckInPanel({ className }: { className?: string }) {
  const size = 78;
  const cell = size / N;
  return (
    <PanelShell step={1} title="QR check-in" depth={2} delay={1.4} className={className} icon={<span className="hero-pill">Live</span>}>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0 rounded-lg bg-white p-1.5">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            {CELLS.map((on, i) => on && <rect key={i} x={(i % N) * cell} y={Math.floor(i / N) * cell} width={cell} height={cell} fill="#0b0c0f" />)}
            <rect className="hero-scanline" x="0" y="0" width={size} height="3" fill="var(--accent)" />
          </svg>
          <span className="hero-confirm absolute inset-0 grid place-items-center rounded-lg bg-[var(--accent)]/90">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0b0c0f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">Maya T.</p>
          <p className="text-[11px] text-white/60">Pro · 06:42</p>
          <p className="hero-confirm-text mt-1 text-[11px] font-medium text-accent">Checked in ✓</p>
        </div>
      </div>
    </PanelShell>
  );
}
