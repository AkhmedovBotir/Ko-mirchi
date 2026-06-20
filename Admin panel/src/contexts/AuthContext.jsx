import { createContext, useContext, useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem('adminToken');
      const storedAdmin = localStorage.getItem('adminData');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);
      if (storedAdmin) {
        try {
          setAdmin(JSON.parse(storedAdmin));
        } catch {
          localStorage.removeItem('adminData');
        }
      }

      try {
        const me = await adminAPI.getMe();
        const profile = me?.data ?? null;
        if (profile) {
          setAdmin(profile);
          localStorage.setItem('adminData', JSON.stringify(profile));
        }
      } catch {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        setToken(null);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await adminAPI.login(username, password);
      const newToken = response?.token ?? response?.data?.token;

      if (!newToken) {
        return { success: false, error: 'Token olinmadi' };
      }

      localStorage.setItem('adminToken', newToken);
      setToken(newToken);

      const me = await adminAPI.getMe();
      const profile = me?.data ?? null;
      if (profile) {
        localStorage.setItem('adminData', JSON.stringify(profile));
      } else {
        localStorage.removeItem('adminData');
      }
      setAdmin(profile);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setToken(null);
    setAdmin(null);
  };

  const value = {
    admin,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



