import { requireUser } from "@/lib/auth";
import { CheckInDesk } from "@/components/app/checkin-desk";

export default async function Page() {
  await requireUser(["TRAINER", "ADMIN"]);
  return <CheckInDesk />;
}
