import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "../../lib/cn";

type PanelTone = "default" | "strong" | "danger" | "chart" | "metric";

const toneClasses: Record<PanelTone, string> = {
  default: "bg-surface",
  strong: "bg-cream",
  danger: "bg-warm",
  chart: "bg-cream p-4",
  metric: "bg-surface p-4",
};

type PanelProps<T extends ElementType> = {
  tone?: PanelTone;
  as?: T;
  className?: string;
} & ComponentPropsWithoutRef<T>;

export function Panel<T extends ElementType = "section">({
  tone = "default",
  as,
  className,
  ...props
}: PanelProps<T>) {
  const Component = as ?? "section";
  return (
    <Component
      className={cn(
        "border-2 border-ink p-5 shadow-brutal",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
