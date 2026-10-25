import { Pin, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ago } from "@/lib/utils";
import { createAnnouncementAction, deleteAnnouncementAction, toggleAnnouncementPinAction } from "@/actions/admin";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Input, Textarea, Checkbox } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/forms/confirm-button";

export default async function AnnouncementsPage() {
  await requireUser(["ADMIN"]);
  const items = await db.announcement.findMany({ include: { author: true }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageHeader eyebrow="Communication" title="Announcements" description="Shown on every member's dashboard. Optionally push as a notification too." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader title="New announcement" />
          <ActionForm action={createAnnouncementAction} resetOnSuccess>
            <FormAlert />
            <AField name="title" label="Title"><Input name="title" required /></AField>
            <AField name="body" label="Message"><Textarea name="body" required /></AField>
            <div className="flex gap-4">
              <Checkbox name="pinned" label="Pin to top" />
              <Checkbox name="notifyAll" label="Notify all members" />
            </div>
            <SubmitButton size="sm" pendingText="Publishing…">Publish</SubmitButton>
          </ActionForm>
        </Card>
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="glass glass-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{a.title} {a.pinned && <Badge tone="accent" className="ml-1">pinned</Badge>}</p>
                  <p className="mt-1 text-sm text-fg-muted">{a.body}</p>
                  <p className="mt-1 text-xs text-fg-subtle">{a.author?.name ?? "Staff"} · {ago(a.createdAt)}</p>
                </div>
                <div className="flex gap-1">
                  <form action={toggleAnnouncementPinAction.bind(null, a.id)}>
                    <button className="grid h-8 w-8 place-items-center rounded-full text-fg-muted hover:bg-white/10" title="Pin / unpin"><Pin className="h-4 w-4" /></button>
                  </form>
                  <form action={deleteAnnouncementAction.bind(null, a.id)}>
                    <ConfirmButton confirm={`Delete “${a.title}”?`} className="grid h-8 w-8 place-items-center rounded-full text-fg-muted hover:bg-white/10 hover:text-accent-3" title="Delete" aria-label="Delete announcement"><Trash2 className="h-4 w-4" /></ConfirmButton>
                  </form>
                </div>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-fg-subtle">No announcements yet.</li>}
        </ul>
      </div>
    </>
  );
}
