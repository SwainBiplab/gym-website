/** Static fallback: shown while the 3D scene loads, when WebGL is unavailable, or under prefers-reduced-motion. */
export function HeroPoster() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Brushed titanium dumbbell with lime accents">
      <defs>
        <linearGradient id="hp-metal" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#5a5d64" />
          <stop offset="0.35" stopColor="#2b2d32" />
          <stop offset="0.6" stopColor="#1a1b1f" />
          <stop offset="1" stopColor="#3b3e45" />
        </linearGradient>
        <linearGradient id="hp-bar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7a7e86" />
          <stop offset="0.5" stopColor="#24262a" />
          <stop offset="1" stopColor="#5a5e66" />
        </linearGradient>
        <radialGradient id="hp-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <filter id="hp-shadow"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <ellipse cx="400" cy="440" rx="260" ry="34" fill="#000" opacity="0.7" filter="url(#hp-shadow)" />
      <ellipse cx="400" cy="300" rx="330" ry="150" fill="url(#hp-glow)" />
      <g transform="rotate(-14 400 300)">
        <rect x="150" y="286" width="500" height="28" rx="14" fill="url(#hp-bar)" />
        {[
          [120, 70, 84], [160, 60, 72], [195, 50, 60],
          [605, 50, 60], [640, 60, 72], [680, 70, 84],
        ].map(([x, w, r], i) => (
          <g key={i}>
            <rect x={x - w / 2} y={300 - r} width={w} height={r * 2} rx="10" fill="url(#hp-metal)" stroke="#6b6f78" strokeWidth="1.5" />
            <rect x={x - w / 2 + 6} y={300 - r + 8} width="3" height={r * 2 - 16} rx="1.5" fill="var(--accent)" opacity={i === 0 || i === 5 ? 0.9 : 0.25} />
          </g>
        ))}
      </g>
    </svg>
  );
}
