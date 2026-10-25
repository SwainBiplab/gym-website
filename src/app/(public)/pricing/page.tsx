import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buttonClass } from "@/components/ui/button";
import { PlanCard } from "@/components/site/plan-card";
import { PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Membership plans" };

export default async function PricingPage() {
  const session = await getSession();
  const plans = await db.plan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const faqs = [
    ["Can I cancel anytime?", "Yes. Cancel from your dashboard and your membership stays active until the end of the paid period."],
    ["Is there a joining fee?", "No joining fee, no contracts. Pay monthly or save with an annual plan."],
    ["Can I freeze my membership?", "Annual members can freeze for up to 30 days per year. Ask at the front desk."],
    ["What do I need to bring?", "A towel and your phone — your QR member card is in your dashboard."],
  ];
  return (
    <>
      <PageHeader eyebrow="Membership" title="Pick the plan that fits your life" description="Every plan includes locker rooms, showers, mobile check-in and progress tracking. Upgrade or downgrade anytime." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            action={
              <Link href={session ? `/dashboard/membership?plan=${p.slug}` : `/register?plan=${p.slug}`} className={buttonClass(p.popular ? "primary" : "glass", "md", "w-full")}>
                {p.trialDays > 0 ? "Start free trial" : "Choose plan"}
              </Link>
            }
          />
        ))}
      </div>
      <section className="mt-20 grid gap-4 md:grid-cols-2">
        {faqs.map(([q, a]) => (
          <div key={q} className="glass p-6">
            <h3 className="font-semibold">{q}</h3>
            <p className="mt-2 text-sm text-fg-muted">{a}</p>
          </div>
        ))}
      </section>
    </>
  );
}
