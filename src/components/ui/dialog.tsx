import type { ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/cn";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export function DialogTitle({
   className,
   ...props
}: React.ComponentProps<typeof BaseDialog.Title>) {
   return <BaseDialog.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogDescription({
   className,
   ...props
}: React.ComponentProps<typeof BaseDialog.Description>) {
   return (
      <BaseDialog.Description className={cn("mt-1 text-sm text-muted", className)} {...props} />
   );
}

export interface DialogContentProps {
   children: ReactNode;
   className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
   return (
      <BaseDialog.Portal>
         <BaseDialog.Backdrop className="fixed inset-0 bg-scrim backdrop-blur-[1px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
         <BaseDialog.Viewport className="fixed inset-0 flex items-center justify-center p-4">
            <BaseDialog.Popup
               className={cn(
                  "w-full max-w-md rounded-[14px] border border-line bg-surface p-6 shadow-pop transition data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
                  className
               )}
            >
               {children}
            </BaseDialog.Popup>
         </BaseDialog.Viewport>
      </BaseDialog.Portal>
   );
}
