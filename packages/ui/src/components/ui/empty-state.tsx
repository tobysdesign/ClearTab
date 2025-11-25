import type { ReactNode } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import styles from './empty-state.module.css';

 interface EmptyStateProps {
  renderIcon?: () => ReactNode;
  icon?: string | ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ renderIcon, icon, title, description, action, className = '' }: EmptyStateProps) {
  const hasIcon = renderIcon || icon;

  return (
    <div className={cn(styles.container, className)}>
      {hasIcon && (
        <div className={styles.iconContainer}>
          {renderIcon ? renderIcon() : icon}
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>

      {action && (
        <Button
          variant="outline"
          onClick={action.onClick}
          className={styles.actionButton}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
} 