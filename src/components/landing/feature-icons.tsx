/* Animated SVG icons for the feature grid. All motion is CSS (globals.css › .fi-*) and disabled under reduced motion. */

const L = "var(--accent)";
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function BookingIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 text-white/80" aria-hidden>
      <rect x="6" y="9" width="36" height="32" rx="6" {...stroke} />
      <path d="M6 18h36M15 5v8M33 5v8" {...stroke} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={11 + (i % 3) * 9} y={23 + Math.floor(i / 3) * 8} width="6" height="5" rx="1.5" fill={L} className="fi-slot" style={{ animationDelay: `${i * 0.35}s` }} />
      ))}
    </svg>
  );
}

export function QrIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 text-white/80" aria-hidden>
      <path d="M8 16V8h8M32 8h8v8M40 32v8h-8M16 40H8v-8" {...stroke} />
      {[[14, 14], [28, 14], [14, 28]].map(([x, y]) => (
        <rect key={`${x}${y}`} x={x} y={y} width="7" height="7" rx="1" fill="currentColor" />
      ))}
      <rect x="28" y="28" width="3" height="3" fill="currentColor" /><rect x="33" y="28" width="3" height="3" fill="currentColor" /><rect x="28" y="33" width="3" height="3" fill="currentColor" /><rect x="33" y="33" width="3" height="3" fill={L} />
      <rect x="6" y="10" width="36" height="2" rx="1" fill={L} className="fi-scan" />
    </svg>
  );
}

export function ChartIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 text-white/80" aria-hidden>
      <path d="M8 40h34M8 8v32" {...stroke} />
      {[14, 22, 30, 38].map((x, i) => (
        <rect key={x} x={x - 3} y={40 - [12, 18, 15, 26][i]} width="6" height={[12, 18, 15, 26][i]} rx="2" fill={i === 3 ? L : "currentColor"} className="fi-bar" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
      <path d="M11 24 L19 18 L27 21 L35 10" {...stroke} stroke={L} className="fi-line" pathLength={1} />
    </svg>
  );
}

export function BillingIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 text-white/80" aria-hidden>
      <rect x="5" y="12" width="38" height="24" rx="5" {...stroke} />
      <path d="M5 20h38" {...stroke} />
      <rect x="10" y="26" width="10" height="4" rx="1" fill="currentColor" />
      <circle cx="35" cy="28" r="4" fill={L} className="fi-pulse" />
      <circle cx="35" cy="28" r="4" fill="none" stroke={L} strokeWidth="1.5" className="fi-ring" />
    </svg>
  );
}

export function AttendanceIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 text-white/80" aria-hidden>
      <circle cx="18" cy="16" r="6" {...stroke} />
      <path d="M7 38c0-7 5-11 11-11s11 4 11 11" {...stroke} />
      <circle cx="35" cy="32" r="8" fill={L} className="fi-pop" />
      <path d="M31 32l3 3 5-6" fill="none" stroke="#0b0c0f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="fi-tick" pathLength={1} />
    </svg>
  );
}

export function NotifyIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 text-white/80" aria-hidden>
      <g className="fi-bell">
        <path d="M14 32V22a10 10 0 0 1 20 0v10l3 4H11l3-4Z" {...stroke} />
        <path d="M20 39a4 4 0 0 0 8 0" {...stroke} />
      </g>
      <circle cx="34" cy="14" r="5" fill={L} className="fi-pulse" />
    </svg>
  );
}
