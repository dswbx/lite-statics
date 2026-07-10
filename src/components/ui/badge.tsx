import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const badgeVariants = cva(
   "inline-flex items-center gap-1.5 rounded-full font-mono text-[11px] px-2.5 py-1",
   {
      variants: {
         variant: {
            accent: "bg-accent-soft text-accent",
            muted: "bg-surface2 text-muted",
            outline: "border border-line text-muted",
            danger: "bg-danger-bg text-danger",
         },
      },
      defaultVariants: {
         variant: "accent",
      },
   }
);

export interface BadgeProps
   extends HTMLAttributes<HTMLSpanElement>,
      VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
   return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
