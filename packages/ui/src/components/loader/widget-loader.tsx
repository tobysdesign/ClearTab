import * as React from "react";

import { cn } from "../../utils/cn";
import { BrandedLoader, type BrandedLoaderSize } from "./branded-loader";
import styles from "./widget-loader.module.css";

export interface WidgetLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  minHeight?: number | string;
  loaderSize?: BrandedLoaderSize;
}

export function WidgetLoader({
  className,
  style,
  minHeight = "16rem",
  loaderSize = "small",
  ...props
}: WidgetLoaderProps) {
  const computedMinHeight =
    typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  return (
    <div
      className={cn(styles.container, className)}
      style={{ minHeight: computedMinHeight, ...style }}
      {...props}
    >
      <BrandedLoader size={loaderSize} />
    </div>
  );
}
