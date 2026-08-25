import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'dark' | 'outline' | 'soft' | 'ghost' | 'pill' | 'icon' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  /** @deprecated pass children instead — kept so pages can migrate off Button one at a time. */
  label?: string;
}

type ButtonProps = ButtonOwnProps & ButtonHTMLAttributes<HTMLButtonElement>;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-onacc font-extrabold lift hover:shadow-lift-accent-cta',
  dark: 'bg-ink text-card font-extrabold lift hover:shadow-lift-ink',
  outline: 'border border-edge text-ink bg-transparent font-extrabold hover:bg-ink hover:text-card',
  soft: 'bg-soft text-[var(--k-on-soft)] font-extrabold lift',
  ghost: 'text-accent bg-transparent font-extrabold hover:bg-soft2',
  pill: 'rounded-full bg-accent text-onacc font-extrabold hover:tracking-[.04em]',
  icon: 'w-12 h-12 !p-0 rounded-full bg-ink text-card grid place-items-center pop-icon',
  danger: 'bg-bad-bg text-bad-fg font-extrabold border border-transparent hover:border-danger',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4.5 py-3 text-[12.5px]',
  md: 'px-6 py-4 text-sm',
  lg: 'px-7 py-[17px] text-base',
};

const Dots = () => (
  <span className="flex items-center gap-1.5" role="status" aria-label="Loading">
    <span className="h-1.5 w-1.5 animate-dot rounded-full bg-current" />
    <span className="h-1.5 w-1.5 animate-dot rounded-full bg-current" style={{ animationDelay: '.2s' }} />
    <span className="h-1.5 w-1.5 animate-dot rounded-full bg-current" style={{ animationDelay: '.4s' }} />
  </span>
);

const Button = ({
  variant = 'primary',
  size = 'sm',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  label,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) => {
  const isIconOnly = variant === 'icon';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-btn t-base',
        'disabled:cursor-not-allowed disabled:bg-line disabled:text-muted disabled:shadow-none disabled:transform-none disabled:hover:transform-none',
        'active:translate-y-0 active:shadow-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        VARIANT_CLASSES[variant],
        isIconOnly ? '' : SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Dots />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children ?? label}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
};

export default Button;
