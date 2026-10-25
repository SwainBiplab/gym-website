"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SCREENS = [
  { key: "desk", title: "Front desk", caption: "Scan, check in, collect a payment: three taps." },
  { key: "member", title: "Your phone", caption: "Book classes, track progress, show the QR card." },
  { key: "owner", title: "The office", caption: "Revenue, attendance and class fill rate at a glance." },
] as const;

/** Three product cards side by side (stacked on mobile). The highlighted card cycles; click or hover to focus one. */
export function ProductTour() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % SCREENS.length), 4200);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div className="tour mx-auto w-full max-w-5xl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="tour-row grid gap-4 md:grid-cols-3 md:gap-5">
        {SCREENS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(i)}
            onFocus={() => setActive(i)}
            aria-pressed={i === active}
            className={cn("tour-card glass flex flex-col overflow-hidden p-0 text-left", i === active && "is-active")}
          >
            <div className="flex items-center justify-between border-b border-glass-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted">
              <span className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", i === active ? "bg-accent shadow-[0_0_8px_var(--accent)]" : "bg-fg-subtle/60")} /> {s.title}
              </span>
              <span className="font-mono normal-case tracking-normal text-fg-subtle">/{s.key}</span>
            </div>
            <div className="flex-1 p-4">{s.key === "desk" ? <DeskMock /> : s.key === "member" ? <MemberMock /> : <OwnerMock />}</div>
            <p className="border-t border-glass-border px-4 py-3 text-sm text-fg-muted">{s.caption}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function DeskMock() {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-3">
        <div className="shrink-0 rounded-lg bg-white p-1.5">
          <svg width="64" height="64" viewBox="0 0 13 13" aria-hidden>
            {Array.from({ length: 169 }, (_, i) => {
              const x = i % 13, y = Math.floor(i / 13);
              const finder = (x < 3 && y < 3) || (x > 9 && y < 3) || (x < 3 && y > 9);
              const on = finder ? !(x === 1 || x === 11 || y === 1 || y === 11) || (x === 1 && y === 1) || (x === 11 && y === 1) || (x === 1 && y === 11) : (x * 31 + y * 17 + ((x * y) % 7)) % 3 === 0;
              return on ? <rect key={i} x={x} y={y} width="1" height="1" fill="#0b0c0f" /> : null;
            })}
            <rect x="0" y="0" width="13" height="0.5" fill="var(--accent)" className="hero-scanline" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">Maya Torres</p>
          <p className="text-fg-muted">Elite · valid to 7 Nov</p>
          <span className="hero-pill mt-1">checked in</span>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-white/6 px-3 py-2">
        <span className="text-fg-muted">Balance due</span>
        <span className="font-semibold text-accent">$0.00</span>
      </div>
      <div className="flex gap-2">
        <span className="btn-primary inline-flex h-8 items-center rounded-full px-3 text-xs">Collect payment</span>
        <span className="control inline-flex h-8 items-center px-3 text-xs">Add guest</span>
      </div>
    </div>
  );
}

function MemberMock() {
  return (
    <div className="space-y-3 text-sm">
      {["HIIT Blast · 18:30 · Studio A", "Power Hour · 18:00 · Strength room"].map((c, i) => (
        <div key={c} className="flex items-center justify-between gap-3 rounded-xl bg-white/6 px-3 py-2">
          <div className="min-w-0">
            <span className="mb-1 block h-1 w-8 rounded-full" style={{ background: ["#ff7a7a", "#9fb3c8"][i] }} />
            <p className="truncate font-semibold">{c.split(" · ")[0]}</p>
            <p className="text-fg-muted">{c.split(" · ").slice(1).join(" · ")}</p>
          </div>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", i === 0 ? "bg-accent text-[var(--on-accent)]" : "bg-white/10")}>{i === 0 ? "Booked" : "Book"}</span>
        </div>
      ))}
      <div className="rounded-xl bg-white/6 p-3">
        <p className="mb-1 text-fg-muted">Body weight · 12 weeks</p>
        <svg viewBox="0 0 300 44" className="h-11 w-full" aria-hidden>
          <polyline points="0,36 25,34 50,35 75,30 100,28 125,29 150,24 175,20 200,21 225,16 250,13 275,12 300,9" fill="none" stroke="var(--accent)" strokeWidth="2.5" className="hero-draw" pathLength={1} />
          <circle cx="300" cy="9" r="4" fill="var(--accent)" />
        </svg>
      </div>
    </div>
  );
}

function OwnerMock() {
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-3 gap-2">
        {[["MRR", "$84.2k", "+9.8%"], ["Churn", "2.1%", "−0.4"], ["Fill", "78%", "+6"]].map(([k, v, d]) => (
          <div key={k} className="rounded-xl bg-white/6 p-2.5">
            <p className="text-xs text-fg-muted">{k}</p>
            <p className="text-base font-semibold leading-tight">{v}</p>
            <p className="text-xs font-medium text-accent">{d}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white/6 p-3">
        <p className="mb-2 text-fg-muted">Check-ins by hour · today</p>
        <div className="flex h-12 items-end gap-1.5">
          {[40, 65, 50, 80, 72, 95, 60, 88, 55, 70, 92, 75].map((h, i) => (
            <span key={i} className="fi-bar block w-full rounded-t-sm bg-accent/80" style={{ height: `${h}%`, animationDelay: `${i * 0.08}s`, transformOrigin: "bottom" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
