"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ParallaxContext, type Pointer } from "./parallax";
import { HeroPoster } from "./hero-poster";
import { MediaVideo, VideoToggle } from "@/components/landing/media-video";

const HeroScene = dynamic(() => import("./hero-scene").then((m) => m.HeroScene), { ssr: false, loading: () => <HeroPoster /> });

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Owns visibility (IntersectionObserver), reduced-motion, WebGL detection and the
 * pointer-parallax ref shared by the 3D scene and the HTML panels.
 */
export function HeroStage({ children, videoUrl }: { children: ReactNode; videoUrl?: string | null }) {
  const root = useRef<HTMLDivElement>(null);
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  const [reduced, setReduced] = useState(false);
  const [userPlay, setUserPlay] = useState<boolean | null>(null);
  const playing = userPlay ?? !reduced;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => {
      setReduced(mq.matches);
      setMode(mq.matches || !webglAvailable() ? "static" : "3d");
    };
    decide();
    mq.addEventListener("change", decide);
    return () => mq.removeEventListener("change", decide);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px", threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pointer parallax (desktop only). Writes CSS vars for the HTML panels and a ref for the scene.
  useEffect(() => {
    const el = root.current;
    if (!el || mode !== "3d" || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const target = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };
    const tick = () => {
      const p = pointer.current;
      p.x += (target.x - p.x) * 0.06;
      p.y += (target.y - p.y) * 0.06;
      el.style.setProperty("--px", p.x.toFixed(4));
      el.style.setProperty("--py", p.y.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [mode]);

  return (
    <ParallaxContext.Provider value={pointer}>
      <div ref={root} className="hero-stage keep-dark relative h-[380px] w-full sm:h-[460px] lg:h-[560px]" data-mode={mode} style={{ ["--px" as string]: 0, ["--py" as string]: 0 }}>
        <div className="hero-env absolute inset-0 overflow-hidden rounded-[2rem]" aria-hidden>
          <HeroBackdrop />
          {videoUrl ? (
            <MediaVideo src={videoUrl} active={visible} playing={playing} fallback={<HeroPoster />} />
          ) : mode === "3d" ? (
            <HeroScene active={visible} />
          ) : (
            <HeroPoster />
          )}
          {!videoUrl && <Callouts />}
        </div>
        {videoUrl && <VideoToggle playing={playing} onToggle={() => setUserPlay(!playing)} className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2" />}
        {children}
      </div>
    </ParallaxContext.Provider>
  );
}

/**
 * Callout lines: each panel is anchored to the object by a thin lime leader with a dot,
 * and they light up in sequence (check-in → attendance → membership → revenue) so the motion
 * explains the product flow rather than decorating it. Coordinates are % of the stage.
 */
function Callouts() {
  const lines = [
    { key: "qr", from: [36, 52], to: [22, 74], step: 1 },
    { key: "members", from: [41, 46], to: [22, 30], step: 2 },
    { key: "status", from: [63, 56], to: [78, 72], step: 3 },
    { key: "revenue", from: [60, 44], to: [78, 28], step: 4 },
  ];
  return (
    <svg className="hero-callouts pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {lines.map((l) => (
        <g key={l.key} className="hero-callout" style={{ ["--step" as string]: l.step }}>
          <line x1={l.from[0]} y1={l.from[1]} x2={l.to[0]} y2={l.to[1]} stroke="var(--accent)" strokeWidth="0.25" vectorEffect="non-scaling-stroke" pathLength={1} className="hero-callout-line" />
          <circle cx={l.from[0]} cy={l.from[1]} r="0.6" fill="var(--accent)" className="hero-callout-dot" />
        </g>
      ))}
    </svg>
  );
}

/** Blurred architectural gym silhouettes: fakes depth of field behind the sharp 3D object. */
function HeroBackdrop() {
  return (
    <svg className="hero-backdrop absolute inset-0 h-full w-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="hb-floor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0d0e11" />
          <stop offset="1" stopColor="#040405" />
        </linearGradient>
        <linearGradient id="hb-col" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#1b1d22" />
          <stop offset="0.5" stopColor="#2a2d34" />
          <stop offset="1" stopColor="#141518" />
        </linearGradient>
        <radialGradient id="hb-lime" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <filter id="hb-blur"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="hb-blur-lg"><feGaussianBlur stdDeviation="18" /></filter>
      </defs>
      <rect width="800" height="600" fill="url(#hb-floor)" />
      <g filter="url(#hb-blur)" opacity="0.9">
        {[60, 190, 610, 740].map((x) => (
          <rect key={x} x={x} y="40" width="34" height="420" fill="url(#hb-col)" />
        ))}
        <rect x="0" y="455" width="800" height="3" fill="#2d3038" />
        {[120, 300, 500, 680].map((x) => (
          <rect key={x} x={x} y="80" width="2" height="360" fill="#33363d" />
        ))}
        <rect x="250" y="120" width="300" height="2" fill="#3a3d45" />
      </g>
      <ellipse cx="400" cy="470" rx="320" ry="60" fill="url(#hb-lime)" filter="url(#hb-blur-lg)" />
      <rect x="0" y="460" width="800" height="140" fill="#07080a" opacity="0.85" />
    </svg>
  );
}
