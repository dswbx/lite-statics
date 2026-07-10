import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mb-2 text-[0.78rem] font-black uppercase tracking-normal text-eyebrow", className)}
      {...props}
    />
  );
}
