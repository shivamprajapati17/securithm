"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuthToken } from "./api";

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
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, display_name?: string, invite_id?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:8000";

/** Fetch the user profile from the backend. */
async function fetchBackendProfile(accessToken: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("securithm_token") : null;
    if (token) {
      setAuthToken(token);
      const profile = await fetchBackendProfile(token);
      if (profile) {
        setUser(profile);
      } else {
        localStorage.removeItem("securithm_token");
        setAuthToken(null);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── Email / Password Login ──
  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("securithm_token", data.access_token);
      setAuthToken(data.access_token);
      await refreshUser();
    }
  }, [refreshUser]);

  // ── Email / Password Register ──
  const register = useCallback(
    async (email: string, password: string, display_name?: string, invite_id?: string) => {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, display_name, invite_id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Registration failed" }));
        throw new Error(err.detail || "Registration failed");
      }
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("securithm_token", data.access_token);
        setAuthToken(data.access_token);
        await refreshUser();
      }
    },
    [refreshUser]
  );

  // ── Google OAuth Login ──
  const loginWithGoogle = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login/google`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Google login initiation failed" }));
      throw new Error(err.detail || "Google login initiation failed");
    }
    const data = await res.json();
    if (data.authorization_url) {
      window.location.href = data.authorization_url;
    }
  }, []);

  // ── Logout ──
  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("securithm_token");
    }
    setAuthToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
        refreshUser,
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

