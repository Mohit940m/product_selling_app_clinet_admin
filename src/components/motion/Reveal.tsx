import type { ElementType, ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Applies the prototype's `animate-up` entrance with a staggered delay.
 * Pass `delay` in ms — grids reveal at index * 40ms, capped at 400ms.
 */
const Reveal = ({ children, delay = 0, as: Tag = 'div', className = '' }: RevealProps) => {
  return (
    <Tag className={`animate-up ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
};

export default Reveal;
