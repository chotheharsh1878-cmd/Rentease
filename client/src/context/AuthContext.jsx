import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, favoriteApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rentease_token') || null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);

  // Load user profile on mount if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('rentease_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.data.user);
          loadFavoriteIds();
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    const handleAuthLogout = () => {
      setUser(null);
      setToken(null);
      setFavoriteIds([]);
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  const loadFavoriteIds = async () => {
    try {
      const res = await favoriteApi.getFavoriteIds();
      setFavoriteIds(res.data.ids || []);
    } catch (err) {
      // Ignored if unauthenticated
    }
  };

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('rentease_token', receivedToken);
    localStorage.setItem('rentease_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    await loadFavoriteIds();
    return receivedUser;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('rentease_token', receivedToken);
    localStorage.setItem('rentease_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('rentease_token');
    localStorage.removeItem('rentease_user');
    setUser(null);
    setToken(null);
    setFavoriteIds([]);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('rentease_user', JSON.stringify(updatedUser));
  };

  const toggleFavorite = async (propertyId) => {
    if (!user) {
      return { success: false, requireAuth: true };
    }
    const isFav = favoriteIds.includes(propertyId);
    try {
      if (isFav) {
        await favoriteApi.removeFavorite(propertyId);
        setFavoriteIds(prev => prev.filter(id => id !== propertyId));
      } else {
        await favoriteApi.addFavorite(propertyId);
        setFavoriteIds(prev => [...prev, propertyId]);
      }
      return { success: true, isFavorited: !isFav };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Demo accounts for instant 1-click evaluation
  const demoAccounts = {
    'tenant-student': { email: 'rahul.student@rentease.com', password: 'password123' },
    'tenant-family': { email: 'priya.family@rentease.com', password: 'password123' },
    'owner': { email: 'amit.owner@rentease.com', password: 'password123' },
    'admin': { email: 'admin@rentease.com', password: 'admin123' }
  };

  const demoLogin = async (roleKey) => {
    const creds = demoAccounts[roleKey];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isOwner: user?.role === 'owner',
    isTenant: user?.role === 'tenant',
    isStudent: user?.tenant_type === 'student',
    favoriteIds,
    favoritesCount: favoriteIds.length,
    login,
    register,
    logout,
    updateUser,
    toggleFavorite,
    demoLogin,
    refreshFavorites: loadFavoriteIds
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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

