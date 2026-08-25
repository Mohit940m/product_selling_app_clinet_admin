import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import BrandMark from './BrandMark';
import SidebarNavLinks from './SidebarNavLinks';
import { useDialogBehavior } from '../ui/useDialogBehavior';

interface MobileTopBarProps {
  actionSlot?: ReactNode;
}

/** Mobile-only top bar with a hamburger that opens the sidebar nav as a left drawer. */
const MobileTopBar = ({ actionSlot }: MobileTopBarProps) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const containerRef = useDialogBehavior(open, close);

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-line bg-card px-5 py-3.5 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-[13px] border border-edge t-fast hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="flex flex-col gap-[3px]">
            <span className="h-[2px] w-4 bg-ink" />
            <span className="h-[2px] w-4 bg-ink" />
            <span className="h-[2px] w-4 bg-ink" />
          </span>
        </button>
        <BrandMark size={26} />
        <div className="ml-auto">{actionSlot}</div>
      </header>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex lg:hidden">
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={close} aria-hidden="true" />
            <div
              ref={containerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              className="relative z-10 flex h-full w-[280px] animate-up flex-col gap-1.5 bg-soft2 px-5 py-7"
            >
              <div className="mb-6 flex items-center justify-between">
                <BrandMark size={28} showSubLabel />
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="text-lg font-extrabold text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  ✕
                </button>
              </div>
              <SidebarNavLinks onNavigate={close} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default MobileTopBar;
