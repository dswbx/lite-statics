import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
   return (
      <div
         className={cn("font-mono text-[12px] uppercase tracking-[0.08em] text-muted", className)}
         {...props}
      />
   );
}
