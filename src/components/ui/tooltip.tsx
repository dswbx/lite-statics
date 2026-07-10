import type { ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "@/lib/cn";

export const TooltipProvider = BaseTooltip.Provider;

export interface TooltipProps {
   content: ReactNode;
   children: React.ReactElement;
   side?: "top" | "bottom" | "left" | "right";
   sideOffset?: number;
   className?: string;
}

export function Tooltip({ content, children, side = "top", sideOffset = 6, className }: TooltipProps) {
   return (
      <BaseTooltip.Root>
         <BaseTooltip.Trigger render={children} />
         <BaseTooltip.Portal>
            <BaseTooltip.Positioner side={side} sideOffset={sideOffset}>
               <BaseTooltip.Popup
                  className={cn(
                     "rounded-md bg-ink px-2 py-1 text-xs text-on-ink shadow-pop transition data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
                     className
                  )}
               >
                  {content}
               </BaseTooltip.Popup>
            </BaseTooltip.Positioner>
         </BaseTooltip.Portal>
      </BaseTooltip.Root>
   );
}
