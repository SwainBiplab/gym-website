"use client";
import { useEffect, type ReactNode } from "react";

/**
 * Scroll reveal: any descendant with `data-reveal` gets `is-in` when it enters the viewport.
 * Add `data-reveal-delay="2"` (1–6) for staggering. CSS lives in globals.css (.reveal rules).
 */
export function RevealProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return <>{children}</>;
}
