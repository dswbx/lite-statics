import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function Checkbox({
   className,
   ...props
}: React.ComponentProps<typeof BaseCheckbox.Root>) {
   return (
      <BaseCheckbox.Root
         className={cn(
            "flex size-[18px] cursor-pointer items-center justify-center rounded-[5px] border border-line bg-surface transition-colors data-[checked]:border-accent data-[checked]:bg-accent",
            className
         )}
         {...props}
      >
         <BaseCheckbox.Indicator className="flex items-center justify-center">
            <Check size={12} strokeWidth={2} className="text-on-accent" />
         </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
   );
}
