import type { FormState } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function FormMessage({ state, className }: { state: FormState; className?: string }) {
  if (!state?.error && !state?.message) return null;
  const isError = !!state.error;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm backdrop-blur",
        isError ? "border-accent-3/30 bg-accent-3/10 text-accent-3" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
        className,
      )}
    >
      {state.error ?? state.message}
    </div>
  );
}
