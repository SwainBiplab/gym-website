import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="glass glass-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className={cn("table-glass w-full", className)} {...props} />
      </div>
    </div>
  );
}
export function Th({ className, align, ...props }: ComponentProps<"th"> & { align?: "right" }) {
  return <th className={cn("px-4 text-left", align === "right" && "text-right", className)} {...props} />;
}
export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 align-middle", className)} {...props} />;
}
/** Primary + secondary text in one cell: name on top, muted detail below. */
export function CellText({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="cell-primary truncate">{primary}</div>
      {secondary && <div className="cell-secondary truncate">{secondary}</div>}
    </div>
  );
}
