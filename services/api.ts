import axios from 'axios';
import { getToken, removeToken } from './storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

let API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://agritwin-ai-1-3qqo.onrender.com';

if (__DEV__ && !process.env.EXPO_PUBLIC_API_URL) {
  if (Platform.OS === 'web') {
    API_URL = 'http://127.0.0.1:8000';
  } else {
    const hostUri = Constants?.expoConfig?.hostUri;
    if (hostUri) {
      const lanIp = hostUri.split(':')[0];
      API_URL = `http://${lanIp}:8000`;
    } else {
      API_URL = 'http://127.0.0.1:8000';
    }
}
}

console.log('[API Config] Resolved API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
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
        }
      } catch (logoutError) {
        console.error('[API] Logout error:', logoutError);
      }
    }
    
    // Format backend errors nicely instead of "Request failed with status code 500"
    const status = error.response.status;
    const data = error.response.data;
    let errorMessage = data?.detail || data?.message || error.message;
    
    if (status === 404) errorMessage = 'Market API route not found (404)';
    else if (status === 422) errorMessage = `Invalid market parameters (422): ${JSON.stringify(data?.detail)}`;
    else if (status === 500) errorMessage = `Market backend error (500): ${errorMessage}`;
    else if (status === 400) errorMessage = `Bad Request (400): ${errorMessage}`;

    const newError = new Error(errorMessage);
    (newError as any).response = error.response;
    return Promise.reject(newError);
  }
);

export default api;

