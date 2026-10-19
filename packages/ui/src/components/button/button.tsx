import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Tooltip, TooltipContent, TooltipShortcut, TooltipTrigger } from "../ui/tooltip";

import styles from "./button.module.css";
import { cn } from "@/lib/utils";

const buttonVariants = cva(styles.baseButton, {
  variants: {
    variant: {
      default: null,
      destructive: styles.destructive,
      success: styles.success,
      outline: styles.outline,
      secondary: styles.secondary,
      ghost: styles.ghost,
      "ghost-icon": styles.ghostIcon,
      link: styles.link,
      white: styles.white,
    },
    size: {
      default: null,
      sm: styles.sizeSm,
      lg: styles.sizeLg,
      icon: styles.iconSize,
    },
    // Composable width modifier — stacks on top of variant/size (e.g. ghost-icon + mini)
    mini: {
      true: styles.mini,
      false: null,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    mini: false,
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
  ({ className, variant, size, mini, asChild = false, tooltipLabel, shortcut, title, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const contentLabel = tooltipLabel || (props["aria-label"] as string) || title || "";
    const hasTooltip = Boolean(contentLabel || shortcut);

    // The native title is dropped when our tooltip renders, so the browser's
    // own tooltip doesn't stack on top of it. aria-label keeps icon-only
    // buttons named for screen readers.
    const buttonEl = (
      <Comp
        className={cn(buttonVariants({ variant, size, mini, className }))}
        ref={ref}
        title={hasTooltip ? undefined : title}
        aria-label={props["aria-label"] ?? (hasTooltip ? contentLabel : undefined)}
        {...props}
      />
    );

    if (!hasTooltip) {
      return buttonEl;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonEl}</TooltipTrigger>
        <TooltipContent>
          <span>{contentLabel}</span>
          {shortcut ? <TooltipShortcut>{shortcut}</TooltipShortcut> : null}
        </TooltipContent>
      </Tooltip>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
