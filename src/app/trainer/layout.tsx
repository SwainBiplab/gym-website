import { LayoutDashboard, CalendarDays, ScanLine, UserCircle, Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import type { NavItem } from "@/components/app/app-shell";

const items: NavItem[] = [
  { href: "/trainer", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/trainer/classes", label: "My classes", icon: CalendarDays },
  { href: "/trainer/checkin", label: "Front desk check-in", icon: ScanLine },
  { href: "/trainer/profile", label: "Coach profile", icon: UserCircle },
  { href: "/trainer/notifications", label: "Notifications", icon: Bell },
];

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["TRAINER", "ADMIN"]);
  return (
    <AppShell user={user} items={items} title="Coach">
      {children}
    </AppShell>
  );
}
