"use client";
import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import type { FormState } from "@/lib/validation";
import { FormMessage } from "@/components/ui/form-message";
import { cn } from "@/lib/utils";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;
const Ctx = createContext<FormState>(undefined);

/** Form wired to a server action; child fields read errors from context. */
export function ActionForm({ action, children, className, resetOnSuccess }: { action: Action; children: ReactNode; className?: string; resetOnSuccess?: boolean }) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <Ctx.Provider value={state}>
      <form ref={ref} action={formAction} className={cn("space-y-4", className)}>
        {children}
      </form>
    </Ctx.Provider>
  );
}

export function useActionFormState() {
  return useContext(Ctx);
}

export function FormAlert({ className }: { className?: string }) {
  const state = useActionFormState();
  return <FormMessage state={state} className={className} />;
}

/** Labelled field that shows the server-side validation error for `name`. */
export function AField({ name, label, hint, children, className }: { name: string; label: string; hint?: string; children: ReactNode; className?: string }) {
  const state = useActionFormState();
  const err = state?.fieldErrors?.[name]?.[0];
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</span>
      {children}
      {err ? <span className="block text-xs text-accent-3">{err}</span> : hint ? <span className="block text-xs text-fg-subtle">{hint}</span> : null}
    </label>
  );
}
