"use client";

import * as React from "react";

import { cn } from "../../utils/cn";

export interface WidgetContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function WidgetContainer({
  children,
  className,
  ...props
}: WidgetContainerProps) {
  return (
    <div
      className={cn(
        "widget-relative widget-full-height widget-full-width",
        className,
      )}
      {...props}
    >
      <div className="widget-absolute widget-full widget-background">
        <div className="widget-flex-column widget-full-height">{children}</div>
      </div>
    </div>
  );
}

export interface WidgetContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  scrollable?: boolean;
}

export function WidgetContent({
  children,
  className,
  scrollable = true,
  ...props
}: WidgetContentProps) {
  return (
    <div
      className={cn(
        "widget-flex-1",
        scrollable && "widget-overflow-auto custom-scrollbar",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
