import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, money } from "@/lib/utils";
import { markPaymentPaidAction } from "@/actions/admin";
import { PageHeader } from "@/components/ui/card";
import { Table, Th, Td, CellText } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { ActionButton } from "@/components/forms/action-button";
import { FilterBar } from "@/components/ui/filter-bar";
import { Stat } from "@/components/ui/stat";

const STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
type Status = (typeof STATUSES)[number];

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser(["ADMIN"]);
  const { status } = await searchParams;
  const valid = STATUSES.includes(status as Status) ? (status as Status) : undefined;
  const [payments, groups] = await Promise.all([
    db.payment.findMany({ where: valid ? { status: valid } : {}, include: { user: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.payment.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amountCents: true } }),
  ]);
  const g = (s: Status) => groups.find((x) => x.status === s);
  const pending = g("PENDING")?._sum.amountCents ?? 0;
  const paidMonth = await db.payment.aggregate({ _sum: { amountCents: true }, where: { status: "PAID", paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } });

  return (
    <>
      <PageHeader eyebrow="Billing" title="Payments" description="Every payment recorded at the desk or through Stripe. Mark pay-at-desk balances as paid when collected." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Stat label="Outstanding" value={money(pending)} hint={`${g("PENDING")?._count._all ?? 0} pending payments`} tone="accent-3" />
        <Stat label="Collected this month" value={money(paidMonth._sum.amountCents ?? 0)} hint="Paid payments" />
        <Stat label="Failed" value={g("FAILED")?._count._all ?? 0} hint="Card payments that failed" tone="accent-2" />
      </div>
      <FilterBar
        basePath="/admin/payments"
        active={valid ?? ""}
        pills={[{ value: "", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase(), count: g(s)?._count._all ?? 0 }))]}
      />
      <Table>
        <thead>
          <tr>
            <Th>Member</Th>
            <Th>Payment</Th>
            <Th className="hidden md:table-cell">Date</Th>
            <Th align="right">Amount</Th>
            <Th>Status</Th>
            <Th className="w-40" />
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <Td>
                <CellText primary={<Link href={`/admin/members/${p.userId}`} className="link text-fg">{p.user.name}</Link>} secondary={p.user.email} />
              </Td>
              <Td>
                <CellText primary={p.description ?? "Payment"} secondary={p.method === "STRIPE" ? "Card via Stripe" : `${p.method.charAt(0)}${p.method.slice(1).toLowerCase()} at front desk`} />
              </Td>
              <Td className="hidden md:table-cell whitespace-nowrap text-fg-muted">{fmtDate(p.paidAt ?? p.createdAt)}</Td>
              <Td className="cell-num cell-primary">{money(p.amountCents, p.currency)}</Td>
              <Td><StatusBadge status={p.status} /></Td>
              <Td className="whitespace-nowrap text-right">
                {p.status !== "PAID" && p.method !== "STRIPE" && (
                  <ActionButton action={markPaymentPaidAction.bind(null, p.id)} variant="primary" size="sm" confirm={`Mark ${money(p.amountCents, p.currency)} from ${p.user.name} as paid?`}>
                    Mark paid
                  </ActionButton>
                )}
                {p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="link text-sm">Receipt</a>}
              </Td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <Td colSpan={6} className="py-10 text-center text-fg-subtle">No payments in this view.</Td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
