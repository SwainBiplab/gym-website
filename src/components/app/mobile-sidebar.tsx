"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button aria-label="Open menu" onClick={() => setOpen(true)} className="control grid h-10 w-10 place-items-center">
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="glass glass-strong glass-float relative m-4 flex w-72 flex-col p-4 rise" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Close" onClick={() => setOpen(false)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
