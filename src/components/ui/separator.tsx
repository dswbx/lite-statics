import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { cn } from "@/lib/cn";

export function Separator({
   className,
   ...props
}: React.ComponentProps<typeof BaseSeparator>) {
   return (
      <BaseSeparator
         className={cn(
            "shrink-0 bg-line data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
            className
         )}
         {...props}
      />
   );
}
