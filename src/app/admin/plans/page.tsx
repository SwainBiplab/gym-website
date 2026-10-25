import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, parseFeatures } from "@/lib/utils";
import { upsertPlanAction, deletePlanAction } from "@/actions/admin";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";
import { ActionButton } from "@/components/forms/action-button";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@prisma/client";

function PlanForm({ plan }: { plan?: Plan }) {
  return (
    <ActionForm action={upsertPlanAction.bind(null, plan?.id ?? null)} resetOnSuccess={!plan}>
      <FormAlert />
      <div className="grid gap-3 md:grid-cols-2">
        <AField name="name" label="Name"><Input name="name" defaultValue={plan?.name} required /></AField>
        <AField name="price" label="Price"><Input name="price" type="number" step="0.01" min="0" defaultValue={plan ? plan.priceCents / 100 : ""} required /></AField>
        <AField name="currency" label="Currency"><Input name="currency" defaultValue={plan?.currency ?? "usd"} maxLength={3} /></AField>
        <AField name="interval" label="Billing interval">
          <Select name="interval" defaultValue={plan?.interval ?? "MONTH"}>
            <option value="MONTH">Monthly</option><option value="YEAR">Yearly</option>
          </Select>
        </AField>
        <AField name="intervalCount" label="Every N intervals"><Input name="intervalCount" type="number" min={1} defaultValue={plan?.intervalCount ?? 1} /></AField>
        <AField name="trialDays" label="Free trial days"><Input name="trialDays" type="number" min={0} defaultValue={plan?.trialDays ?? 0} /></AField>
        <AField name="maxClassesPerWeek" label="Classes per week" hint="Blank or 0 = unlimited"><Input name="maxClassesPerWeek" type="number" min={0} defaultValue={plan?.maxClassesPerWeek ?? ""} /></AField>
        <AField name="sortOrder" label="Sort order"><Input name="sortOrder" type="number" defaultValue={plan?.sortOrder ?? 0} /></AField>
      </div>
      <AField name="description" label="Short description"><Input name="description" defaultValue={plan?.description ?? ""} /></AField>
      <AField name="features" label="Features" hint="One per line"><Textarea name="features" defaultValue={plan ? parseFeatures(plan.features).join("\n") : ""} /></AField>
      <div className="flex gap-4">
        <Checkbox name="popular" label="Highlight as popular" defaultChecked={plan?.popular} />
        <Checkbox name="active" label="Active" defaultChecked={plan ? plan.active : true} />
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton size="sm" pendingText="Saving…">{plan ? "Save plan" : "Create plan"}</SubmitButton>
        {plan && <ActionButton action={deletePlanAction.bind(null, plan.id)} variant="danger" confirm="Delete this plan? Plans with subscribers are archived instead.">Delete</ActionButton>}
      </div>
    </ActionForm>
  );
}

export default async function PlansPage() {
  await requireUser(["ADMIN"]);
  const plans = await db.plan.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { subscriptions: { where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } } } } } } });
  return (
    <>
      <PageHeader eyebrow="Billing" title="Membership plans" description="Changes apply to new subscriptions. Existing members keep their price until renewal." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader title="New plan" />
          <PlanForm />
        </Card>
        <div className="space-y-4">
          {plans.map((p) => (
            <details key={p.id} className="glass group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
                <span>
                  <span className="font-semibold">{p.name}</span>
                  <span className="ml-2 text-sm text-fg-muted">{money(p.priceCents, p.currency)} / {p.interval === "YEAR" ? "yr" : "mo"}</span>
                </span>
                <span className="flex items-center gap-2 text-xs">
                  {p.popular && <Badge tone="accent">popular</Badge>}
                  {!p.active && <Badge tone="danger">archived</Badge>}
                  <Badge>{p._count.subscriptions} active</Badge>
                </span>
              </summary>
              <div className="border-t border-white/8 p-5"><PlanForm plan={p} /></div>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
