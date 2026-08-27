import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL ?? 'https://product-selling-app-server.onrender.com';

const sellerApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/seller`,
  // No timeout was set before this — axios defaults to none, so a
  // dropped connection (not a 4xx/5xx, just no response ever arriving)
  // left a page's isLoading spinner stuck forever. 45s is generous
  // enough to not interrupt the production backend's real cold-start
  // delay (Render's free tier sleeps the service after inactivity) while
  // still eventually giving up on a genuinely dead connection. The
  // actual Cloudinary file upload in cloudinaryApi.ts is a separate,
  // untouched axios.post call straight to Cloudinary's API — this
  // timeout only covers requests through this instance, not that upload.
  timeout: 45000,
});

sellerApi.interceptors.request.use((config) => {
  // localStorage can throw (privacy mode with storage blocked, some
  // corporate browser policies) — if it does, every request should still
  // go out unauthenticated rather than fail outright before it's sent.
  let token: string | null = null;
  try {
    token = localStorage.getItem('sellerToken');
  } catch {
    // Fall through with no token.
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// No global 401 handling existed before this — an expired/invalid token
// just meant every page's own fetch failed with a generic "unable to
// load" toast, with no path back to a working state except manually
// navigating to /login. Only act when a token is actually stored (a 401
// with no stored token would be unexpected here — every admin route
// already sits behind RequireSellerAuth) and we're not already on the
// login/signup screen, so this can't create a redirect loop or clobber
// a real invalid-OTP error on those pages.
sellerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      let hadToken = false;
      try {
        hadToken = !!localStorage.getItem('sellerToken');
        if (hadToken) localStorage.removeItem('sellerToken');
      } catch {
        // If storage itself is the problem, there's nothing more to clean up.
      }

      const onAuthPage = window.location.pathname === '/login' || window.location.pathname === '/signup';
      if (hadToken && !onAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default sellerApi;
