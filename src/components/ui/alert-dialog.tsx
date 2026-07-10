import type { HTMLAttributes, ReactNode } from "react";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { cn } from "@/lib/cn";

export const AlertDialog = BaseAlertDialog.Root;
export const AlertDialogTrigger = BaseAlertDialog.Trigger;
export const AlertDialogClose = BaseAlertDialog.Close;

export function AlertDialogTitle({
   className,
   ...props
}: React.ComponentProps<typeof BaseAlertDialog.Title>) {
   return <BaseAlertDialog.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

export function AlertDialogDescription({
   className,
   ...props
}: React.ComponentProps<typeof BaseAlertDialog.Description>) {
   return (
      <BaseAlertDialog.Description className={cn("mt-1 text-sm text-muted", className)} {...props} />
   );
}

export function AlertDialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
   return <div className={cn("mt-5 flex justify-end gap-2", className)} {...props} />;
}

export interface AlertDialogContentProps {
   children: ReactNode;
   className?: string;
}

export function AlertDialogContent({ children, className }: AlertDialogContentProps) {
   return (
      <BaseAlertDialog.Portal>
         <BaseAlertDialog.Backdrop className="fixed inset-0 bg-scrim backdrop-blur-[1px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
         <BaseAlertDialog.Viewport className="fixed inset-0 flex items-center justify-center p-4">
            <BaseAlertDialog.Popup
               className={cn(
                  "w-full max-w-md rounded-[14px] border border-line bg-surface p-6 shadow-pop transition data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
                  className
               )}
            >
               {children}
            </BaseAlertDialog.Popup>
         </BaseAlertDialog.Viewport>
      </BaseAlertDialog.Portal>
   );
}
