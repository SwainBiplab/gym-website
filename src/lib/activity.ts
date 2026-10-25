import "server-only";
import { db } from "./db";

export async function audit(actorId: string | null, action: string, entity: string, entityId?: string | null, meta?: unknown) {
  try {
    await db.auditLog.create({
      data: { actorId, action, entity, entityId: entityId ?? null, meta: meta ? JSON.stringify(meta) : null },
    });
  } catch (e) {
    console.error("audit failed", e);
  }
}

export async function notify(userId: string, title: string, body: string, link?: string) {
  await db.notification.create({ data: { userId, title, body, link } });
}

export async function notifyAdmins(title: string, body: string, link?: string) {
  const admins = await db.user.findMany({ where: { role: { in: ["ADMIN", "SUPERADMIN"] }, active: true }, select: { id: true } });
  if (!admins.length) return;
  await db.notification.createMany({ data: admins.map((a) => ({ userId: a.id, title, body, link })) });
}
