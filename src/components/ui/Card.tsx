import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type CardOwnProps<T extends ElementType> = {
  as?: T;
  interactive?: boolean;
  padded?: boolean;
  children: ReactNode;
  className?: string;
};

type CardProps<T extends ElementType> = CardOwnProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps<T>>;

const Card = <T extends ElementType = 'div'>({
  as,
  interactive = true,
  padded = false,
  className = '',
  children,
  ...rest
}: CardProps<T>) => {
  const Tag = (as ?? 'div') as ElementType;

  return (
    <Tag
      className={[
        'rounded-card border border-line bg-card overflow-hidden t-card',
        interactive ? 'lift-card hover:border-accent hover:shadow-lift-accent' : '',
        padded ? 'p-4' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Card;
