import type { Metadata } from "next";
import { AtSign } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Trainers" };

export default async function TrainersPage() {
  const trainers = await db.user.findMany({
    where: { role: "TRAINER", active: true },
    include: { trainerProfile: true, classesTaught: { where: { active: true } } },
    orderBy: [{ trainerProfile: { featured: "desc" } }, { name: "asc" }],
  });
  return (
    <>
      <PageHeader eyebrow="Coaches" title="Trainers who actually coach" description="Certified, experienced, and on the floor every day. Book a class or ask about personal training at the front desk." />
      <div className="grid gap-4 md:grid-cols-2">
        {trainers.map((t, i) => (
          <article key={t.id} className={`glass glass-hover rise rise-${(i % 4) + 1} p-7`}>
            <div className="flex items-start gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent-3/70 to-accent/70 text-lg font-semibold">
                {t.name
                  .split(" ")
                  .map((s) => s[0])
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{t.name}</h2>
                  {t.trainerProfile?.featured && <Badge tone="accent">Head coach</Badge>}
                </div>
                <p className="text-sm text-fg-muted">{t.trainerProfile?.yearsExperience ?? 0} years coaching</p>
                {t.trainerProfile?.instagram && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-fg-subtle">
                    <AtSign className="h-3 w-3" /> @{t.trainerProfile.instagram}
                  </p>
                )}
              </div>
            </div>
            <p className="mt-5 text-sm text-fg-muted">{t.trainerProfile?.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(t.trainerProfile?.specialties ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => (
                  <Badge key={s} tone="info">{s}</Badge>
                ))}
            </div>
            {t.classesTaught.length > 0 && (
              <p className="mt-4 text-xs text-fg-subtle">Teaches: {t.classesTaught.map((c) => c.name).join(", ")}</p>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
