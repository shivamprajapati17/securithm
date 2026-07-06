"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border border-[var(--color-term-border)] bg-[var(--color-term-dim)] transition-colors",
      "focus-visible:outline-none focus-visible:border-[var(--color-term-fg)]",
      "disabled:cursor-not-allowed disabled:opacity-40",
      "data-[state=checked]:border-[var(--color-term-fg)] data-[state=checked]:bg-[var(--color-term-fg)]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-3 w-3 bg-[var(--color-term-bg)] transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5",
        "data-[state=checked]:bg-[var(--color-term-bg)]"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
