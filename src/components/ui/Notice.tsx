import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type NoticeTone = "ok" | "bad";

const toneClasses: Record<NoticeTone, string> = {
  ok: "bg-lime",
  bad: "bg-coral",
};

export function Notice({
  tone,
  inline,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { tone: NoticeTone; inline?: boolean }) {
  return (
    <p
      className={cn(
        "border-2 border-ink px-3.5 py-3 font-[850]",
        inline ? "mt-4" : "mx-auto mt-[18px]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
