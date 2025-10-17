import * as React from "react";
import { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./BentoGrid.module.css";
import ScheduleWidget from "../widgets/schedule-widget";

// Note: The Button component and cn utility are not available yet.
// I will create them later.

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps {
  name: string;
  className: string;
  background: React.ReactNode;
  Icon: React.ElementType;
  description: string;
  href: string;
  cta: string;
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={[styles.grid, className].join(" ")} {...props}>
      {children}
      <ScheduleWidget />
    </div>
  ),
);
BentoGrid.displayName = "BentoGrid";

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: BentoCardProps) => (
  <div key={name} className={[styles.card, className].join(" ")}>
    <div>{background}</div>
    <div className={styles.cardContent}>
      <Icon className={styles.icon} />
      <h3 className={styles.heading}>{name}</h3>
      <p className={styles.description}>{description}</p>
    </div>

    <div className={styles.ctaContainer}>
      {/* <Button variant="ghost" asChild size="sm" className={styles.ctaButton}> */}
      <a href={href}>
        {cta}
        <span className={styles.ctaIcon}>•</span>
      </a>
      {/* </Button> */}
    </div>
    <div className={styles.hoverOverlay} />
  </div>
);

export { BentoCard, BentoGrid };
