"use client";
import { useId, useMemo, useState } from "react";

export type Point = { label: string; value: number; date?: string };

type Props = {
  points: Point[];
  unit?: string;
  color?: string;
  height?: number;
  decimals?: number;
  variant?: "line" | "bar";
  format?: "number" | "money";
};

/**
 * Single-series chart: 2px line / rounded bars, >=8px hover markers, recessive grid,
 * crosshair tooltip, and a toggleable table view for accessibility.
 */
export function SeriesChart({ points, unit = "", color = "var(--accent)", height = 220, decimals = 1, variant = "line", format = "number" }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const gid = useId();
  const fmt = (v: number) =>
    format === "money" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v) : `${v.toFixed(decimals)}${unit}`;

  const W = 720;
  const H = height;
  const pad = { l: 44, r: 16, t: 16, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const { min, max, ticks } = useMemo(() => {
    const vals = points.map((p) => p.value);
    let lo = variant === "bar" ? 0 : Math.min(...vals);
    let hi = Math.max(...vals);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
      lo = 0;
      hi = 1;
    }
    if (hi === lo) hi = lo + 1;
    const span = hi - lo;
    const padV = variant === "bar" ? 0 : span * 0.15;
    lo -= padV;
    hi += padV;
    const step = niceStep((hi - lo) / 4);
    lo = Math.floor(lo / step) * step;
    hi = Math.ceil(hi / step) * step;
    const t: number[] = [];
    for (let v = lo; v <= hi + 1e-9; v += step) t.push(+v.toFixed(6));
    return { min: lo, max: hi, ticks: t };
  }, [points, variant]);

  if (points.length === 0) return <p className="text-sm text-fg-subtle">No data yet.</p>;

  const x = (i: number) => (points.length === 1 ? pad.l + iw / 2 : pad.l + (i / (points.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - ((v - min) / (max - min)) * ih;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1).toFixed(1)},${(pad.t + ih).toFixed(1)} L${x(0).toFixed(1)},${(pad.t + ih).toFixed(1)} Z`;
  const slot = iw / points.length;
  const barW = Math.max(4, Math.min(40, slot - 2));
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-fg-muted">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
          Latest <span className="font-semibold text-fg tabular-nums">{fmt(points[points.length - 1].value)}</span>
        </span>
        <button type="button" onClick={() => setTable((t) => !t)} className="link link-muted min-h-6 text-xs">
          {table ? "Show chart" : "Show table"}
        </button>
      </div>
      {table ? (
        <div className="max-h-64 overflow-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i} className="border-t border-white/6">
                  <td className="px-3 py-1.5">{p.label}</td>
                  <td className="px-3 py-1.5 tabular-nums">{fmt(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="Chart"
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const px = ((e.clientX - rect.left) / rect.width) * W;
              let best = 0;
              let bd = Infinity;
              points.forEach((_, i) => {
                const cx = variant === "bar" ? pad.l + slot * i + slot / 2 : x(i);
                const d = Math.abs(cx - px);
                if (d < bd) {
                  bd = d;
                  best = i;
                }
              });
              setHover(best);
            }}
          >
            <defs>
              <linearGradient id={`${gid}-fill`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="2 5" />
                <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgba(163,168,184,0.9)">
                  {Number.isInteger(t) ? t : t.toFixed(decimals)}
                </text>
              </g>
            ))}
            {points.map((p, i) =>
              i % labelEvery === 0 || i === points.length - 1 ? (
                <text key={i} x={variant === "bar" ? pad.l + slot * i + slot / 2 : x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="rgba(163,168,184,0.9)">
                  {p.label}
                </text>
              ) : null,
            )}
            {variant === "line" ? (
              <>
                <path d={area} fill={`url(#${gid}-fill)`} />
                <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {/* brand spark on the latest value */}
                <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].value)} r="4" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
                {hover != null && (
                  <>
                    <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />
                    <circle cx={x(hover)} cy={y(points[hover].value)} r="5" fill={color} stroke="#0b0d14" strokeWidth="2" />
                  </>
                )}
              </>
            ) : (
              points.map((p, i) => {
                const bx = pad.l + slot * i + (slot - barW) / 2;
                const by = y(p.value);
                const bh = Math.max(0, pad.t + ih - by);
                const r = Math.min(4, bh / 2);
                return (
                  <path
                    key={i}
                    d={`M${bx},${pad.t + ih} v${-(bh - r)} a${r},${r} 0 0 1 ${r},${-r} h${barW - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${bh - r} z`}
                    fill={color}
                    opacity={hover == null || hover === i ? 1 : 0.5}
                  />
                );
              })
            )}
          </svg>
          {hover != null && (
            <div
              className="pointer-events-none absolute top-2 z-10 rounded-xl border border-white/10 bg-[#141829]/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
              style={{ left: `${((variant === "bar" ? pad.l + slot * hover + slot / 2 : x(hover)) / W) * 100}%`, transform: "translateX(-50%)" }}
            >
              <p className="text-fg-muted">{points[hover].date ?? points[hover].label}</p>
              <p className="font-semibold tabular-nums">{fmt(points[hover].value)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function niceStep(raw: number) {
  if (raw <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  const s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return s * p;
}
