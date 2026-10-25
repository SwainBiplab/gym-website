"use client";
import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { FormState } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  action: () => Promise<FormState | void>;
  children: ReactNode;
  variant?: "primary" | "glass" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  confirm?: string;
  className?: string;
  messageClassName?: string;
};

/** One-click server action with inline result message. */
export function ActionButton({ action, children, variant = "glass", size = "sm", confirm: confirmText, className, messageClassName }: Props) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<FormState>(undefined);
  return (
    <span className={cn("inline-flex flex-col items-start gap-1", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          start(async () => {
            const r = await action();
            setResult(r ?? undefined);
          });
        }}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Button>
      {result?.error && <span className={cn("text-xs text-accent-3", messageClassName)}>{result.error}</span>}
      {!result?.error && result?.message && <span className={cn("text-xs text-emerald-300", messageClassName)}>{result.message}</span>}
    </span>
  );
}
