import type { ElementType, HTMLAttributes, ReactNode } from 'react';

interface PanelProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
}

/** The admin's workhorse container: revenue chart, forms, low stock, shipping rates. */
const Panel = ({ as: Tag = 'section', className = '', children, ...rest }: PanelProps) => {
  return (
    <Tag className={`rounded-panel border border-line bg-card p-6 ${className}`} {...rest}>
      {children}
    </Tag>
  );
};

export default Panel;
