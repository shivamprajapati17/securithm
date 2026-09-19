"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuthToken, getApiBase } from "./api";
import { supabase } from "./supabase";

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

/** Fetch the user profile from the backend. */
async function fetchBackendProfile(accessToken: string): Promise<User | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function parseJwtLocally(token: string): User | null {
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      const userMeta = payload.user_metadata || {};
      return {
        id: payload.sub || "user_default",
        email: payload.email || userMeta.email || payload.sub || "user@securithm.dev",
        display_name:
          payload.name ||
          payload.display_name ||
          userMeta.full_name ||
          userMeta.name ||
          (payload.email ? payload.email.split("@")[0] : "Securithm User"),
        avatar_url:
          payload.picture ||
          payload.avatar_url ||
          userMeta.avatar_url ||
          userMeta.picture ||
          null,
        role: payload.role || "admin",
        org_name: "Securithm Security",
        org_id: "org_default",
      };
    }
  } catch {}
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("securithm_token") : null;
    if (token) {
      setAuthToken(token);
      const localUser = parseJwtLocally(token);
      if (localUser) {
        setUser(localUser);
      }
      const profile = await fetchBackendProfile(token);
      if (profile) {
        setUser(profile);
      } else if (!localUser) {
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
    if (typeof window !== "undefined") {
      let foundToken: string | null = null;

      // 1. Check URL hash (#access_token=...)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashToken = hashParams.get("access_token");
        if (hashToken) {
          foundToken = hashToken;
          localStorage.setItem("securithm_token", hashToken);
          setAuthToken(hashToken);
        }
      }

      // 2. Check query params (?token=...)
      const searchParams = new URLSearchParams(window.location.search);
      const queryToken = searchParams.get("token");
      if (queryToken) {
        foundToken = queryToken;
        localStorage.setItem("securithm_token", queryToken);
        setAuthToken(queryToken);
      }

      const activeToken = foundToken || localStorage.getItem("securithm_token");
      if (activeToken) {
        const localUser = parseJwtLocally(activeToken);
        if (localUser) setUser(localUser);
        const pathname = window.location.pathname;
        if (pathname.startsWith("/auth/")) {
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 200);
        }
      }
    }
    refreshUser();
  }, [refreshUser]);

  // ── Supabase Auth State Change Listener ──
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token) {
        localStorage.setItem("securithm_token", session.access_token);
        setAuthToken(session.access_token);
        const localUser = parseJwtLocally(session.access_token);
        if (localUser) setUser(localUser);
        await refreshUser();
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/auth/")) {
          window.location.href = "/dashboard";
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  // ── Email / Password Login ──
  const login = useCallback(async (email: string, password: string) => {
    // 1. Try Supabase Auth directly
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data?.session?.access_token) {
        localStorage.setItem("securithm_token", data.session.access_token);
        setAuthToken(data.session.access_token);
        const localUser = parseJwtLocally(data.session.access_token);
        if (localUser) setUser(localUser);
        await refreshUser();
        return;
      }
    } catch (sbErr) {
      console.warn("Supabase password sign in error, trying API route:", sbErr);
    }

    // 2. Fallback to API route
    const res = await fetch(`${getApiBase()}/api/v1/auth/login`, {
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
      const localUser = parseJwtLocally(data.access_token);
      if (localUser) setUser(localUser);
      await refreshUser();
    }
  }, [refreshUser]);

  // ── Email / Password Register ──
  const register = useCallback(
    async (email: string, password: string, display_name?: string, invite_id?: string) => {
      // 1. Try Supabase Auth Sign Up
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: display_name || email.split("@")[0],
              full_name: display_name || email.split("@")[0],
            },
          },
        });
        if (!error && data?.session?.access_token) {
          localStorage.setItem("securithm_token", data.session.access_token);
          setAuthToken(data.session.access_token);
          const localUser = parseJwtLocally(data.session.access_token);
          if (localUser) setUser(localUser);
          await refreshUser();
          return;
        }
      } catch (sbErr) {
        console.warn("Supabase sign up error, trying API route:", sbErr);
      }

      // 2. Fallback to API route
      const res = await fetch(`${getApiBase()}/api/v1/auth/register`, {
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
        const localUser = parseJwtLocally(data.access_token);
        if (localUser) setUser(localUser);
        await refreshUser();
      }
    },
    [refreshUser]
  );

  // ── Google OAuth Login ──
  const loginWithGoogle = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/auth/login/google`);
      if (res.ok) {
        const data = await res.json();
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
          return;
        }
      }
    } catch (e) {
      console.warn("Direct Google auth init failed, attempting fallback:", e);
    }

    // Fallback: Supabase Client OAuth
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      throw new Error(err.message || "Google login initiation failed");
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

