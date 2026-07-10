import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { cn } from "@/lib/cn";

export function Tabs({
   className,
   ...props
}: React.ComponentProps<typeof BaseTabs.Root>) {
   return <BaseTabs.Root className={cn("flex flex-col", className)} {...props} />;
}

export function TabsList({
   className,
   ...props
}: React.ComponentProps<typeof BaseTabs.List>) {
   return <BaseTabs.List className={cn("relative flex gap-1", className)} {...props} />;
}

export function TabsTab({
   className,
   ...props
}: React.ComponentProps<typeof BaseTabs.Tab>) {
   return (
      <BaseTabs.Tab
         className={cn(
            "relative z-10 flex-1 cursor-pointer rounded-[9px] px-3 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:text-ink data-[active]:font-semibold data-[active]:text-on-ink data-[active]:hover:text-on-ink",
            className
         )}
         {...props}
      />
   );
}

export function TabsIndicator({
   className,
   ...props
}: React.ComponentProps<typeof BaseTabs.Indicator>) {
   return (
      <BaseTabs.Indicator
         className={cn(
            "absolute top-0 left-0 z-0 h-full w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-[9px] bg-ink transition-all",
            className
         )}
         {...props}
      />
   );
}

export function TabsPanel({
   className,
   ...props
}: React.ComponentProps<typeof BaseTabs.Panel>) {
   return <BaseTabs.Panel className={cn(className)} {...props} />;
}
