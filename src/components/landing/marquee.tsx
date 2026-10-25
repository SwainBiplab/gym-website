import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Infinite horizontal scroller. Content is duplicated for a seamless loop; pauses on hover. */
export function Marquee({ children, reverse, speed = 40, className }: { children: ReactNode; reverse?: boolean; speed?: number; className?: string }) {
  return (
    <div className={cn("marquee relative overflow-hidden", className)} style={{ ["--marquee-duration" as string]: `${speed}s` }}>
      <div className={cn("marquee-track flex w-max gap-3", reverse && "marquee-reverse")}>
        <div className="flex shrink-0 gap-3">{children}</div>
        <div className="flex shrink-0 gap-3" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
