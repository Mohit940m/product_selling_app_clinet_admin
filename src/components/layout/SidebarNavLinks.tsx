import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

interface SidebarNavLinksProps {
  onNavigate?: () => void;
}

/** The nav item list shared by the desktop Sidebar and the mobile drawer. */
const SidebarNavLinks = ({ onNavigate }: SidebarNavLinksProps) => {
  return (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-1.5">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'rounded-[13px] px-3.5 py-3 text-[13px] t-fast',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              isActive ? 'bg-ink font-extrabold text-card' : 'slide-x font-semibold text-muted hover:bg-card hover:text-ink',
            ].join(' ')
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default SidebarNavLinks;
