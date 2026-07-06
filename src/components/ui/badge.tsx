import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center text-xs font-mono tracking-wider transition-colors focus:outline-none border",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-term-fg)] text-[var(--color-term-fg)] bg-transparent uppercase",
        secondary:
          "border-[var(--color-term-border)] text-[var(--color-term-muted)] uppercase",
        destructive:
          "border-[var(--color-term-error)] text-[var(--color-term-error)]",
        outline:
          "border-[var(--color-term-border)] text-[var(--color-term-fg)]",
        critical:
          "border-[var(--color-term-error)] text-[var(--color-term-error)]",
        high:
          "border-[var(--color-term-warning)] text-[var(--color-term-warning)]",
        medium:
          "border-[var(--color-term-medium)] text-[var(--color-term-medium)]",
        low:
          "border-[var(--color-severity-low)] text-[var(--color-severity-low)]",
        info:
          "border-[var(--color-term-border)] text-[var(--color-term-muted)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), "px-1.5 py-0.5", className)} {...props} />
  );
}

export { Badge, badgeVariants };
