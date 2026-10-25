import Link from "next/link";
import { LogOut, Bell } from "lucide-react";
import { Wordmark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { logoutAction } from "@/actions/auth";
import type { LucideIcon } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };
import { MobileSidebar } from "./mobile-sidebar";

export async function AppShell({ user, items, title, children }: { user: User; items: NavItem[]; title: string; children: React.ReactNode }) {
  const unread = await db.notification.count({ where: { userId: user.id, read: false } });
  const notificationsHref = (user.role === "ADMIN" || user.role === "SUPERADMIN") ? "/admin/notifications" : user.role === "TRAINER" ? "/trainer/notifications" : "/dashboard/notifications";
  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <>
      <Link href="/" className="mb-6 px-2" aria-label="Home">
        <Wordmark sub={title} />
      </Link>
      <SidebarNav items={items.map(({ icon: Icon, ...rest }) => ({ ...rest, icon: <Icon /> }))} />
      <div className="mt-auto pt-6">
        <div className="glass glass-sm flex items-center gap-3 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold ring-1 ring-white/15">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-fg-subtle">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button className="grid h-8 w-8 place-items-center rounded-full text-fg-muted hover:bg-white/10 hover:text-fg" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <div className="surface-app mx-auto flex min-h-screen w-full max-w-[1500px] gap-6 p-4 md:p-6">
      <aside className="glass glass-strong sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col p-4 lg:flex">{sidebar}</aside>
      <div className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between gap-3 lg:justify-end">
          <MobileSidebar>{sidebar}</MobileSidebar>
          <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href={notificationsHref} className="control relative grid h-10 w-10 place-items-center" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent-3 px-1 text-[10px] font-semibold text-white shadow">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
          </div>
        </div>
        <main className="pb-16">{children}</main>
      </div>
    </div>
  );
}
