"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useSceneMode } from "@/components/hero/use-scene-mode";
import { MediaVideo, VideoToggle } from "./media-video";

const EquipmentScene = dynamic(() => import("./equipment-scene").then((m) => m.EquipmentScene), { ssr: false, loading: () => <EquipmentPoster /> });

/** Scroll-driven 3D equipment stage: rotates the set as the section moves through the viewport. */
export function EquipmentStage({ videoUrl }: { videoUrl?: string | null }) {
  const { ref, visible, mode } = useSceneMode<HTMLDivElement>();
  const [userPlay, setUserPlay] = useState<boolean | null>(null);
  const playing = userPlay ?? mode !== "static";
  const progress = useRef(0.5);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      progress.current = Math.min(1, Math.max(0, 1 - (r.top + r.height / 2) / vh));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref]);

  return (
    <div ref={ref} className="equip-stage keep-dark relative h-[340px] w-full overflow-hidden rounded-[2rem] bg-[#07080a] sm:h-[420px] lg:h-[520px]" data-mode={mode}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(200,250,95,0.18),transparent_55%)]" />
      {videoUrl ? <MediaVideo src={videoUrl} active={visible} playing={playing} fallback={<EquipmentPoster />} /> : mode === "3d" ? <EquipmentScene active={visible} progress={progress} /> : <EquipmentPoster />}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_50%,rgba(4,4,6,0.85)_100%)]" />
      {videoUrl && <VideoToggle playing={playing} onToggle={() => setUserPlay(!playing)} className="absolute bottom-3 right-3 z-10" />}
    </div>
  );
}

function EquipmentPoster() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Weight plate, kettlebell and medicine ball">
      <defs>
        <radialGradient id="ep-m" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#6a6e78" /><stop offset="0.6" stopColor="#24262a" /><stop offset="1" stopColor="#0f1012" />
        </radialGradient>
        <radialGradient id="ep-r" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#3a3c42" /><stop offset="1" stopColor="#0f1012" />
        </radialGradient>
        <filter id="ep-s"><feGaussianBlur stdDeviation="12" /></filter>
      </defs>
      <ellipse cx="400" cy="420" rx="330" ry="30" fill="#000" opacity="0.7" filter="url(#ep-s)" />
      <circle cx="190" cy="300" r="105" fill="url(#ep-r)" stroke="#5b5f68" strokeWidth="2" />
      <circle cx="190" cy="300" r="90" fill="none" stroke="var(--accent)" strokeWidth="5" opacity="0.9" />
      <circle cx="190" cy="300" r="22" fill="#8a8e98" />
      <path d="M360 300 a40 40 0 0 1 80 0" fill="none" stroke="#9a9ea8" strokeWidth="14" strokeLinecap="round" />
      <circle cx="400" cy="340" r="68" fill="url(#ep-m)" />
      <ellipse cx="400" cy="340" rx="68" ry="4" fill="var(--accent)" opacity="0.8" />
      <circle cx="610" cy="345" r="60" fill="url(#ep-r)" />
      <ellipse cx="610" cy="345" rx="60" ry="14" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
}
