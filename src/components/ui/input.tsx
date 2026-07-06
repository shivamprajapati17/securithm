import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <div className="relative flex items-center">
      <span className="text-[var(--color-term-muted)] text-sm select-none shrink-0">
        $
      </span>
      <input
        type={type}
        className={cn(
          "flex-1 bg-transparent border-none outline-none text-[var(--color-term-fg)] font-mono text-sm px-2 py-1.5",
          "placeholder:text-[var(--color-term-muted)] placeholder:opacity-60",
          "caret-[var(--color-term-fg)]",
          "focus-visible:outline-none focus-visible:ring-0",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
Input.displayName = "Input";

export { Input };
