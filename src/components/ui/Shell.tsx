import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type ShellVariant = "landing" | "auth" | "app";

const variantClasses: Record<ShellVariant, string> = {
  landing: "shell-bg [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-[1180px]",
  app: "shell-bg [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-[1180px]",
  auth: "shell-bg grid content-center justify-items-center gap-[22px] [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-[520px]",
};

export function Shell({
  variant,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { variant: ShellVariant; children: ReactNode }) {
  return (
    <main className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </main>
  );
}
