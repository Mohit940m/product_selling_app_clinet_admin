import type { ButtonHTMLAttributes } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** Admin's selected chip uses ink, not accent (Kartly Commerce Kit.dc.html line 774). */
const Chip = ({ selected = false, className = '', type = 'button', children, ...rest }: ChipProps) => {
  return (
    <button
      type={type}
      className={[
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[11px] font-bold t-fast',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-transparent bg-ink text-card'
          : 'border-line text-ink hover:border-accent hover:text-accent',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Chip;
