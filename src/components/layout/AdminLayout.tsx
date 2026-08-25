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
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="flex-1 pb-24 lg:pb-0">
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
