import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', wrapperClassName = '', id, ...rest }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <div className={wrapperClassName}>
        {label && (
          <label htmlFor={textareaId} className="mb-2.5 block text-[12px] font-extrabold text-ink">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          aria-invalid={!!error}
          className={[
            'w-full rounded-btn border bg-transparent px-4 py-3.5 text-base font-medium text-ink t-fast sm:text-[12.5px]',
            'placeholder:text-muted placeholder:font-medium',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            error ? 'border-danger text-danger' : 'border-line hover:border-accent focus:border-accent',
            className,
          ].join(' ')}
          {...rest}
        />
        {error && <p className="mt-1.5 text-[11px] font-bold text-danger">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
