import type { ReactNode } from 'react';

interface MobileActionBarProps {
  children: ReactNode;
}

/** Fixed bottom bar for a page's primary CTA on mobile (e.g. Publish, Save changes). */
const MobileActionBar = ({ children }: MobileActionBarProps) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-line bg-card px-5 py-3.5 pb-[calc(env(safe-area-inset-bottom)+14px)] lg:hidden">
      {children}
    </div>
  );
};

export default MobileActionBar;
