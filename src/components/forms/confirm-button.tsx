"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Submit button for destructive <form action={...}> buttons: asks for confirmation,
 * then shows a pending spinner while the server action runs.
 */
export function ConfirmButton({ confirm, children, className, ...props }: ComponentProps<"button"> & { confirm: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
      className={cn("inline-flex items-center gap-1.5 disabled:opacity-50", className)}
      {...props}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children}
    </button>
  );
}
