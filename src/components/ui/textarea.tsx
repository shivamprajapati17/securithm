import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[200px] w-full border border-[var(--color-term-border)] bg-[var(--color-term-bg)] px-3 py-2 text-sm font-mono",
        "text-[var(--color-term-fg)] placeholder:text-[var(--color-term-muted)] placeholder:opacity-60",
        "caret-[var(--color-term-fg)]",
        "focus-visible:outline-none focus-visible:border-[var(--color-term-fg)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "resize-y",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
