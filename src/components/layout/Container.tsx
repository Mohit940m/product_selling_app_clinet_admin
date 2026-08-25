import type { ElementType, ReactNode } from 'react';

type ContainerProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
};

/** The single page-width container used across the app. */
const Container = ({ children, as: Tag = 'div', className = '' }: ContainerProps) => {
  return <Tag className={`mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-9 ${className}`}>{children}</Tag>;
};

export default Container;
