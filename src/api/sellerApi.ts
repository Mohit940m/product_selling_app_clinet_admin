import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL ?? 'https://product-selling-app-server.onrender.com';

const sellerApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/seller`,
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

export default sellerApi;
