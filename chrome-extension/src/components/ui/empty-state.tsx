
import React from 'react';

export const EmptyState = ({ title, description, action, renderIcon }: { title: string, description: string, action?: { label: string, onClick: () => void }, renderIcon?: () => React.ReactNode }) => (
  <div className="empty-state">
    {renderIcon && renderIcon()}
    <h3>{title}</h3>
    <p>{description}</p>
    {action && <button onClick={action.onClick}>{action.label}</button>}
  </div>
);
