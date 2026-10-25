import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { NotificationsPage } from "@/components/app/notifications-list";

export default async function Page() {
  const user = await requireUser(["TRAINER", "ADMIN"]);
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return <NotificationsPage items={items} />;
}
