import Link from "next/link";
import type { ClassSession, GymClass, User } from "@prisma/client";
import { fmtDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Row = ClassSession & { gymClass: GymClass & { trainer: User | null }; _count: { bookings: number } };

export function SessionList({ sessions, hrefBase, empty = "No sessions." }: { sessions: Row[]; hrefBase: string; empty?: string }) {
  if (sessions.length === 0) return <p className="text-sm text-fg-muted">{empty}</p>;
  return (
    <ul className="space-y-2">
      {sessions.map((s) => {
        const cap = s.capacity ?? s.gymClass.capacity;
        return (
          <li key={s.id}>
            <Link href={`${hrefBase}/${s.id}`} className="glass glass-sm glass-hover flex items-center gap-3 p-3">
              <span className="h-10 w-1.5 rounded-full" style={{ background: s.gymClass.color }} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.gymClass.name}</p>
                <p className="text-xs text-fg-muted">
                  {fmtDateTime(s.startsAt)} · {s.gymClass.location} · {s.gymClass.trainer?.name ?? "Unassigned"}
                </p>
              </div>
              {s.canceled ? <Badge tone="danger">Canceled</Badge> : <Badge tone={s._count.bookings >= cap ? "warning" : "info"}>{s._count.bookings}/{cap}</Badge>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
