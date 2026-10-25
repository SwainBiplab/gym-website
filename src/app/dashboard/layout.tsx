import { LayoutDashboard, CreditCard, CalendarDays, Ticket, TrendingUp, ClipboardCheck, Receipt, QrCode, UserCircle, Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import type { NavItem } from "@/components/app/app-shell";

const items: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/membership", label: "Membership", icon: CreditCard },
  { href: "/dashboard/classes", label: "Book classes", icon: CalendarDays },
  { href: "/dashboard/bookings", label: "My bookings", icon: Ticket },
  { href: "/dashboard/progress", label: "Progress", icon: TrendingUp },
  { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/dashboard/invoices", label: "Payments", icon: Receipt },
  { href: "/dashboard/card", label: "Member card", icon: QrCode },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={user} items={items} title="Member">
      {children}
    </AppShell>
  );
}
