import type { HTMLAttributes } from 'react';

export type BadgeTone = 'success' | 'warn' | 'danger' | 'plum' | 'ink';

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-ok-bg text-ok-fg',
  warn: 'bg-warn-bg text-warn-fg',
  danger: 'bg-bad-bg text-bad-fg',
  plum: 'bg-soft text-plum',
  ink: 'bg-ink text-card',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const Badge = ({ tone = 'plum', className = '', children, ...rest }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-[10.5px] font-extrabold ${TONE_CLASSES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
};

export default Badge;
