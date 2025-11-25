import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

import styles from "./button.module.css";
import { cn } from "@/lib/utils";

const buttonVariants = cva(styles.baseButton, {
  variants: {
    variant: {
      default: styles.default,
      destructive: styles.destructive,
      outline: styles.outline,
      secondary: styles.secondary,
      ghost: styles.ghost,
      "ghost-icon": styles.ghostIcon,
      link: styles.link,
      white: styles.white,
    },
    size: {
      default: styles.sizeDefault,
      sm: styles.sizeSm,
      lg: styles.sizeLg,
      icon: styles.iconSize,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  tooltipLabel?: string;
  shortcut?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, tooltipLabel, shortcut, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const contentLabel = tooltipLabel || (props["aria-label"] as string) || props.title || "";

    const buttonEl = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );

    if (!contentLabel && !shortcut) {
      return buttonEl;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonEl}</TooltipTrigger>
          <TooltipContent>
            <span>{contentLabel}</span>
            {shortcut ? (
              <span style={{ marginLeft: 8, opacity: 0.8 }}>{shortcut}</span>
            ) : null}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
