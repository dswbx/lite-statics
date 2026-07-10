import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface MetricProps {
   label: string;
   value: ReactNode;
   unit?: string;
   accent?: boolean;
   className?: string;
}

export function Metric({ label, value, unit, accent, className }: MetricProps) {
   return (
      <div className={cn("rounded-xl border border-line bg-surface p-5", className)}>
         <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.04em] text-muted">
            {label}
         </div>
         <div
            className={cn(
               "font-mono text-[28px] font-semibold leading-none tracking-[-0.02em]",
               accent && "text-accent"
            )}
         >
            {value}
            {unit ? (
               <span className={cn("text-[14px]", accent ? "text-accent" : "text-muted")}> {unit}</span>
            ) : null}
         </div>
      </div>
   );
}

export interface MiniMetricProps {
   label: string;
   value: ReactNode;
   unit?: string;
   accent?: boolean;
   className?: string;
}

export function MiniMetric({ label, value, unit, accent, className }: MiniMetricProps) {
   return (
      <div className={cn(className)}>
         <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.04em] text-muted">
            {label}
         </div>
         <div
            className={cn(
               "font-mono text-[20px] font-semibold leading-none tracking-[-0.02em]",
               accent && "text-accent"
            )}
         >
            {value}
            {unit ? (
               <span className={cn("text-[14px]", accent ? "text-accent" : "text-muted")}> {unit}</span>
            ) : null}
         </div>
      </div>
   );
}
