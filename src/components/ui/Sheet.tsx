import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogBehavior } from './useDialogBehavior';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Extra classes on the sheet/drawer panel, e.g. to size the desktop drawer. */
  panelClassName?: string;
}

/**
 * One overlay component, two presentations by breakpoint: a bottom sheet
 * below `lg`, a right-side drawer at `lg+`. Traps focus, closes on Esc or
 * backdrop click, and locks body scroll while open. Used for mobile
 * filters, the offer target picker, and other overlay forms.
 */
const Sheet = ({ open, onClose, title, children, panelClassName = '' }: SheetProps) => {
  const containerRef = useDialogBehavior(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-end lg:items-stretch">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm t-fast" onClick={onClose} aria-hidden="true" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={[
          'relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-sheet bg-card p-6 animate-up',
          'lg:h-full lg:max-h-none lg:w-[400px] lg:rounded-none lg:border-l lg:border-line lg:bg-soft2 lg:p-8',
          panelClassName,
        ].join(' ')}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line lg:hidden" aria-hidden="true" />
        {title && (
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-lg font-extrabold text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default Sheet;
