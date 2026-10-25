import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Glass panel with two transform layers:
 *  outer = pointer parallax (CSS vars --px/--py scaled by depth), inner = independent float animation.
 * `depth` 1 = far (small drift), 3 = near (larger drift).
 */
export function PanelShell({ children, className, depth = 2, delay = 0, title, icon, step }: { children: ReactNode; className?: string; depth?: 1 | 2 | 3; delay?: number; title: string; icon?: ReactNode; step?: 1 | 2 | 3 | 4 }) {
  return (
    <div className={cn("hero-panel pointer-events-none absolute", className)} style={{ ["--depth" as string]: depth, ["--step" as string]: step ?? 0 }}>
      <div className="hero-panel-float" style={{ animationDelay: `${delay}s`, animationDuration: `${7 + depth * 1.3}s` }}>
        <div className={cn("hero-glass pointer-events-auto w-[11.5rem] p-3.5 sm:w-[13.5rem] sm:p-4", step && "hero-step")}>
          <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">
            <span>{title}</span>
            {icon}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
