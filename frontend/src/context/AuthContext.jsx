import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { getCsrfToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('health_user');
      if (!saved || saved === 'undefined' || saved === '[object Object]') return null;
      const parsed = JSON.parse(saved);
      return parsed?.data ? parsed.data : parsed;
    } catch (e) {
      localStorage.removeItem('health_user');
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const saved = localStorage.getItem('health_token');
      return (saved && saved !== 'undefined') ? saved : null;
    } catch (e) {
      localStorage.removeItem('health_token');
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Initialize CSRF and attempt session restore on mount.
  useEffect(() => {
    getCsrfToken();
    if (user?.userId) {
      authService.getProfile(user.userId)
        .then((profile) => {
          if (profile) {
            const actualProfile = profile?.data ? profile.data : profile;
            setUser(actualProfile);
            setToken(actualProfile.token);
          }
        })
        .catch(() => {
          // Backend session expired — clear stale local state
          setUser(null);
          setToken(null);
          localStorage.removeItem('health_user');
          localStorage.removeItem('health_token');
        });
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('health_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('health_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('health_token', token);
    } else {
      localStorage.removeItem('health_token');
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      const actualUser = data?.data ? data.data : data;
      setUser(actualUser);
      setToken(actualUser.token);
      return actualUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.register(userData);
      const actualUser = data?.data ? data.data : data;
      setUser(actualUser);
      setToken(actualUser.token);
      return actualUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore network errors during logout
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('health_user');
    localStorage.removeItem('health_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isDoctor: user?.role === 'DOCTOR',
        isPatient: user?.role === 'PATIENT',
        isLoggedIn: !!user
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
