import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogBehavior } from './useDialogBehavior';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  panelClassName?: string;
}

const Modal = ({ open, onClose, title, children, panelClassName = '' }: ModalProps) => {
  const containerRef = useDialogBehavior(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm t-fast" onClick={onClose} aria-hidden="true" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-hero bg-card p-6 shadow-kartly animate-up ${panelClassName}`}
      >
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

export default Modal;
