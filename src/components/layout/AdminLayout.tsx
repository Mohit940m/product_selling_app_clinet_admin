import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileTopBar from './MobileTopBar';
import Footer from './Footer';

/**
 * The shared admin shell: persistent sidebar at `lg+`, a mobile top bar
 * with a drawer below it, routed page content, and a footer. `min-w-0` on
 * the content column is required — without it a flex child refuses to
 * shrink and any wide table forces page-level horizontal scroll.
 */
const AdminLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      {/* Visually hidden until focused — the first Tab stop on every page,
          so a keyboard/screen-reader user isn't forced through the full
          sidebar nav on every single navigation. WCAG 2.4.1. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-btn focus:bg-accent focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-onacc focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main id="main-content" className="flex-1 pb-24 lg:pb-0">
          <div key={pathname} className="animate-up">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AdminLayout;
