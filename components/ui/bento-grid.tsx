import * as React from 'react'
import { ComponentPropsWithoutRef, ReactNode } from 'react';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import styles from './bento-grid.module.css'

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const BentoGrid = React.forwardRef<
  HTMLDivElement,
  BentoGridProps
>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(styles.grid, className)}
    {...props}
  >
    {children}
  </div>
));
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
  <div
    key={name}
    className={cn(styles.card, className)}
  >
    <div>{background}</div>
    <div className={styles.cardContent}>
      <Icon className={styles.icon} />
      <h3 className={styles.heading}>
        {name}
      </h3>
      <p className={styles.description}>{description}</p>
    </div>

    <div className={styles.ctaContainer}>
      <Button variant="ghost" asChild size="sm" className={styles.ctaButton}>
        <a href={href}>
          {cta}
          <ArrowRight className={styles.ctaIcon} />
        </a>
      </Button>
    </div>
    <div className={styles.hoverOverlay} />
  </div>
);

export { BentoCard, BentoGrid };
