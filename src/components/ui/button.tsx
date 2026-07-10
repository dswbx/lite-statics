import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
   "inline-flex items-center justify-center gap-2 rounded-[10px] font-sans font-semibold whitespace-nowrap transition-colors disabled:opacity-55 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
   {
      variants: {
         variant: {
            default: "bg-ink text-on-ink hover:bg-ink/90",
            outline: "border border-ink text-ink bg-transparent hover:bg-ink/5",
            line: "border border-line text-ink bg-surface hover:bg-surface2",
            ghost: "text-muted hover:bg-surface2 hover:text-ink",
            accent: "bg-accent text-on-accent hover:bg-accent/90",
            destructive: "bg-danger-solid text-white hover:bg-danger-solid/90",
         },
         size: {
            default: "h-[42px] px-4 text-sm",
            sm: "h-9 px-3 text-[13px]",
            lg: "h-12 px-6 text-[15px]",
            icon: "size-10 p-0",
         },
      },
      defaultVariants: {
         variant: "default",
         size: "default",
      },
   }
);

export interface ButtonProps
   extends ButtonHTMLAttributes<HTMLButtonElement>,
      VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
   function Button({ className, variant, size, ...props }, ref) {
      return (
         <button
            ref={ref}
            className={cn(buttonVariants({ variant, size }), className)}
            {...props}
         />
      );
   }
);
