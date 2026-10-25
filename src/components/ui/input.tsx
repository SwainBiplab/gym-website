import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("control h-11 w-full px-4 text-sm", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("control control-area w-full px-4 py-3 text-sm min-h-28", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn("control h-11 w-full px-4 text-sm appearance-none", className)} {...props} />;
}

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string[] | string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  const err = Array.isArray(error) ? error[0] : error;
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</span>
      {children}
      {err ? <span className="block text-xs text-accent-3">{err}</span> : hint ? <span className="block text-xs text-fg-subtle">{hint}</span> : null}
    </label>
  );
}

export function Checkbox({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-fg-muted cursor-pointer">
      <input type="checkbox" className="h-4 w-4 rounded accent-accent" {...props} />
      {label}
    </label>
  );
}
