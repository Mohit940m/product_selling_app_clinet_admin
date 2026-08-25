import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import BrandMark from './BrandMark';
import SidebarNavLinks from './SidebarNavLinks';
import Switch from '../ui/Switch';
import { useTheme } from '../../theme/useTheme';

type SellerProfile = { name?: string; storeName?: string; email?: string };

const readSellerProfile = (): SellerProfile | null => {
  try {
    const raw = localStorage.getItem('sellerProfile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Desktop sidebar shell (Kartly Commerce Kit.dc.html admin panel,
 * lines 710-725). Persistent at `lg+`; MobileTopBar renders the same nav
 * items inside a drawer below `lg`.
 */
const Sidebar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const profile = readSellerProfile();

  const logout = () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerProfile');
    navigate('/login');
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col gap-1.5 border-r border-line bg-soft2 px-5 py-7 lg:flex">
      <div className="mb-6">
        <BrandMark size={28} showSubLabel />
      </div>

      <SidebarNavLinks />

      <div className="mt-auto flex items-center justify-between rounded-tile border border-line bg-card p-3.5">
        <span className="text-[12.5px] font-bold text-ink">Dark mode</span>
        <Switch checked={theme === 'dark'} onChange={toggleTheme} label="Dark mode" />
      </div>

      <div className="mt-2.5 rounded-tile bg-card border border-line p-3.5">
        <p className="truncate text-[12.5px] font-extrabold text-ink">{profile?.name || profile?.storeName || 'Seller account'}</p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-muted">{profile?.email ?? 'Signed in'}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-btn border border-line py-2 text-xs font-bold text-ink t-fast hover:border-accent hover:text-accent"
        >
          <FiLogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
