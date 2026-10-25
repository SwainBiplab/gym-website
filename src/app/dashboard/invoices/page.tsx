import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, money } from "@/lib/utils";
import { PageHeader } from "@/components/ui/card";
import { Table, Th, Td } from "@/components/ui/table";
import { StatusBadge, Badge } from "@/components/ui/badge";

export default async function InvoicesPage() {
  const user = await requireUser();
  const payments = await db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const pending = payments.filter((p) => p.status === "PENDING").reduce((a, p) => a + p.amountCents, 0);
  return (
    <>
      <PageHeader eyebrow="Billing" title="Payments & invoices" description={pending > 0 ? `You have ${money(pending)} outstanding. Pay at the front desk.` : "All settled up."} />
      <Table>
        <thead>
          <tr><Th>Date</Th><Th>Description</Th><Th className="hidden md:table-cell">Method</Th><Th>Amount</Th><Th>Status</Th><Th /></tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <Td>{fmtDate(p.paidAt ?? p.createdAt)}</Td>
              <Td>{p.description}</Td>
              <Td className="hidden md:table-cell"><Badge>{p.method}</Badge></Td>
              <Td className="tabular-nums">{money(p.amountCents, p.currency)}</Td>
              <Td><StatusBadge status={p.status} /></Td>
              <Td>{p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="link">Receipt</a>}</Td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr><Td colSpan={6} className="text-fg-subtle">No payments yet.</Td></tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
