import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
   mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
   { className, mono, ...props },
   ref
) {
   return (
      <input
         ref={ref}
         className={cn(
            "flex h-[42px] w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-55",
            mono && "font-mono",
            className
         )}
         {...props}
      />
   );
});
