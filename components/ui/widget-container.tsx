"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface WidgetContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function WidgetContainer({ children, className, ...props }: WidgetContainerProps) {
  return (
    <div
      className={cn(
        "widget-relative widget-full-height widget-full-width",
        className,
      )}
      {...props}
    >
      <div className="widget-absolute widget-full rounded-[22px] widget-background">
        <div className="widget-flex-column widget-full-height">{children}</div>
      </div>
    </div>
  );
}

interface WidgetContentProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

export function WidgetContent({
  children,
  className,
  scrollable = true,
}: WidgetContentProps) {
  const contentClasses = cn(
    "widget-flex-1",
    scrollable && "widget-overflow-auto custom-scrollbar",
    className,
  );

  return <div className={contentClasses}>{children}</div>;
}
