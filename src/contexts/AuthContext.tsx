import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  userName: string | null;
  userPicture: string | null;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userEmail: null,
  userName: null,
  userPicture: null,
  loginWithGoogle: async () => ({ success: false }),
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPicture, setUserPicture] = useState<string | null>(null);

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
          return;
        }
      }
    } catch {}
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserName(null);
    setUserPicture(null);
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
        setIsAuthenticated(true);
        setUserEmail(data.email);
        setUserName(data.name || null);
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
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userEmail, userName, userPicture, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
