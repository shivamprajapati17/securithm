import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ex-obsidian)]/40 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] rounded-[2px]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-ex-obsidian)] text-[var(--color-ex-paper)] hover:bg-black",
        destructive:
          "bg-[var(--color-severity-critical)] text-white hover:brightness-110",
        outline:
          "bg-transparent border border-[var(--color-ex-obsidian)] text-[var(--color-ex-obsidian)] hover:bg-[var(--color-term-dim)]",
        secondary:
          "bg-transparent border border-white/50 text-white hover:border-white hover:bg-white/5",
        ghost:
          "border border-transparent text-[var(--color-ex-obsidian)] bg-transparent hover:bg-[var(--color-term-dim)]",
        link: "border-none text-[var(--color-ex-obsidian)] underline underline-offset-4 hover:bg-transparent hover:opacity-70",
      },
      size: {
        default: "h-12 px-4",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-12 px-6 text-[15px]",
        xl: "h-14 px-7 text-base",
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
