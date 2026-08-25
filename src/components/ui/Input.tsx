import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  valid?: boolean;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, valid, className = '', wrapperClassName = '', id, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={wrapperClassName}>
        {label && (
          <label htmlFor={inputId} className="mb-2.5 block text-[12px] font-extrabold text-ink">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          className={[
            'w-full rounded-btn border bg-transparent px-4 py-3.5 text-base font-medium text-ink t-fast sm:text-[12.5px]',
            'placeholder:text-muted placeholder:font-medium',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            error ? 'border-danger text-danger' : valid ? 'border-accent font-semibold' : 'border-line hover:border-accent focus:border-accent',
            className,
          ].join(' ')}
          {...rest}
        />
        {error && <p className="mt-1.5 text-[11px] font-bold text-danger">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
