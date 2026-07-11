"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import * as api from "./api";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role?: string | null;
  org_name?: string | null;
  org_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, display_name?: string, invite_id?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("securithm_token");
}

function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("securithm_token", token);
  } else {
    localStorage.removeItem("securithm_token");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore token on mount
  useEffect(() => {
    const stored = getStoredToken();
    if (stored) {
      setToken(stored);
      api.setAuthToken(stored);
      // Fetch user profile
      api.getMe()
        .then((userData) => setUser(userData))
        .catch(() => {
          // Token invalid, clear it
          setStoredToken(null);
          setToken(null);
          api.setAuthToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    setStoredToken(result.access_token);
    setToken(result.access_token);
    api.setAuthToken(result.access_token);
    const userData = await api.getMe();
    setUser(userData);
  }, []);

  const register = useCallback(async (email: string, password: string, display_name?: string, invite_id?: string) => {
    const result = await api.register(email, password, display_name, invite_id);
    setStoredToken(result.access_token);
    setToken(result.access_token);
    api.setAuthToken(result.access_token);
    const userData = await api.getMe();
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    api.setAuthToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
