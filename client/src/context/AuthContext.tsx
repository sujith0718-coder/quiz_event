import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken, removeAuthToken, getAuthToken } from '../api/client.js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PARTICIPANT';
  teamId?: any;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await apiRequest('/auth/me');
      if (data?.user) {
        setUser({
          id: data.user._id || data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          teamId: data.user.teamId,
        });
      }
    } catch (err) {
      console.warn('Session verification failed, logging out');
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    setUser({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      teamId: data.user.teamId,
    });
  };

  const register = async (name: string, email: string, password: string, role: string = 'PARTICIPANT') => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    setAuthToken(data.token);
    setUser({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      teamId: data.user.teamId,
    });
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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
