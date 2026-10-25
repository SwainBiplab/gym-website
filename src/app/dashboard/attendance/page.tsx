import { format, subDays, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime, fmtTime } from "@/lib/utils";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { SeriesChart } from "@/components/charts/line-chart";
import { Table, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AttendanceMap } from "@/components/brand/attendance-map";

export default async function AttendancePage() {
  const user = await requireUser();
  const since = subDays(startOfDay(new Date()), 83);
  const checkIns = await db.checkIn.findMany({ where: { userId: user.id }, orderBy: { checkedInAt: "desc" }, take: 200 });
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const start = subDays(startOfDay(new Date()), (11 - i) * 7 + 6);
    const end = subDays(startOfDay(new Date()), (11 - i) * 7 - 1);
    const n = checkIns.filter((c) => c.checkedInAt >= start && c.checkedInAt < end).length;
    return { label: format(start, "MMM d"), date: `Week of ${format(start, "MMM d")}`, value: n };
  });
  const total = checkIns.filter((c) => c.checkedInAt >= since).length;
  return (
    <>
      <PageHeader eyebrow="Attendance" title="Your visits" description={`${total} visits in the last 12 weeks.`} />
      <Card className="mb-6">
        <CardHeader title="Visit map" description="Every visit, by day of the week." />
        <AttendanceMap dates={checkIns.map((c) => c.checkedInAt)} weeks={16} />
      </Card>
      <Card className="mb-6">
        <CardHeader title="Visits per week" />
        <SeriesChart points={weeks} variant="bar" decimals={0} color="#9fb3c8" />
      </Card>
      <Table>
        <thead>
          <tr><Th>Checked in</Th><Th>Checked out</Th><Th>Method</Th></tr>
        </thead>
        <tbody>
          {checkIns.slice(0, 50).map((c) => (
            <tr key={c.id}>
              <Td>{fmtDateTime(c.checkedInAt)}</Td>
              <Td>{c.checkedOutAt ? fmtTime(c.checkedOutAt) : "—"}</Td>
              <Td><Badge tone="neutral">{c.method}</Badge></Td>
            </tr>
          ))}
          {checkIns.length === 0 && (
            <tr><Td colSpan={3} className="text-fg-subtle">No visits recorded yet.</Td></tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
