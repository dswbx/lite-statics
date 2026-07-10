import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { cn } from "@/lib/cn";

export interface ToggleGroupProps {
   value?: string;
   defaultValue?: string;
   onValueChange?: (value: string) => void;
   disabled?: boolean;
   className?: string;
   children?: React.ReactNode;
}

export function ToggleGroup({
   value,
   defaultValue,
   onValueChange,
   className,
   ...props
}: ToggleGroupProps) {
   return (
      <BaseToggleGroup
         multiple={false}
         value={value !== undefined ? [value] : undefined}
         defaultValue={defaultValue !== undefined ? [defaultValue] : undefined}
         onValueChange={(next) => onValueChange?.(next[0] ?? "")}
         className={cn("flex gap-1.5", className)}
         {...props}
      />
   );
}

export function ToggleItem({
   className,
   ...props
}: React.ComponentProps<typeof BaseToggle>) {
   return (
      <BaseToggle
         className={cn(
            "cursor-pointer rounded-full border border-line px-3 py-1.5 text-[13px] font-medium text-muted transition-colors data-[pressed]:border-transparent data-[pressed]:bg-ink data-[pressed]:text-on-ink",
            className
         )}
         {...props}
      />
   );
}
