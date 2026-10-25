import { LayoutDashboard, Users, CreditCard, Receipt, Tags, CalendarDays, ScanLine, Megaphone, Inbox, BarChart3, ScrollText, Bell, Palette } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import type { NavItem } from "@/components/app/app-shell";

const items: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/payments", label: "Payments", icon: Receipt },
  { href: "/admin/plans", label: "Plans", icon: Tags },
  { href: "/admin/classes", label: "Classes", icon: CalendarDays },
  { href: "/admin/checkin", label: "Check-in desk", icon: ScanLine },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["ADMIN"]);
  const nav = user.role === "SUPERADMIN" ? [...items, { href: "/admin/settings", label: "Branding & settings", icon: Palette }] : items;
  return (
    <AppShell user={user} items={nav} title={user.role === "SUPERADMIN" ? "Super admin" : "Admin"}>
      {children}
    </AppShell>
  );
}
