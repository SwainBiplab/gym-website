import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { subscriptions: { where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } }, include: { plan: true }, take: 1, orderBy: { currentPeriodEnd: "desc" } } },
  });
  const header = ["Member code", "Name", "Email", "Phone", "Role", "Active", "Plan", "Status", "Valid until", "Joined"];
  const rows = members.map((m) => {
    const s = m.subscriptions[0];
    return [m.memberCode, m.name, m.email, m.phone, m.role, m.active ? "yes" : "no", s?.plan.name ?? "", s?.status ?? "NONE", s?.currentPeriodEnd.toISOString().slice(0, 10) ?? "", m.createdAt.toISOString().slice(0, 10)];
  });
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="members-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
