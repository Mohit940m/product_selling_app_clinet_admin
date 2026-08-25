import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const EmptyState = ({ icon, title, description, action, className = '' }: EmptyStateProps) => {
  return (
    <div className={`rounded-card border border-dashed border-edge p-12 text-center ${className}`}>
      {icon && <div className="mx-auto mb-3 text-accent">{icon}</div>}
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
