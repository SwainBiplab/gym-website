import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Consistent filter row for list pages: pill links for status + optional search form on the right.
 * Active pill is lime; counts are muted. Includes a "Clear" link when any filter is set.
 */
export function FilterBar({ pills, basePath, active, search, cleared }: { pills: { value: string; label: string; count?: number }[]; basePath: string; active?: string; search?: ReactNode; cleared?: boolean }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Filter" className="flex flex-wrap items-center gap-1.5">
        {pills.map((p) => {
          const isActive = (active ?? "") === p.value;
          return (
            <Link
              key={p.value}
              href={p.value ? `${basePath}?status=${encodeURIComponent(p.value)}` : basePath}
              aria-current={isActive ? "page" : undefined}
              className={cn("control inline-flex h-9 items-center gap-1.5 px-3.5 text-sm", isActive && "border-accent/60 bg-accent/15 text-fg")}
            >
              {p.label}
              {p.count != null && <span className={cn("text-xs", isActive ? "text-accent" : "text-fg-subtle")}>{p.count}</span>}
            </Link>
          );
        })}
        {!cleared && active && (
          <Link href={basePath} className="link link-muted ml-1 text-sm">
            Clear
          </Link>
        )}
      </nav>
      {search}
    </div>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-5 flex items-center justify-center gap-3 text-sm">
      <Link aria-disabled={page <= 1} href={href(Math.max(1, page - 1))} className={cn("control h-9 px-4 leading-9", page <= 1 && "pointer-events-none opacity-40")}>
        Previous
      </Link>
      <span className="text-fg-muted">
        Page <b className="text-fg">{page}</b> of {pages}
      </span>
      <Link aria-disabled={page >= pages} href={href(Math.min(pages, page + 1))} className={cn("control h-9 px-4 leading-9", page >= pages && "pointer-events-none opacity-40")}>
        Next
      </Link>
    </nav>
  );
}
