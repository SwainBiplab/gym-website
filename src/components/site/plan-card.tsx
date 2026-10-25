import { Check } from "lucide-react";
import type { Plan } from "@prisma/client";
import { money, parseFeatures, intervalLabel, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function PlanCard({ plan, action, current }: { plan: Plan; action?: React.ReactNode; current?: boolean }) {
  return (
    <div className={cn("glass glass-hover flex flex-col p-7", plan.popular && "glass-strong ring-1 ring-accent/50")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">{plan.name}</h3>
        {current ? <Badge tone="success">Current plan</Badge> : plan.popular ? <Badge tone="accent">Most popular</Badge> : null}
      </div>
      <p className="min-h-10 text-sm text-fg-muted">{plan.description}</p>
      <p className="mt-5">
        <span className="text-4xl font-semibold tracking-tight">{money(plan.priceCents, plan.currency)}</span>
        <span className="text-sm text-fg-muted"> / {intervalLabel(plan.interval, plan.intervalCount)}</span>
      </p>
      {plan.trialDays > 0 && <p className="mt-1 text-xs text-accent-2">{plan.trialDays}-day free trial</p>}
      <ul className="my-6 space-y-2.5 text-sm">
        {parseFeatures(plan.features).map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto">{action}</div>
    </div>
  );
}
