import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Signature ring: a thin charcoal track with a lime arc and a spark at the arc's end.
 * Used for membership period, class fill, streaks. `value` is 0..1.
 */
export function ProgressRing({ value, size = 72, stroke = 6, label, sublabel, tone = "lime", className, children }: {
  value: number; size?: number; stroke?: number; label?: ReactNode; sublabel?: ReactNode; tone?: "lime" | "steel" | "coral"; className?: string; children?: ReactNode;
}) {
  const v = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = tone === "coral" ? "#ff7a7a" : tone === "steel" ? "#9fb3c8" : "var(--accent)";
  const angle = -90 + v * 360;
  const sx = size / 2 + r * Math.cos((angle * Math.PI) / 180);
  const sy = size / 2 + r * Math.sin((angle * Math.PI) / 180);
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`} className="ring-arc" style={{ ["--c" as string]: c, ["--off" as string]: c * (1 - v) }} />
        {v > 0 && <circle cx={sx} cy={sy} r={stroke * 0.65} fill={color} className="ring-spark" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        {children ?? (
          <div>
            {label && <div className="text-base font-semibold tabular-nums">{label}</div>}
            {sublabel && <div className="mt-0.5 text-[11px] uppercase tracking-wide text-fg-subtle">{sublabel}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
