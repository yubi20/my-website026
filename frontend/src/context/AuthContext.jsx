import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMyProfile, loginUser, registerUser, updateUserAvatar } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('banana_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('banana_token');
      if (storedToken) {
        try {
          const res = await getMyProfile();
          if (res.data?.success) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session expired or server unavailable');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth_expired', handleAuthExpired);
    return () => window.removeEventListener('auth_expired', handleAuthExpired);
  }, []);

  const login = async (identifier, password) => {
    const res = await loginUser({ identifier, password });
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('banana_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (username, email, password) => {
    const res = await registerUser({ username, email, password });
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('banana_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('banana_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await getMyProfile();
      if (res.data?.success) {
        setUser(res.data.user);
      }
    } catch (e) {
      console.warn('Failed to refresh user');
    }
  };

  const updateStats = (newStats) => {
    setUser((prev) => (prev ? { ...prev, ...newStats } : null));
  };

  const setAvatar = async (avatarKey) => {
    const res = await updateUserAvatar(avatarKey);
    if (res.data?.success) {
      setUser((prev) => (prev ? { ...prev, avatar: avatarKey } : null));
    }
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
        updateStats,
        setAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
