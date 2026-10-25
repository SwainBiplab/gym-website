import Link from "next/link";
import { Download, Plus, Search } from "lucide-react";
import type { Prisma, SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/card";
import { Table, Th, Td, CellText } from "@/components/ui/table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FilterBar, Pagination } from "@/components/ui/filter-bar";

const PAGE = 20;
const ACTIVE: SubscriptionStatus[] = ["ACTIVE", "TRIALING", "PAST_DUE"];
const LIVE: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }> }) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const now = new Date();
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { memberCode: { contains: q.toUpperCase() } }] } : {}),
    ...(sp.role ? { role: sp.role as "MEMBER" | "TRAINER" | "ADMIN" } : {}),
    ...(status === "deactivated"
      ? { active: false }
      : status === "active"
        ? { active: true, subscriptions: { some: { status: { in: LIVE }, currentPeriodEnd: { gte: now } } } }
        : status === "past_due"
          ? { subscriptions: { some: { status: "PAST_DUE" } } }
          : status === "none"
            ? { role: "MEMBER", active: true, subscriptions: { none: { status: { in: ACTIVE }, currentPeriodEnd: { gte: now } } } }
            : {}),
  };
  const [total, users, counts] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { subscriptions: { where: { status: { in: ACTIVE } }, include: { plan: true }, orderBy: { currentPeriodEnd: "desc" }, take: 1 } },
    }),
    Promise.all([
      db.user.count(),
      db.user.count({ where: { active: true, subscriptions: { some: { status: { in: LIVE }, currentPeriodEnd: { gte: now } } } } }),
      db.user.count({ where: { subscriptions: { some: { status: "PAST_DUE" } } } }),
      db.user.count({ where: { role: "MEMBER", active: true, subscriptions: { none: { status: { in: ACTIVE }, currentPeriodEnd: { gte: now } } } } }),
      db.user.count({ where: { active: false } }),
    ]),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const keep = { ...(q ? { q } : {}), ...(sp.role ? { role: sp.role } : {}), ...(status ? { status } : {}) };
  const href = (p: number) => `/admin/members?${new URLSearchParams({ ...keep, page: String(p) })}`;

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Members"
        description={`${total.toLocaleString()} account${total === 1 ? "" : "s"}${q ? ` matching “${q}”` : ""}`}
        secondary={
          <a href="/api/export/members" className={buttonClass("ghost", "md")}>
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
        action={
          <ButtonLink href="/admin/members/new" size="md">
            <Plus className="h-4 w-4" /> Add member
          </ButtonLink>
        }
      />
      <FilterBar
        basePath="/admin/members"
        active={status}
        pills={[
          { value: "", label: "All", count: counts[0] },
          { value: "active", label: "Active plan", count: counts[1] },
          { value: "past_due", label: "Past due", count: counts[2] },
          { value: "none", label: "No plan", count: counts[3] },
          { value: "deactivated", label: "Deactivated", count: counts[4] },
        ]}
        search={
          <form className="flex items-center gap-2" role="search">
            {status && <input type="hidden" name="status" value={status} />}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-fg-subtle" />
              <Input name="q" defaultValue={q} placeholder="Search name, email or code" className="h-10 w-64 pl-10" aria-label="Search members" />
            </div>
            <Select name="role" defaultValue={sp.role ?? ""} className="h-10 w-36" aria-label="Role">
              <option value="">All roles</option>
              <option value="MEMBER">Members</option>
              <option value="TRAINER">Trainers</option>
              <option value="ADMIN">Admins</option>
            </Select>
            <button className={buttonClass("glass", "sm", "h-10")}>Apply</button>
          </form>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th>Member</Th>
            <Th>Plan</Th>
            <Th>Valid until</Th>
            <Th className="hidden md:table-cell">Joined</Th>
            <Th className="w-28" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const s = u.subscriptions[0];
            return (
              <tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/8 text-xs font-semibold ring-1 ring-white/10">
                      {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </span>
                    <CellText
                      primary={
                        <span className="flex items-center gap-2">
                          <Link href={`/admin/members/${u.id}`} className="link text-fg">{u.name}</Link>
                          {u.role !== "MEMBER" && <Badge tone={u.role === "ADMIN" ? "accent" : "info"}>{u.role.toLowerCase()}</Badge>}
                          {!u.active && <Badge tone="danger">deactivated</Badge>}
                        </span>
                      }
                      secondary={`${u.email} · ${u.memberCode}`}
                    />
                  </div>
                </Td>
                <Td>{s ? <CellText primary={s.plan.name} secondary={<StatusBadge status={s.status} />} /> : <span className="text-fg-subtle">No plan</span>}</Td>
                <Td className={s && s.currentPeriodEnd.getTime() - now.getTime() < 7 * 864e5 ? "text-amber-300" : ""}>{s ? fmtDate(s.currentPeriodEnd) : "—"}</Td>
                <Td className="hidden md:table-cell text-fg-muted">{fmtDate(u.createdAt)}</Td>
                <Td className="text-right">
                  <Link href={`/admin/members/${u.id}`} className={buttonClass("ghost", "sm")}>Open</Link>
                </Td>
              </tr>
            );
          })}
          {users.length === 0 && (
            <tr>
              <Td colSpan={5} className="py-10 text-center text-fg-subtle">No members match these filters.</Td>
            </tr>
          )}
        </tbody>
      </Table>
      <Pagination page={page} pages={pages} href={href} />
    </>
  );
}
