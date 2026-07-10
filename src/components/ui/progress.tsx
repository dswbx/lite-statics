import { Progress as BaseProgress } from "@base-ui/react/progress";
import { cn } from "@/lib/cn";

export interface ProgressProps
   extends Omit<React.ComponentProps<typeof BaseProgress.Root>, "children"> {
   trackClassName?: string;
   indicatorClassName?: string;
}

export function Progress({
   className,
   trackClassName,
   indicatorClassName,
   value,
   max = 100,
   ...props
}: ProgressProps) {
   return (
      <BaseProgress.Root
         value={value}
         max={max}
         className={cn("w-full", className)}
         {...props}
      >
         <BaseProgress.Track
            className={cn("h-2 w-full overflow-hidden rounded-full bg-surface2", trackClassName)}
         >
            <BaseProgress.Indicator
               className={cn("h-full rounded-full bg-accent transition-all", indicatorClassName)}
            />
         </BaseProgress.Track>
      </BaseProgress.Root>
   );
}
