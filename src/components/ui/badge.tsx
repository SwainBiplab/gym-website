import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";
const tones: Record<Tone, string> = {
  neutral: "bg-white/8 text-fg-muted border-white/10",
  success: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  warning: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  danger: "bg-accent-3/15 text-accent-3 border-accent-3/30",
  info: "bg-accent-2/15 text-[#c9d6e3] border-accent-2/30",
  accent: "bg-accent/15 text-accent border-accent/40",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur", tones[tone], className)}>
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "ACTIVE":
    case "PAID":
    case "CONFIRMED":
    case "ATTENDED":
      return "success";
    case "TRIALING":
    case "WAITLISTED":
    case "PENDING":
      return "info";
    case "PAST_DUE":
    case "PAUSED":
    case "INCOMPLETE":
      return "warning";
    case "CANCELED":
    case "EXPIRED":
    case "FAILED":
    case "NO_SHOW":
    case "REFUNDED":
      return "danger";
    default:
      return "neutral";
  }
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status.replace(/_/g, " ").toLowerCase()}</Badge>;
}
