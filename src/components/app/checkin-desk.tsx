import { subHours } from "date-fns";
import { db } from "@/lib/db";
import { checkInByCodeAction } from "@/actions/admin";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";
import { fmtTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { QrScanner } from "./qr-scanner";

export async function CheckInDesk() {
  const recent = await db.checkIn.findMany({ where: { checkedInAt: { gte: subHours(new Date(), 12) } }, include: { user: true }, orderBy: { checkedInAt: "desc" }, take: 25 });
  const inside = recent.filter((c) => !c.checkedOutAt).length;
  return (
    <>
      <PageHeader eyebrow="Front desk" title="Member check-in" description={`${inside} member${inside === 1 ? "" : "s"} currently checked in.`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Card strong>
            <CardHeader title="Scan or type a code" description="Scanning the same member again checks them out." />
            <ActionForm action={checkInByCodeAction} resetOnSuccess>
              <FormAlert />
              <AField name="code" label="Member code or email">
                <Input name="code" placeholder="IP-123456" autoFocus autoComplete="off" className="font-mono uppercase" />
              </AField>
              <SubmitButton pendingText="Checking…">Check in / out</SubmitButton>
            </ActionForm>
          </Card>
          <Card>
            <CardHeader title="Camera scanner" description="Point at a member's QR card." />
            <QrScanner />
          </Card>
        </div>
        <Card>
          <CardHeader title="Recent activity" />
          <ul className="divide-y divide-white/6 text-sm">
            {recent.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                <span>
                  {c.user.name} <span className="text-fg-subtle">· {c.user.memberCode}</span>
                </span>
                <span className="flex items-center gap-2 text-xs text-fg-muted">
                  {fmtTime(c.checkedInAt)}
                  {c.checkedOutAt ? <Badge>out {fmtTime(c.checkedOutAt)}</Badge> : <Badge tone="success">inside</Badge>}
                </span>
              </li>
            ))}
            {recent.length === 0 && <li className="py-2 text-fg-subtle">No check-ins in the last 12 hours.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
