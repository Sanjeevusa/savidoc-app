import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { User, AuthState } from '../types';
import { authApi } from '../api/client';

// =============================================================================
// Context Type
// =============================================================================

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ userId: string; phone: string }>;
  verifyOTP: (userId: string, otp: string, purpose: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ userId: string; phone: string; assignedRole: string }>;
  logout: () => Promise<void>;
  resendOTP: (userId: string, purpose: string) => Promise<void>;
}

interface RegisterData {
  title?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  roleTitle: string;
  departmentId?: string;
  allowedDomains?: string[];
  industry?: string;
  industryType?: string;
}

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode<User & { exp: number; userId?: string }>(token);
        if (decoded.exp * 1000 > Date.now()) {
          const normalizedUser = { ...decoded, id: decoded.userId || decoded.id };
          setState({
            user: normalizedUser,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      } catch {
        localStorage.removeItem('accessToken');
      }
    }
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    return res.data.data as { userId: string; phone: string };
  }, []);

  const verifyOTP = useCallback(async (userId: string, otp: string, purpose: string) => {
    const res = await authApi.verifyOTP(userId, otp, purpose);
    const { accessToken, user } = res.data.data;
    // JWT returns userId, map to id for consistency
    const normalizedUser = { ...user, id: user.userId || user.id };
    localStorage.setItem('accessToken', accessToken);
    setState({
      user: normalizedUser,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await authApi.register(data);
    return res.data.data as { userId: string; phone: string; assignedRole: string };
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const resendOTP = useCallback(async (userId: string, purpose: string) => {
    await authApi.resendOTP(userId, purpose);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, verifyOTP, register, logout, resendOTP }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
