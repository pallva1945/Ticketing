import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  userName: string | null;
  userPicture: string | null;
  isAdmin: boolean;
  role: string;
  accessLevel: string;
  permissions: string[];
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; message?: string }>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userEmail: null,
  userName: null,
  userPicture: null,
  isAdmin: false,
  role: 'user',
  accessLevel: 'full',
  permissions: [],
  loginWithGoogle: async () => ({ success: false }),
  loginWithPassword: async () => ({ success: false }),
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPicture, setUserPicture] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState('user');
  const [accessLevel, setAccessLevel] = useState('full');
  const [permissions, setPermissions] = useState<string[]>([]);

  const verify = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/verify', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsAuthenticated(true);
          setUserEmail(data.email);
          setUserName(data.name || null);
          setUserPicture(data.picture || null);
          setIsAdmin(data.isAdmin || false);
          setRole(data.role || 'user');
          setAccessLevel(data.accessLevel || 'full');
          setPermissions(data.permissions || []);
          return;
        }
      }
    } catch {}
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserName(null);
    setUserPicture(null);
    setIsAdmin(false);
    setRole('user');
    setAccessLevel('full');
    setPermissions([]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    verify().finally(() => setIsLoading(false));
  }, [verify]);

  const loginWithGoogle = async (credential: string) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (data.success) {
        await verify();
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const loginWithPassword = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        await verify();
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserName(null);
    setUserPicture(null);
    setIsAdmin(false);
    setRole('user');
    setAccessLevel('full');
    setPermissions([]);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userEmail, userName, userPicture, isAdmin, role, accessLevel, permissions, loginWithGoogle, loginWithPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
