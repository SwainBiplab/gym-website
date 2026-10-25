import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { upsertClassAction } from "@/actions/admin";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";

export default async function AdminClassesPage() {
  await requireUser(["ADMIN"]);
  const [classes, trainers] = await Promise.all([
    db.gymClass.findMany({ include: { trainer: true, _count: { select: { sessions: { where: { startsAt: { gte: new Date() }, canceled: false } } } } }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { role: { in: ["TRAINER", "ADMIN", "SUPERADMIN"] }, active: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Schedule" title="Classes" description="Define class formats here, then schedule sessions inside each class." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader title="New class" />
          <ActionForm action={upsertClassAction.bind(null, null)}>
            <FormAlert />
            <AField name="name" label="Name"><Input name="name" required /></AField>
            <AField name="description" label="Description"><Textarea name="description" className="min-h-20" /></AField>
            <div className="grid gap-3 md:grid-cols-2">
              <AField name="category" label="Category"><Input name="category" defaultValue="General" list="categories" /></AField>
              <AField name="level" label="Level"><Input name="level" defaultValue="All levels" /></AField>
              <AField name="trainerId" label="Trainer">
                <Select name="trainerId" defaultValue="">
                  <option value="">Unassigned</option>
                  {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </AField>
              <AField name="location" label="Location"><Input name="location" defaultValue="Main floor" /></AField>
              <AField name="capacity" label="Capacity"><Input name="capacity" type="number" min={1} defaultValue={20} /></AField>
              <AField name="durationMin" label="Duration (min)"><Input name="durationMin" type="number" min={10} defaultValue={60} /></AField>
              <AField name="color" label="Color"><Input name="color" type="color" defaultValue="var(--accent)" className="h-11 p-1" /></AField>
            </div>
            <datalist id="categories">
              {Array.from(new Set(classes.map((c) => c.category))).map((c) => <option key={c} value={c} />)}
            </datalist>
            <SubmitButton size="sm" pendingText="Creating…">Create class</SubmitButton>
          </ActionForm>
        </Card>
        <div className="grid gap-3 md:grid-cols-2">
          {classes.map((c) => (
            <Link key={c.id} href={`/admin/classes/${c.id}`} className="glass glass-sm glass-hover flex flex-col p-4">
              <span className="mb-2 block h-1.5 w-10 rounded-full" style={{ background: c.color }} />
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-fg-muted">{c.category} · {c.level} · {c.durationMin} min · cap {c.capacity}</p>
              <p className="text-xs text-fg-subtle">{c.trainer?.name ?? "Unassigned"} · {c.location}</p>
              <p className="mt-3 flex gap-2 text-xs">
                <Badge tone="info">{c._count.sessions} upcoming</Badge>
                {!c.active && <Badge tone="danger">inactive</Badge>}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
