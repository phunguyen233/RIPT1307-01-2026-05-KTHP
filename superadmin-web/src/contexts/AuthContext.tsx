import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginRequest, LoginPayload } from '../api/authAPI';

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  shop_id: number | null;
  created_at: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem('superadmin_token');
    const storedUser = window.localStorage.getItem('superadmin_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    const data = await loginRequest(payload);
    if (data.user.role !== 'superadmin') {
      throw new Error('Chỉ tài khoản superadmin mới được phép đăng nhập');
    }
    setToken(data.token);
    setUser(data.user);
    window.localStorage.setItem('superadmin_token', data.token);
    window.localStorage.setItem('superadmin_user', JSON.stringify(data.user));
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem('superadmin_token');
    window.localStorage.removeItem('superadmin_user');
  };

  const value = useMemo(
    () => ({ user, token, login, logout, loading }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
