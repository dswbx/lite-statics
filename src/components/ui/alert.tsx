import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
   info: "border-line bg-accent-soft text-accent",
   danger: "border-danger-border bg-danger-bg text-danger",
} as const;

export function Alert({
   tone = "info",
   className,
   children,
}: {
   tone?: keyof typeof tones;
   className?: string;
   children: ReactNode;
}) {
   return (
      <div
         role="status"
         className={cn(
            "rounded-[10px] border px-4 py-3 text-sm font-medium",
            tones[tone],
            className,
         )}
      >
         {children}
      </div>
   );
}
