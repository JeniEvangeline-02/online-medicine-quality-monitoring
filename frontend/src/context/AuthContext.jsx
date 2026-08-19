import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiPost, apiGet } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem('access_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async (token) => {
    if (!token) { setLoading(false); return; }
    try {
      const user = await apiGet('/auth/me', token);
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch {
      // Token invalid or expired — clear state
      sessionStorage.removeItem('access_token');
      setAccessToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser(accessToken);
  }, [accessToken, loadCurrentUser]);

  const login = async (email, password) => {
    const data = await apiPost('/auth/login', { email, password });
    sessionStorage.setItem('access_token', data.access_token);
    setAccessToken(data.access_token);
    setCurrentUser(data.user);
    setIsAuthenticated(true);
    return data.user;
  };

  const register = async (payload) => {
    return await apiPost('/auth/register', payload);
  };

  const logout = async () => {
    try {
      if (accessToken) await apiPost('/auth/logout', {}, accessToken);
    } catch { /* best-effort */ }
    sessionStorage.removeItem('access_token');
    setAccessToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    if (accessToken) await loadCurrentUser(accessToken);
  };

  const hasRole = (allowedRoles) => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{
      currentUser, accessToken, token: accessToken, isAuthenticated, loading,
      login, logout, register, refreshUser, hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
