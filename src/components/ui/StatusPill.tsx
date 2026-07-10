import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type StatusKind = "uploaded" | "empty" | "disabled";

const kindClasses: Record<StatusKind, string> = {
  uploaded: "bg-lime",
  empty: "bg-pill-empty",
  disabled: "bg-coral-soft",
};

export function StatusPill({
  kind,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { kind: StatusKind }) {
  return (
    <span
      className={cn(
        "w-fit border-2 border-ink px-2 py-1 text-[0.78rem] font-black !text-ink",
        kindClasses[kind],
        className,
      )}
      {...props}
    />
  );
}
