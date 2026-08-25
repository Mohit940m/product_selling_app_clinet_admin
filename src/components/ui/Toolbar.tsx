import type { ReactNode } from 'react';

interface ToolbarProps {
  children: ReactNode;
  className?: string;
}

/** Generic page-header action row: content left, actions right, stacking below `sm`. */
const Toolbar = ({ children, className = '' }: ToolbarProps) => {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>{children}</div>
  );
};

export default Toolbar;
