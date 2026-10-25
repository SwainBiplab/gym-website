import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/utils";
import { markAttendanceAction } from "@/actions/trainer";
import { PageHeader, Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ActionButton } from "@/components/forms/action-button";

export default async function SessionAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["TRAINER", "ADMIN"]);
  const session = await db.classSession.findUnique({
    where: { id },
    include: { gymClass: { include: { trainer: true } }, bookings: { include: { user: true }, orderBy: [{ status: "asc" }, { createdAt: "asc" }] } },
  });
  if (!session) notFound();
  if (user.role === "TRAINER" && session.gymClass.trainerId !== user.id) notFound();
  const active = session.bookings.filter((b) => b.status !== "CANCELED");
  const cap = session.capacity ?? session.gymClass.capacity;
  const attended = active.filter((b) => b.status === "ATTENDED").length;

  return (
    <>
      <PageHeader
        eyebrow={session.gymClass.category}
        title={session.gymClass.name}
        description={`${fmtDateTime(session.startsAt)} · ${session.gymClass.location} · ${active.filter((b) => b.status !== "WAITLISTED").length}/${cap} booked · ${attended} attended`}
      />
      <Card>
        {active.length === 0 ? (
          <p className="text-sm text-fg-muted">No bookings for this session.</p>
        ) : (
          <ul className="divide-y divide-white/6">
            {active.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{b.user.name}</p>
                  <p className="text-xs text-fg-subtle">{b.user.memberCode} · {b.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.status} />
                  {b.status !== "ATTENDED" && (
                    <ActionButton action={markAttendanceAction.bind(null, b.id, "ATTENDED")} variant="primary">Present</ActionButton>
                  )}
                  {b.status !== "NO_SHOW" && b.status !== "WAITLISTED" && (
                    <ActionButton action={markAttendanceAction.bind(null, b.id, "NO_SHOW")} variant="ghost">No-show</ActionButton>
                  )}
                  {(b.status === "ATTENDED" || b.status === "NO_SHOW") && (
                    <ActionButton action={markAttendanceAction.bind(null, b.id, "CONFIRMED")} variant="ghost">Undo</ActionButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
