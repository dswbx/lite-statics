import type { AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "./button";

export interface PrimaryCtaProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
   disabled?: boolean;
}

export function PrimaryCta({ disabled, className, ...props }: PrimaryCtaProps) {
   return (
      <a
         className={cn(
            buttonVariants({ variant: "default" }),
            disabled && "pointer-events-none opacity-55",
            className
         )}
         aria-disabled={disabled || undefined}
         {...props}
      />
   );
}
