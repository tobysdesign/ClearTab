"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface WidgetHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  titleClassName?: string;
}

export function WidgetHeader({
  title,
  children,
  className,
  titleClassName,
  ...props
}: WidgetHeaderProps) {
  return (
    <div className={cn("widget-header widget-flex-between", className)} {...props}>
      <h2 className={cn("widget-title", titleClassName)}>{title}</h2>
      {children ? <div className="widget-flex widget-gap-2">{children}</div> : null}
    </div>
  );
}
