import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant =
   | "default"
   | "ghost"
   | "danger"
   | "text"
   | "icon"
   | "copy"
   | "brand"
   | "nav";

const variantClasses: Record<ButtonVariant, string> = {
   default: "",
   ghost: "border-2 border-ink bg-transparent text-ink",
   danger: "bg-danger text-cream",
   text: "min-h-[34px] justify-self-start bg-transparent px-0 py-[5px] text-link",
   icon: "min-w-[42px] p-2.5",
   copy: "min-w-11 border-2 border-ink bg-cream p-2.5 text-ink",
   brand: "bg-transparent px-0 font-serif text-[1.35rem] text-ink",
   nav: "border-2 border-ink bg-cream text-ink data-[active=true]:bg-lime",
};

export function Button({
   variant = "default",
   className,
   active,
   ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
   variant?: ButtonVariant;
   active?: boolean;
}) {
   return (
      <button
         className={cn(variantClasses[variant], className)}
         data-active={active ? "true" : undefined}
         {...props}
      />
   );
}
