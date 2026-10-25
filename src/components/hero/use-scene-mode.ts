"use client";
import { useEffect, useRef, useState } from "react";

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Decides 3D vs static (reduced motion / no WebGL) and tracks whether the element is on screen. */
export function useSceneMode<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => setMode(mq.matches || !webglAvailable() ? "static" : "3d");
    decide();
    mq.addEventListener("change", decide);
    return () => mq.removeEventListener("change", decide);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "160px", threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible, mode };
}
