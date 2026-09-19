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
  return localStorage.getItem("auditai_token");
}

function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("auditai_token", token);
  } else {
    localStorage.removeItem("auditai_token");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore token on mount
  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    api.setAuthToken(stored);

    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      // Retry once and always resolve the gate — a hung profile request
      // must never trap the user behind the AUTHENTICATING screen.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const userData = await Promise.race([
            api.getMe(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("profile timeout")), 8000)
            ),
          ]);
          if (!cancelled) setUser(userData);
          break;
        } catch {
          if (attempt === 0 && !cancelled) {
            await wait(1200);
            continue;
          }
          // Token invalid or unreachable — clear it and let the gate release
          if (!cancelled) {
            setStoredToken(null);
            setToken(null);
            api.setAuthToken(null);
          }
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
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
