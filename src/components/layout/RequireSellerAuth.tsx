import { Navigate, Outlet } from 'react-router-dom';

/**
 * Shared auth guard for every route inside AdminLayout. Replaces the
 * per-page `localStorage.getItem('sellerToken')` check that used to be
 * duplicated across all ten pages.
 */
const RequireSellerAuth = () => {
  const isLoggedIn = !!localStorage.getItem('sellerToken');
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default RequireSellerAuth;
