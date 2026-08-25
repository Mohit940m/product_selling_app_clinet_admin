import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', wrapperClassName = '', id, children, ...rest }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className={wrapperClassName}>
        {label && (
          <label htmlFor={selectId} className="mb-2.5 block text-[12px] font-extrabold text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={!!error}
            className={[
              'w-full appearance-none rounded-btn border bg-transparent px-4 py-3.5 text-base font-medium text-ink t-fast sm:text-[12.5px]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              error ? 'border-danger text-danger' : 'border-line hover:border-accent focus:border-accent',
              className,
            ].join(' ')}
            {...rest}
          >
            {children}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">▾</span>
        </div>
        {error && <p className="mt-1.5 text-[11px] font-bold text-danger">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;
