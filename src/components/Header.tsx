import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiShoppingBag } from 'react-icons/fi';

const Header = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerProfile');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-text">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <FiShoppingBag size={22} />
          </span>
          <span className="text-lg font-bold">Seller Admin</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-600">
          <Link className="rounded-lg px-3 py-2 hover:bg-secondary hover:text-accent" to="/dashboard">Dashboard</Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-secondary hover:text-accent" to="/products">Products</Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-secondary hover:text-accent" to="/orders">Orders</Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-secondary hover:text-accent" to="/shipping">Shipping</Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-secondary hover:text-accent" to="/offers">Offers</Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-text hover:border-primary hover:text-accent"
          >
            <FiLogOut size={18} />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
