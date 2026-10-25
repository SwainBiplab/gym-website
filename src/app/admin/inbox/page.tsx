import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ago } from "@/lib/utils";
import { markContactHandledAction } from "@/actions/admin";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function InboxPage() {
  await requireUser(["ADMIN"]);
  const messages = await db.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 100 });
  return (
    <>
      <PageHeader eyebrow="Communication" title="Contact inbox" description={`${messages.filter((m) => !m.handled).length} open messages from the website contact form.`} />
      <ul className="space-y-3">
        {messages.map((m) => (
          <li key={m.id} className={`glass glass-sm p-4 ${!m.handled ? "glass-strong" : "opacity-70"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{m.subject} {m.handled && <Badge className="ml-1">handled</Badge>}</p>
                <p className="text-xs text-fg-subtle">
                  {m.name} · <a href={`mailto:${m.email}`} className="link">{m.email}</a> · {ago(m.createdAt)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-fg-muted">{m.message}</p>
              </div>
              {!m.handled && (
                <form action={markContactHandledAction.bind(null, m.id)}>
                  <Button variant="glass" size="sm">Mark handled</Button>
                </form>
              )}
            </div>
          </li>
        ))}
        {messages.length === 0 && <li className="text-sm text-fg-subtle">Inbox is empty.</li>}
      </ul>
    </>
  );
}
