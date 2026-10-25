import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Stat({ label, value, hint, icon, className, tone }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; className?: string; tone?: "accent" | "accent-2" | "accent-3" }) {
  const ring = tone === "accent-2" ? "from-accent-2/40" : tone === "accent-3" ? "from-accent-3/40" : "from-accent/40";
  return (
    <div className={cn("glass glass-sm glass-hover p-5", className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</p>
        {icon && <span className={cn("grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br to-transparent text-fg", ring)}>{icon}</span>}
      </div>
      <p className="mt-3 text-[2rem] font-semibold leading-none tracking-tight">{value}</p>
      {hint && <p className="mt-2 text-[13px] text-fg-subtle">{hint}</p>}
    </div>
  );
}
