import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/card";
import { Table, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AuditPage() {
  await requireUser(["ADMIN"]);
  const logs = await db.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageHeader eyebrow="Security" title="Audit log" description="Who did what, and when. Last 200 events." />
      <Table>
        <thead>
          <tr><Th>When</Th><Th>Actor</Th><Th>Action</Th><Th>Entity</Th><Th>Details</Th></tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <Td className="whitespace-nowrap text-fg-muted">{fmtDateTime(l.createdAt)}</Td>
              <Td>{l.actor?.name ?? <span className="text-fg-subtle">system</span>}</Td>
              <Td><Badge tone={l.action.includes("delete") || l.action.includes("cancel") ? "danger" : l.action.startsWith("admin") ? "accent" : "neutral"}>{l.action}</Badge></Td>
              <Td className="text-fg-muted">{l.entity}{l.entityId && <span className="font-mono text-xs text-fg-subtle"> {l.entityId.slice(0, 8)}</span>}</Td>
              <Td className="font-mono text-xs text-fg-subtle">{l.meta ?? ""}</Td>
            </tr>
          ))}
          {logs.length === 0 && <tr><Td colSpan={5} className="text-fg-subtle">No events yet.</Td></tr>}
        </tbody>
      </Table>
    </>
  );
}
