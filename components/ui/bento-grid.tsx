import * as React from 'react'
import { ComponentPropsWithoutRef, ReactNode } from 'react';
import { ArrowRight } from "lucide-react";
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
      <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">
        {name}
      </h3>
      <p className={styles.description}>{description}</p>
    </div>

    <div className={styles.ctaContainer}>
      <Button variant="ghost" asChild size="sm" className="pointer-events-auto">
        <a href={href}>
          {cta}
          <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
        </a>
      </Button>
    </div>
    <div className={styles.hoverOverlay} />
  </div>
);

export { BentoCard, BentoGrid }; 