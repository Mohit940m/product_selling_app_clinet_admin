import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL ?? 'https://product-selling-app-server.onrender.com';

const sellerApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/seller`,
  headers: {
    'Content-Type': 'application/json',
  },
});

sellerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('sellerToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default sellerApi;
