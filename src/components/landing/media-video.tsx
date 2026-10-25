"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Looping muted background video. Plays only while on screen and while `playing` is true;
 * falls back to `fallback` if the file cannot load.
 */
export function MediaVideo({ src, active, playing, fallback }: { src: string; active: boolean; playing: boolean; fallback: ReactNode }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  // The error event can fire before hydration attaches onError, so also inspect the element's state.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const check = () => {
      if (v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) setFailed(true);
    };
    const t = window.setTimeout(check, 1500);
    v.addEventListener("error", check);
    return () => {
      window.clearTimeout(t);
      v.removeEventListener("error", check);
    };
  }, [src]);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active && playing) v.play().catch(() => {});
    else v.pause();
  }, [active, playing]);
  if (failed) return <>{fallback}</>;
  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

/** Pause/play control (WCAG 2.2.2). Lives outside aria-hidden decorative layers. */
export function VideoToggle({ playing, onToggle, className }: { playing: boolean; onToggle: () => void; className?: string }) {
  return (
    <button type="button" onClick={onToggle} aria-label={playing ? "Pause background video" : "Play background video"} aria-pressed={!playing} className={cn("control keep-dark grid h-9 w-9 place-items-center bg-black/40 text-white backdrop-blur", className)}>
      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
    </button>
  );
}
