import axios from 'axios';
import { getToken, removeToken } from './storage';

const API_URL = 'https://agritwin-ai-1-x2if.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error('Backend server is unreachable. Please check your internet connection.')
      );
    }

    if (error.response.status === 401) {
      await removeToken();

      try {
        const { globalLogout } = await import('../context/auth');

        if (globalLogout) {
          globalLogout();
          alert('Session expired. Please login again.');
        }
      } catch (logoutError) {
        console.error('[API] Logout error:', logoutError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
