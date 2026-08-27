import { Navigate, Outlet } from 'react-router-dom';

/**
 * Shared auth guard for every route inside AdminLayout. Replaces the
 * per-page `localStorage.getItem('sellerToken')` check that used to be
 * duplicated across all ten pages.
 */
const RequireSellerAuth = () => {
  // localStorage can throw (privacy mode with storage blocked, some
  // corporate browser policies) — treat that the same as "not logged in"
  // and redirect, rather than letting it fall through to the generic
  // ErrorBoundary fallback for what's really just a login-required case.
  let isLoggedIn = false;
  try {
    isLoggedIn = !!localStorage.getItem('sellerToken');
  } catch {
    // Fall through with isLoggedIn left false.
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default RequireSellerAuth;
