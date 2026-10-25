import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";
import { addProgressAction, addWorkoutAction, deleteProgressAction, deleteWorkoutAction } from "@/actions/progress";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";
import { SeriesChart } from "@/components/charts/line-chart";
import { Stat } from "@/components/ui/stat";
import { Table, Th, Td } from "@/components/ui/table";
import { ConfirmButton } from "@/components/forms/confirm-button";

export default async function ProgressPage() {
  const user = await requireUser();
  const [logs, workouts] = await Promise.all([
    db.progressLog.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
    db.workoutLog.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 20 }),
  ]);
  const weight = logs.filter((l) => l.weightKg != null).map((l) => ({ label: format(l.date, "MMM d"), date: fmtDate(l.date), value: l.weightKg! }));
  const fat = logs.filter((l) => l.bodyFatPct != null).map((l) => ({ label: format(l.date, "MMM d"), date: fmtDate(l.date), value: l.bodyFatPct! }));
  const waist = logs.filter((l) => l.waistCm != null).map((l) => ({ label: format(l.date, "MMM d"), date: fmtDate(l.date), value: l.waistCm! }));
  const first = weight[0]?.value;
  const last = weight.at(-1)?.value;
  const delta = first != null && last != null ? last - first : null;
  const today = format(new Date(), "yyyy-MM-dd");
  const monthMinutes = workouts.filter((w) => w.date.getMonth() === new Date().getMonth()).reduce((a, w) => a + w.durationMin, 0);

  return (
    <>
      <PageHeader eyebrow="Progress" title="Track your progress" description="Log measurements and workouts. Consistency beats intensity." />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Current weight" value={last != null ? `${last.toFixed(1)} kg` : "—"} hint={delta != null ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg since first log` : "Log your first measurement"} />
        <Stat label="Body fat" value={fat.at(-1) ? `${fat.at(-1)!.value.toFixed(1)}%` : "—"} hint="Latest reading" tone="accent-2" />
        <Stat label="Training this month" value={`${Math.round(monthMinutes / 60)}h ${monthMinutes % 60}m`} hint={`${workouts.filter((w) => w.date.getMonth() === new Date().getMonth()).length} workouts logged`} tone="accent-3" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Body weight" description="kg over time" />
          <SeriesChart points={weight} unit=" kg" color="var(--accent)" />
        </Card>
        <Card>
          <CardHeader title="Waist" description="cm over time" />
          <SeriesChart points={waist} unit=" cm" color="#9fb3c8" />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Log a measurement" />
          <ActionForm action={addProgressAction} resetOnSuccess>
            <FormAlert />
            <div className="grid grid-cols-2 gap-3">
              <AField name="date" label="Date" className="col-span-2">
                <Input name="date" type="date" defaultValue={today} required />
              </AField>
              <AField name="weightKg" label="Weight (kg)"><Input name="weightKg" type="number" step="0.1" placeholder="80.0" /></AField>
              <AField name="bodyFatPct" label="Body fat (%)"><Input name="bodyFatPct" type="number" step="0.1" placeholder="18" /></AField>
              <AField name="chestCm" label="Chest (cm)"><Input name="chestCm" type="number" step="0.1" /></AField>
              <AField name="waistCm" label="Waist (cm)"><Input name="waistCm" type="number" step="0.1" /></AField>
              <AField name="hipsCm" label="Hips (cm)"><Input name="hipsCm" type="number" step="0.1" /></AField>
              <AField name="armsCm" label="Arms (cm)"><Input name="armsCm" type="number" step="0.1" /></AField>
            </div>
            <AField name="notes" label="Notes"><Textarea name="notes" className="min-h-20" placeholder="Feeling strong…" /></AField>
            <SubmitButton pendingText="Saving…">Save measurement</SubmitButton>
          </ActionForm>
        </Card>
        <Card>
          <CardHeader title="Log a workout" />
          <ActionForm action={addWorkoutAction} resetOnSuccess>
            <FormAlert />
            <div className="grid grid-cols-2 gap-3">
              <AField name="date" label="Date"><Input name="date" type="date" defaultValue={today} required /></AField>
              <AField name="title" label="Workout"><Input name="title" placeholder="Push day" required /></AField>
              <AField name="durationMin" label="Duration (min)"><Input name="durationMin" type="number" defaultValue={60} required /></AField>
              <AField name="calories" label="Calories (optional)"><Input name="calories" type="number" /></AField>
            </div>
            <AField name="notes" label="Notes"><Textarea name="notes" className="min-h-20" placeholder="Bench 80kg 5x5…" /></AField>
            <SubmitButton pendingText="Saving…">Save workout</SubmitButton>
          </ActionForm>
          <h4 className="mb-2 mt-6 text-sm font-medium text-fg-muted">Recent workouts</h4>
          <ul className="divide-y divide-white/6 text-sm">
            {workouts.slice(0, 8).map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  {w.title} <span className="text-fg-subtle">· {fmtDate(w.date)} · {w.durationMin} min{w.calories ? ` · ${w.calories} kcal` : ""}</span>
                </span>
                <form action={deleteWorkoutAction.bind(null, w.id)}>
                  <ConfirmButton confirm={`Delete “${w.title}” from ${fmtDate(w.date)}?`} className="grid h-7 w-7 place-items-center rounded-full text-fg-subtle hover:bg-white/10 hover:text-accent-3" aria-label="Delete workout">
                    <Trash2 className="h-3.5 w-3.5" />
                  </ConfirmButton>
                </form>
              </li>
            ))}
            {workouts.length === 0 && <li className="py-2 text-fg-subtle">No workouts logged yet.</li>}
          </ul>
        </Card>
      </div>

      {logs.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold">Measurement history</h3>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th><Th>Weight</Th><Th>Body fat</Th><Th className="hidden md:table-cell">Chest</Th><Th>Waist</Th><Th className="hidden md:table-cell">Hips</Th><Th className="hidden md:table-cell">Arms</Th><Th />
              </tr>
            </thead>
            <tbody>
              {[...logs].reverse().map((l) => (
                <tr key={l.id}>
                  <Td>{fmtDate(l.date)}</Td>
                  <Td>{l.weightKg ?? "—"}</Td><Td>{l.bodyFatPct ?? "—"}</Td><Td className="hidden md:table-cell">{l.chestCm ?? "—"}</Td><Td>{l.waistCm ?? "—"}</Td><Td className="hidden md:table-cell">{l.hipsCm ?? "—"}</Td><Td className="hidden md:table-cell">{l.armsCm ?? "—"}</Td>
                  <Td>
                    <form action={deleteProgressAction.bind(null, l.id)}>
                      <ConfirmButton confirm={`Delete the measurement from ${fmtDate(l.date)}?`} className="grid h-7 w-7 place-items-center rounded-full text-fg-subtle hover:bg-white/10 hover:text-accent-3" aria-label="Delete measurement">
                        <Trash2 className="h-3.5 w-3.5" />
                      </ConfirmButton>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}
