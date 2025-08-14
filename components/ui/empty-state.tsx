import type { ReactNode } from 'react';
import { Button } from './button';

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
  return (
    <div className={`flex flex-col items-center justify-center h-full text-center p-8 ${className}`}>
      <div className="bg-white/10 rounded-full p-3 mb-4">
        {renderIcon ? renderIcon() : icon}
      </div>
      <h3 className="font-semibold text-lg text-white">{title}</h3>
      <p className="text-sm text-white/40 mt-1">{description}</p>
      
      {action && (
        <Button 
          variant="outline" 
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
} 