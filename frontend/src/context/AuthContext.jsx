import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('localfix_token'));
  const [loading, setLoading] = useState(true);

  // Fetch current user details on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('localfix_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Session expired or invalid token:", err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token } = res.data;
    localStorage.setItem('localfix_token', access_token);
    setToken(access_token);

    // Fetch full user profile
    const meRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    setUser(meRes.data);
    return meRes.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { access_token } = res.data;
    localStorage.setItem('localfix_token', access_token);
    setToken(access_token);

    const meRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    setUser(meRes.data);
    return meRes.data;
  };

  const registerProvider = async (formData) => {
    const res = await api.post('/auth/register-provider', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const { access_token } = res.data;
    localStorage.setItem('localfix_token', access_token);
    setToken(access_token);

    const meRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    setUser(meRes.data);
    return meRes.data;
  };

  const logout = () => {
    localStorage.removeItem('localfix_token');
    localStorage.removeItem('localfix_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        registerProvider,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
