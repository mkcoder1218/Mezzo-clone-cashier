import axios from 'axios';

export const api = axios.create({
  // Backend base URL. Prefer VITE_API_URL, fall back to local backend default port.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3006/api',
});

// Automatically add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cashierToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
