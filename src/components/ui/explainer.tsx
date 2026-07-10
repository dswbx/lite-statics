import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ExplainerProps {
   icon: LucideIcon;
   title: string;
   children: ReactNode;
   className?: string;
}

export function Explainer({ icon: Icon, title, children, className }: ExplainerProps) {
   return (
      <div className={cn("rounded-xl border border-line bg-surface p-[26px]", className)}>
         <Icon size={22} strokeWidth={2} className="text-accent" />
         <h3 className="mt-4 text-[19px] font-semibold tracking-[-0.01em]">{title}</h3>
         <p className="mt-2 text-sm leading-[1.55] text-muted">{children}</p>
      </div>
   );
}
