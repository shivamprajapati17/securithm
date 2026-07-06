import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-mono border",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-term-fg)] text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] active:opacity-80 uppercase tracking-wider",
        destructive:
          "border-[var(--color-term-error)] text-[var(--color-term-error)] bg-transparent hover:bg-[var(--color-term-error)] hover:text-[var(--color-term-bg)] uppercase tracking-wider",
        outline:
          "border-[var(--color-term-border)] text-[var(--color-term-fg)] bg-transparent hover:border-[var(--color-term-fg)] uppercase tracking-wider",
        secondary:
          "border-[var(--color-term-border)] text-[var(--color-term-secondary)] bg-transparent hover:bg-[var(--color-term-secondary)] hover:text-[var(--color-term-bg)] uppercase tracking-wider",
        ghost:
          "border-transparent text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-dim)] hover:border-[var(--color-term-border)]",
        link:
          "border-none text-[var(--color-term-fg)] underline underline-offset-4 hover:bg-transparent hover:text-[var(--color-term-secondary)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
