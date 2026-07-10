import type { ReactNode } from "react";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { cn } from "@/lib/cn";

export function RadioGroup({
   className,
   ...props
}: BaseRadioGroup.Props<string> & { className?: string }) {
   return <BaseRadioGroup className={cn("grid gap-2", className)} {...props} />;
}

export function Radio({
   className,
   ...props
}: React.ComponentProps<typeof BaseRadio.Root<string>>) {
   return (
      <BaseRadio.Root
         className={cn(
            "flex size-[18px] items-center justify-center rounded-full border border-line bg-surface data-[checked]:border-accent",
            className
         )}
         {...props}
      >
         <BaseRadio.Indicator className="size-[9px] rounded-full bg-accent" />
      </BaseRadio.Root>
   );
}

export interface RadioCardProps {
   value: string;
   icon?: ReactNode;
   children: ReactNode;
   className?: string;
}

export function RadioCard({ value, icon, children, className }: RadioCardProps) {
   return (
      <BaseRadio.Root
         value={value}
         className={cn(
            "flex flex-1 cursor-pointer items-center gap-2.5 rounded-[9px] border border-line px-3.5 py-3 text-sm font-medium text-muted transition-colors data-[checked]:border-[1.5px] data-[checked]:border-accent data-[checked]:bg-accent-soft data-[checked]:font-semibold data-[checked]:text-ink",
            className
         )}
      >
         <span className="flex size-[15px] shrink-0 items-center justify-center rounded-full border border-muted">
            <BaseRadio.Indicator className="size-[7px] rounded-full bg-accent" />
         </span>
         {icon}
         {children}
      </BaseRadio.Root>
   );
}
