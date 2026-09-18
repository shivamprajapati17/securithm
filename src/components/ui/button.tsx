import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ax-primary)]/50 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] rounded-[12px]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-ax-primary)] text-white border border-transparent hover:bg-[#9b5de5] hover:ax-glow",
        destructive:
          "bg-[var(--color-severity-critical)] text-white border border-transparent hover:brightness-110",
        outline:
          "bg-transparent border border-[var(--color-ax-border)] text-[var(--color-ax-text)] hover:bg-white/5 hover:border-[var(--color-ax-muted)]",
        secondary:
          "bg-[var(--color-ax-glow)]/10 text-[var(--color-ax-glow)] border border-[var(--color-ax-glow)]/30 hover:bg-[var(--color-ax-glow)]/20",
        ghost:
          "border-transparent text-[var(--color-ax-text)] bg-transparent hover:bg-white/5",
        link: "border-none text-[var(--color-ax-glow)] underline underline-offset-4 hover:bg-transparent hover:text-[#7cb0ff]",
      },
      size: {
        default: "h-12 px-5",
        sm: "h-9 px-3 text-xs rounded-[8px]",
        lg: "h-14 px-7 text-base",
        xl: "h-14 px-8 text-base",
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
