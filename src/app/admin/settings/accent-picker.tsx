"use client";
import { useState } from "react";
import { inkFor } from "@/lib/theme";
import { cn } from "@/lib/utils";

const PRESETS = [
  ["#E5B93C", "Gold"], ["#C8FA5F", "Lime"], ["#7CF2C4", "Mint"], ["#FFB86B", "Amber"], ["#FF7A9C", "Coral"], ["#7C8CFF", "Indigo"], ["#38D9F0", "Cyan"], ["#F5F5F5", "Chalk"],
] as const;

/** Colour picker with presets and a live preview; writes --accent on <html> so the whole app previews instantly. */
export function AccentPicker({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const apply = (hex: string) => {
    setValue(hex);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      document.documentElement.style.setProperty("--accent", hex);
      document.documentElement.style.setProperty("--on-accent", inkFor(hex));
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(([hex, name]) => (
          <button key={hex} type="button" onClick={() => apply(hex)} title={name} aria-label={name} className={cn("h-9 w-9 rounded-full border-2 transition", value.toLowerCase() === hex.toLowerCase() ? "scale-110 border-fg" : "border-transparent hover:scale-105")} style={{ background: hex }} />
        ))}
      </div>
      <label className="flex items-center gap-3">
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#E5B93C"} onChange={(e) => apply(e.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-glass-border bg-transparent p-1" aria-label="Custom colour" />
        <input name="accentColor" value={value} onChange={(e) => apply(e.target.value)} className="control h-11 flex-1 px-4 font-mono text-sm uppercase" pattern="^#[0-9a-fA-F]{6}$" required aria-label="Hex colour" />
      </label>
      <div className="glass glass-sm flex items-center justify-between gap-3 p-4">
        <span className="text-sm text-fg-muted">Preview</span>
        <span className="btn-primary inline-flex h-10 items-center rounded-full px-5 text-sm">Primary action</span>
        <span className="inline-flex items-center gap-1.5 text-sm text-accent"><span className="h-2 w-2 rounded-full bg-accent" /> Accent text</span>
      </div>
    </div>
  );
}
