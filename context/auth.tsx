import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, setToken, removeToken } from '../services/storage';
import api from '../services/api';
import { Platform } from 'react-native';

export let globalLogout: (() => void) | null = null;

type AuthContextType = {
  user: any | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, confirmPass: string) => Promise<void>;
  logout: ( ) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await getToken();
        if (token) {
          try {
            // Simple JWT decode to check expiry
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            
            if (!payload.sub || (payload.exp && payload.exp * 1000 < Date.now())) {
              console.warn("Token expired or invalid on startup. Clearing.");
              await removeToken();
              setUser(null);
            } else {
              setUser({ email: payload.sub, displayName: payload.sub.split('@')[0] });
            }
          } catch (e) {
            console.error("Failed to decode token", e);
            await removeToken();
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error loading token", error);
      } finally {
        setLoading(false);
      }
    };
    loadToken();

    globalLogout = () => {
      removeToken().then(() => {
        setUser(null);
      });
    };
    return () => { globalLogout = null; };
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const response = await api.post('/auth/login', { email, password: pass });
      const { access_token } = response.data;
      await setToken(access_token);
      setUser({ email, displayName: email.split('@')[0] });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const register = async (name: string, email: string, pass: string, confirmPass: string) => {
    try {
      await api.post('/auth/register', { name, email, password: pass, confirm_password: confirmPass });
      await login(email, pass);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      setUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
