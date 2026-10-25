import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, hover, strong, ...props }: ComponentProps<"div"> & { hover?: boolean; strong?: boolean }) {
  return <div className={cn("glass p-6", hover && "glass-hover", strong && "glass-strong", className)} {...props} />;
}

export function CardHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Page header hierarchy: eyebrow (context) → title (largest) → description → one primary action (right).
 * Secondary actions go in `secondary` and render smaller, before the primary.
 */
export function PageHeader({ title, description, action, secondary, eyebrow }: { title: ReactNode; description?: ReactNode; action?: ReactNode; secondary?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 rise">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight md:text-[2.5rem] md:leading-[1.1]">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-[15px] text-fg-muted">{description}</div>}
      </div>
      {(action || secondary) && (
        <div className="flex flex-wrap items-center gap-2">
          {secondary}
          {action}
        </div>
      )}
    </div>
  );
}
