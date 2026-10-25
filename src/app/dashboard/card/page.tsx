import { requireUser } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/membership";
import { fmtDate } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

export default async function MemberCardPage() {
  const user = await requireUser();
  const sub = await getActiveSubscription(user.id);
  const settings = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Check-in" title="Your member card" description="Show this QR code at the front desk to check in or out. Add this page to your home screen for quick access." />
      <div className="mx-auto max-w-sm">
        <div className="glass glass-strong glass-float relative overflow-hidden p-6 text-center">
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-accent/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-accent-2/40 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-fg-muted">{settings.name}</p>
            <div className="mx-auto my-5 w-56 rounded-3xl bg-white p-3 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/qr" alt={`QR code for ${user.memberCode}`} className="h-auto w-full" />
            </div>
            <p className="text-xl font-semibold">{user.name}</p>
            <p className="font-mono text-sm tracking-[0.2em] text-fg-muted">{user.memberCode}</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              {sub ? (
                <>
                  <StatusBadge status={sub.status} />
                  <span className="text-fg-muted">{sub.plan.name} · until {fmtDate(sub.currentPeriodEnd)}</span>
                </>
              ) : (
                <StatusBadge status="EXPIRED" />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
