import Link from "next/link";
import type { Notification } from "@prisma/client";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/actions/notifications";
import { ago, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/card";

export function NotificationsPage({ items }: { items: Notification[] }) {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Bookings, payments, and announcements."
        action={
          items.some((n) => !n.read) && (
            <form action={markAllNotificationsReadAction}>
              <Button variant="glass" size="sm">Mark all read</Button>
            </form>
          )
        }
      />
      {items.length === 0 ? (
        <Empty title="You're all caught up" description="New notifications will show up here." />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id} className={cn("glass glass-sm flex items-start gap-4 p-4", !n.read && "glass-strong")}>
              <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-white/15" : "bg-accent-2 shadow-[0_0_12px_rgba(56,217,200,0.8)]")} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-fg-muted">{n.body}</p>
                <p className="mt-1 text-xs text-fg-subtle">{ago(n.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {n.link && (
                  <Link href={n.link} className="link text-sm">
                    View
                  </Link>
                )}
                {!n.read && (
                  <form action={markNotificationReadAction.bind(null, n.id)}>
                    <Button variant="ghost" size="sm">Read</Button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
