import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-600 text-white",
        secondary:
          "border-transparent bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100",
        destructive:
          "border-transparent bg-red-600 text-white",
        outline: "text-surface-900 dark:text-surface-100",
        critical:
          "border-transparent bg-red-500/15 text-red-600 dark:text-red-400",
        high:
          "border-transparent bg-orange-500/15 text-orange-600 dark:text-orange-400",
        medium:
          "border-transparent bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
        low:
          "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400",
        info:
          "border-transparent bg-surface-500/15 text-surface-600 dark:text-surface-400",
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
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
