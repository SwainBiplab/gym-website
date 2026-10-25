import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/utils";
import { upsertClassAction, deleteClassAction, createSessionsAction, cancelSessionAction, deleteSessionAction } from "@/actions/admin";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";
import { ActionButton } from "@/components/forms/action-button";
import { Badge } from "@/components/ui/badge";

export default async function AdminClassDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(["ADMIN"]);
  const [c, trainers] = await Promise.all([
    db.gymClass.findUnique({
      where: { id },
      include: { trainer: true, sessions: { include: { _count: { select: { bookings: { where: { status: { in: ["CONFIRMED", "ATTENDED"] } } } } } }, orderBy: { startsAt: "desc" }, take: 60 } },
    }),
    db.user.findMany({ where: { role: { in: ["TRAINER", "ADMIN", "SUPERADMIN"] }, active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!c) notFound();
  const now = new Date();
  const upcoming = c.sessions.filter((s) => s.startsAt >= now).reverse();
  const past = c.sessions.filter((s) => s.startsAt < now);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/admin/classes" className="link text-fg">← Classes</Link>}
        title={c.name}
        description={`${c.category} · ${c.level} · ${c.durationMin} min · ${c.trainer?.name ?? "Unassigned"}`}
        action={
          <ActionButton action={deleteClassAction.bind(null, c.id)} variant="danger" confirm="Delete this class and all its sessions and bookings?">Delete class</ActionButton>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Schedule sessions" description="Creates one session, or the same slot weekly for N weeks." />
            <ActionForm action={createSessionsAction.bind(null, c.id)} resetOnSuccess>
              <FormAlert />
              <div className="grid gap-3 md:grid-cols-2">
                <AField name="date" label="First date"><Input name="date" type="date" required defaultValue={format(now, "yyyy-MM-dd")} /></AField>
                <AField name="time" label="Start time"><Input name="time" type="time" required defaultValue="18:00" /></AField>
                <AField name="weeks" label="Repeat for (weeks)"><Input name="weeks" type="number" min={1} max={52} defaultValue={1} /></AField>
                <AField name="capacity" label="Capacity override" hint={`Default ${c.capacity}`}><Input name="capacity" type="number" min={1} /></AField>
              </div>
              <AField name="notes" label="Notes"><Input name="notes" placeholder="Bring a mat" /></AField>
              <SubmitButton size="sm" pendingText="Scheduling…">Add sessions</SubmitButton>
            </ActionForm>
          </Card>
          <Card>
            <CardHeader title="Edit class" />
            <ActionForm action={upsertClassAction.bind(null, c.id)}>
              <FormAlert />
              <AField name="name" label="Name"><Input name="name" defaultValue={c.name} required /></AField>
              <AField name="description" label="Description"><Textarea name="description" className="min-h-20" defaultValue={c.description ?? ""} /></AField>
              <div className="grid gap-3 md:grid-cols-2">
                <AField name="category" label="Category"><Input name="category" defaultValue={c.category} /></AField>
                <AField name="level" label="Level"><Input name="level" defaultValue={c.level} /></AField>
                <AField name="trainerId" label="Trainer">
                  <Select name="trainerId" defaultValue={c.trainerId ?? ""}>
                    <option value="">Unassigned</option>
                    {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </AField>
                <AField name="location" label="Location"><Input name="location" defaultValue={c.location} /></AField>
                <AField name="capacity" label="Capacity"><Input name="capacity" type="number" min={1} defaultValue={c.capacity} /></AField>
                <AField name="durationMin" label="Duration (min)"><Input name="durationMin" type="number" min={10} defaultValue={c.durationMin} /></AField>
                <AField name="color" label="Color"><Input name="color" type="color" defaultValue={c.color} className="h-11 p-1" /></AField>
              </div>
              <SubmitButton size="sm" variant="glass" pendingText="Saving…">Save</SubmitButton>
            </ActionForm>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Upcoming sessions" description={`${upcoming.length} scheduled`} />
            <ul className="divide-y divide-white/6 text-sm">
              {upcoming.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <Link href={`/trainer/sessions/${s.id}`} className="link text-fg">
                    {fmtDateTime(s.startsAt)} <span className="text-fg-subtle">· {s._count.bookings}/{s.capacity ?? c.capacity}</span>
                  </Link>
                  <span className="flex items-center gap-2">
                    {s.canceled ? (
                      <>
                        <Badge tone="danger">canceled</Badge>
                        <ActionButton action={deleteSessionAction.bind(null, s.id)} variant="ghost">Delete</ActionButton>
                      </>
                    ) : (
                      <ActionButton action={cancelSessionAction.bind(null, s.id)} variant="ghost" confirm="Cancel this session and notify booked members?">Cancel</ActionButton>
                    )}
                  </span>
                </li>
              ))}
              {upcoming.length === 0 && <li className="py-2 text-fg-subtle">Nothing scheduled.</li>}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Past sessions" />
            <ul className="divide-y divide-white/6 text-sm">
              {past.slice(0, 15).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-fg-muted">
                  <Link href={`/trainer/sessions/${s.id}`} className="link text-fg">{fmtDateTime(s.startsAt)}</Link>
                  <span>{s._count.bookings} attended/booked</span>
                </li>
              ))}
              {past.length === 0 && <li className="py-2 text-fg-subtle">No history.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
