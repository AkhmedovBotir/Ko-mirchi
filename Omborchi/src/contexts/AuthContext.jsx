import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authData');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('authData');
        }
      }

      try {
        const profileResponse = await authAPI.getOmborchiProfile();
        const profile = profileResponse?.data ?? null;
        if (profile) {
          setUser({ ...profile, role: 'omborchi' });
          localStorage.setItem('authData', JSON.stringify({ ...profile, role: 'omborchi' }));
        }
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authData');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.loginOmborchi(username, password);
      const newToken = response?.token ?? response?.data?.token;

      if (!newToken) {
        return { success: false, error: 'Token olinmadi' };
      }

      localStorage.setItem('authToken', newToken);
      setToken(newToken);

      const profileResponse = await authAPI.getOmborchiProfile();
      const profile = profileResponse?.data ?? null;
      const normalizedProfile = profile ? { ...profile, role: 'omborchi' } : null;
      if (normalizedProfile) {
        localStorage.setItem('authData', JSON.stringify(normalizedProfile));
      } else {
        localStorage.removeItem('authData');
      }
      setUser(normalizedProfile);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authData');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



