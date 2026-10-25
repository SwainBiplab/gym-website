import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtDateTime, money, ago } from "@/lib/utils";
import {
  updateMemberAction, adminSetPasswordAction, deleteMemberAction, adminAssignPlanAction, adminExtendSubscriptionAction, adminCancelSubscriptionAction,
  markPaymentPaidAction, recordPaymentAction, updateTrainerProfileAdminAction,
} from "@/actions/admin";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";
import { ActionButton } from "@/components/forms/action-button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { ProgressRing } from "@/components/brand/progress-ring";
import { AttendanceMap } from "@/components/brand/attendance-map";
import { ConfirmButton } from "@/components/forms/confirm-button";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser(["ADMIN"]);
  const user = await db.user.findUnique({
    where: { id },
    include: {
      trainerProfile: true,
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 20 },
      checkIns: { orderBy: { checkedInAt: "desc" }, take: 400 },
      bookings: { include: { session: { include: { gymClass: true } } }, orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { checkIns: true, bookings: true } },
    },
  });
  if (!user) notFound();
  const plans = await db.plan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const current = user.subscriptions.find((s) => ["ACTIVE", "TRIALING", "PAST_DUE"].includes(s.status) && s.currentPeriodEnd >= new Date());
  const nowMs = new Date().getTime();
  const outstanding = user.payments.filter((p) => p.status === "PENDING").reduce((a, p) => a + p.amountCents, 0);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/admin/members" className="link text-fg">← Members</Link>}
        title={user.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs">{user.memberCode}</span> · {user.email} {user.phone && `· ${user.phone}`}
            <Badge tone={user.role === "ADMIN" ? "accent" : user.role === "TRAINER" ? "info" : "neutral"}>{user.role.toLowerCase()}</Badge>
            {!user.active && <Badge tone="danger">deactivated</Badge>}
            {!user.emailVerifiedAt && <Badge tone="warning">email unverified</Badge>}
          </span>
        }
        action={
          user.id !== me.id && (
            <form action={deleteMemberAction.bind(null, user.id)}>
              <ConfirmButton confirm={`Permanently delete ${user.name}'s account, subscriptions, bookings and history? This cannot be undone.`} className="link text-sm !text-accent-3">
                Delete account
              </ConfirmButton>
            </form>
          )
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass glass-sm flex items-center gap-4 p-5">
          <ProgressRing
            value={current ? Math.min(1, (nowMs - current.currentPeriodStart.getTime()) / Math.max(1, current.currentPeriodEnd.getTime() - current.currentPeriodStart.getTime())) : 0}
            size={64}
            stroke={6}
            tone={current?.status === "PAST_DUE" ? "coral" : current ? "lime" : "steel"}
            label={current ? `${Math.max(0, Math.ceil((current.currentPeriodEnd.getTime() - nowMs) / 864e5))}d` : "—"}
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Membership</p>
            <p className="mt-1 text-lg font-semibold">{current ? current.plan.name : "None"}</p>
            <p className="text-[13px] text-fg-subtle">{current ? <StatusBadge status={current.status} /> : "No active plan"}</p>
          </div>
        </div>
        <Stat label="Outstanding" value={money(outstanding)} hint={outstanding ? "Pay-at-desk balance" : "All paid"} tone="accent-3" />
        <Stat label="Visits" value={user._count.checkIns} hint={user.checkIns[0] ? `Last ${ago(user.checkIns[0].checkedInAt)}` : "Never"} tone="accent-2" />
        <Stat label="Bookings" value={user._count.bookings} hint={`Joined ${fmtDate(user.createdAt)}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Membership" />
          {current ? (
            <div className="mb-5 rounded-2xl border border-white/8 bg-white/4 p-4 text-sm">
              <p className="font-medium">{current.plan.name} <StatusBadge status={current.status} /></p>
              <p className="text-fg-muted">{fmtDate(current.currentPeriodStart)} → {fmtDate(current.currentPeriodEnd)} · {current.source}{current.cancelAtPeriodEnd && " · cancels at period end"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton action={adminExtendSubscriptionAction.bind(null, current.id, 7)}>+7 days</ActionButton>
                <ActionButton action={adminExtendSubscriptionAction.bind(null, current.id, 30)}>+30 days</ActionButton>
                <ActionButton action={adminCancelSubscriptionAction.bind(null, current.id)} variant="danger" confirm="Cancel this membership immediately?">Cancel now</ActionButton>
              </div>
            </div>
          ) : (
            <p className="mb-5 text-sm text-fg-muted">No active membership.</p>
          )}
          <ActionForm action={adminAssignPlanAction.bind(null, user.id)}>
            <FormAlert />
            <p className="text-sm font-medium">{current ? "Change plan" : "Assign a plan"}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <AField name="planId" label="Plan">
                <Select name="planId" required defaultValue="">
                  <option value="" disabled>Choose…</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {money(p.priceCents, p.currency)}</option>
                  ))}
                </Select>
              </AField>
              <AField name="startDate" label="Start date"><Input name="startDate" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} /></AField>
              <AField name="method" label="Payment method">
                <Select name="method" defaultValue="CASH">
                  <option>CASH</option><option>CARD</option><option>BANK</option>
                </Select>
              </AField>
              <div className="flex items-end pb-3"><Checkbox name="paid" label="Payment collected" defaultChecked /></div>
            </div>
            <SubmitButton size="sm" pendingText="Saving…">Assign plan</SubmitButton>
          </ActionForm>
          {user.subscriptions.length > 0 && (
            <ul className="mt-5 divide-y divide-white/6 text-xs text-fg-muted">
              {user.subscriptions.slice(0, 6).map((s) => (
                <li key={s.id} className="flex justify-between py-1.5">
                  <span>{s.plan.name} · {fmtDate(s.currentPeriodStart)} → {fmtDate(s.currentPeriodEnd)}</span>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Payments" />
          <ul className="mb-5 divide-y divide-white/6 text-sm">
            {user.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {p.description} <span className="text-fg-subtle">· {fmtDate(p.paidAt ?? p.createdAt)} · {p.method}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{money(p.amountCents, p.currency)}</span>
                  <StatusBadge status={p.status} />
                  {p.status !== "PAID" && <ActionButton action={markPaymentPaidAction.bind(null, p.id)} variant="primary">Mark paid</ActionButton>}
                </span>
              </li>
            ))}
            {user.payments.length === 0 && <li className="py-2 text-fg-subtle">No payments.</li>}
          </ul>
          <ActionForm action={recordPaymentAction.bind(null, user.id)} resetOnSuccess>
            <FormAlert />
            <p className="text-sm font-medium">Record a payment</p>
            <div className="grid gap-3 md:grid-cols-3">
              <AField name="amount" label="Amount"><Input name="amount" type="number" step="0.01" min="0" required /></AField>
              <AField name="method" label="Method">
                <Select name="method" defaultValue="CASH"><option>CASH</option><option>CARD</option><option>BANK</option></Select>
              </AField>
              <AField name="description" label="Description"><Input name="description" defaultValue="Front desk payment" /></AField>
            </div>
            <SubmitButton size="sm" variant="glass" pendingText="Saving…">Record</SubmitButton>
          </ActionForm>
        </Card>

        <Card>
          <CardHeader title="Account details" />
          <ActionForm action={updateMemberAction.bind(null, user.id)}>
            <FormAlert />
            <div className="grid gap-3 md:grid-cols-2">
              <AField name="name" label="Name"><Input name="name" defaultValue={user.name} required /></AField>
              <AField name="role" label="Role">
                <Select name="role" defaultValue={user.role}>
                  <option value="MEMBER">Member</option><option value="TRAINER">Trainer</option><option value="ADMIN">Admin</option>
                </Select>
              </AField>
              <AField name="phone" label="Phone"><Input name="phone" defaultValue={user.phone ?? ""} /></AField>
              <AField name="emergencyContact" label="Emergency contact"><Input name="emergencyContact" defaultValue={user.emergencyContact ?? ""} /></AField>
            </div>
            <AField name="address" label="Address"><Input name="address" defaultValue={user.address ?? ""} /></AField>
            <AField name="notes" label="Staff notes" hint="Private — never shown to the member"><Textarea name="notes" className="min-h-20" defaultValue={user.notes ?? ""} /></AField>
            <Checkbox name="active" label="Account active" defaultChecked={user.active} />
            <div><SubmitButton size="sm" pendingText="Saving…">Save</SubmitButton></div>
          </ActionForm>
          <div className="mt-6 border-t border-white/8 pt-4">
            <ActionForm action={adminSetPasswordAction.bind(null, user.id)} resetOnSuccess>
              <FormAlert />
              <div className="flex items-end gap-2">
                <AField name="password" label="Reset password" className="flex-1"><Input name="password" type="text" minLength={8} placeholder="New temporary password" /></AField>
                <SubmitButton size="md" variant="glass" pendingText="…">Set</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </Card>

        <div className="space-y-6">
          {user.role === "TRAINER" && (
            <Card>
              <CardHeader title="Trainer profile" />
              <ActionForm action={updateTrainerProfileAdminAction.bind(null, user.id)}>
                <FormAlert />
                <AField name="bio" label="Bio"><Textarea name="bio" className="min-h-20" defaultValue={user.trainerProfile?.bio ?? ""} /></AField>
                <AField name="specialties" label="Specialties"><Input name="specialties" defaultValue={user.trainerProfile?.specialties ?? ""} /></AField>
                <div className="grid gap-3 md:grid-cols-2">
                  <AField name="yearsExperience" label="Years"><Input name="yearsExperience" type="number" defaultValue={user.trainerProfile?.yearsExperience ?? 0} /></AField>
                  <AField name="instagram" label="Instagram"><Input name="instagram" defaultValue={user.trainerProfile?.instagram ?? ""} /></AField>
                </div>
                <Checkbox name="featured" label="Feature on home page" defaultChecked={user.trainerProfile?.featured} />
                <div><SubmitButton size="sm" pendingText="Saving…">Save</SubmitButton></div>
              </ActionForm>
            </Card>
          )}
          <Card>
            <CardHeader title="Visit map" />
            <AttendanceMap dates={user.checkIns.map((c) => c.checkedInAt)} weeks={12} />
          </Card>
          <Card>
            <CardHeader title="Recent activity" />
            <ul className="divide-y divide-white/6 text-sm">
              {user.bookings.slice(0, 5).map((b) => (
                <li key={b.id} className="flex justify-between py-2">
                  <span>{b.session.gymClass.name} <span className="text-fg-subtle">· {fmtDateTime(b.session.startsAt)}</span></span>
                  <StatusBadge status={b.status} />
                </li>
              ))}
              {user.checkIns.slice(0, 5).map((c) => (
                <li key={c.id} className="flex justify-between py-2 text-fg-muted">
                  <span>Check-in · {c.method}</span>
                  <span>{fmtDateTime(c.checkedInAt)}</span>
                </li>
              ))}
              {user.bookings.length === 0 && user.checkIns.length === 0 && <li className="py-2 text-fg-subtle">No activity yet.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
