import type { ReactNode } from "react";
import {
   AlertDialog,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./button";

export interface ConfirmDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   title: string;
   description?: ReactNode;
   confirmLabel?: string;
   cancelLabel?: string;
   confirmIcon?: ReactNode;
   destructive?: boolean;
   onConfirm: () => void;
}

export function ConfirmDialog({
   open,
   onOpenChange,
   title,
   description,
   confirmLabel = "Confirm",
   cancelLabel = "Cancel",
   confirmIcon,
   destructive,
   onConfirm,
}: ConfirmDialogProps) {
   return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
         <AlertDialogContent>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description ? (
               <AlertDialogDescription>{description}</AlertDialogDescription>
            ) : null}
            <AlertDialogFooter>
               <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
               >
                  {cancelLabel}
               </Button>
               <Button
                  type="button"
                  variant={destructive ? "destructive" : "default"}
                  onClick={() => {
                     onConfirm();
                     onOpenChange(false);
                  }}
               >
                  {confirmIcon}
                  {confirmLabel}
               </Button>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
