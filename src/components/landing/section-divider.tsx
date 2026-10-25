/** Lime light-trail divider between sections. */
export function SectionDivider({ flip }: { flip?: boolean }) {
  return (
    <div className="pointer-events-none relative -my-8 h-24 w-full overflow-visible" aria-hidden>
      <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className={`h-full w-full ${flip ? "-scale-x-100" : ""}`}>
        <defs>
          <linearGradient id="sd-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--accent)" stopOpacity="0.9" />
            <stop offset="1" stopColor="#38d9c8" stopOpacity="0" />
          </linearGradient>
          <filter id="sd-glow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        <path d="M-20,70 C300,10 600,110 900,40 S1150,30 1220,60" fill="none" stroke="url(#sd-grad)" strokeWidth="6" filter="url(#sd-glow)" opacity="0.5" />
        <path d="M-20,70 C300,10 600,110 900,40 S1150,30 1220,60" fill="none" stroke="url(#sd-grad)" strokeWidth="1.5" className="divider-trail" pathLength={1} />
        <circle r="3" fill="var(--accent)" className="divider-spark">
          <animateMotion dur="7s" repeatCount="indefinite" path="M-20,70 C300,10 600,110 900,40 S1150,30 1220,60" />
        </circle>
      </svg>
    </div>
  );
}
