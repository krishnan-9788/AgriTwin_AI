import axios from 'axios';
import { getToken } from './storage';
import { Platform } from 'react-native';

// Use 127.0.0.1 for Web/iOS to avoid IPv6 localhost issues, 10.0.2.2 for Android emulator
const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';


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
      console.error("[API] Network error or Backend is unreachable.");
      return Promise.reject(new Error("Backend server is not running. Please check if FastAPI is running on port 8000."));
    }
    
    if (error.response && error.response.status === 401) {
      console.warn("[API] 401 Unauthorized received. Clearing token.");
      await import('./storage').then(m => m.removeToken());
      
      // Trigger global logout in React context
      await import('../context/auth').then(({ globalLogout }) => {
        if (globalLogout) {
          globalLogout();
          alert("Session expired. Please login again.");
        }
      });
    }
    return Promise.reject(error);
  }
);

export default api;
