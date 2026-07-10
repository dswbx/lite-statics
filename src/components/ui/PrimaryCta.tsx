import type { AnchorHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function PrimaryCta({
   disabled,
   className,
   ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { disabled?: boolean }) {
   return (
      <a
         className={cn(
            "inline-flex min-h-10 items-center gap-2 border-2 border-ink bg-lime px-3.5 py-2 text-ink no-underline",
            disabled && "pointer-events-none opacity-55",
            className
         )}
         aria-disabled={disabled || undefined}
         {...props}
      />
   );
}
