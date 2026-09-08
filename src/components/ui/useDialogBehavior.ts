import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared behaviour for Sheet/Modal: locks body scroll, closes on Escape,
 * traps Tab focus within the dialog, and restores focus to the trigger
 * element on close. `open` gates all of it.
 */
export const useDialogBehavior = (open: boolean, onClose: () => void) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Keep the latest onClose in a ref rather than as a dependency of the
  // effect below. onClose is passed as a fresh inline arrow function at
  // nearly every real call site (`onClose={() => setX(null)}` —
  // DashboardPage.tsx's restock Modal, ProductDetailsPage.tsx's
  // manage/add-variant Modals, OffersPage.tsx's delete ConfirmDialog...),
  // and every one of those dialogs contains an input the user types into.
  // With onClose in the main effect's dependency array, every keystroke
  // (which re-renders the parent and creates a new onClose reference)
  // tore the whole effect down and set it back up again — the cleanup's
  // triggerRef.current.focus() yanked focus to the button that opened the
  // dialog, then the setup's focusable[0].focus() moved it again to
  // whatever's first inside the dialog, stealing keyboard focus out of
  // the field being typed into after every single character. This ref
  // sidesteps that: the main effect now only reruns when `open` itself
  // actually changes.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const container = containerRef.current;
    const focusable = container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !container) return;

      const items = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus?.();
    };
  }, [open]);

  return containerRef;
};
