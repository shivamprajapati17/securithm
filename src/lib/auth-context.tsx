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

/** Decode a JWT locally for instant UI updates */
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
  } catch {
    // ignore parse errors
  }
  return null;
}

/** Save token to localStorage and set the auth header */
function persistToken(token: string) {
  localStorage.setItem("securithm_token", token);
  setAuthToken(token);
}

/** Clear token from localStorage and auth header */
function clearToken() {
  localStorage.removeItem("securithm_token");
  setAuthToken(null);
}

/** Get token from localStorage */
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("securithm_token");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Refresh user from stored token ──
  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Instant UI from JWT decode
    persistToken(token);
    const localUser = parseJwtLocally(token);
    if (localUser) {
      setUser(localUser);
    }

    // Try to get full profile from backend (non-blocking)
    try {
      const res = await fetch(`${getApiBase()}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        if (profile && profile.email) {
          setUser(profile);
        }
      }
    } catch {
      // Backend profile fetch failed - localUser from JWT is fine
    }

    setLoading(false);
  }, []);

  // ── Mount: check for tokens in URL or localStorage ──
  useEffect(() => {
    if (typeof window === "undefined") return;

    let foundToken: string | null = null;

    // 1. Check URL hash (#access_token=...)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashToken = hashParams.get("access_token");
      if (hashToken) {
        foundToken = hashToken;
        persistToken(hashToken);
        // Clean up hash from URL
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }

    // 2. Check query params (?token=...)
    const searchParams = new URLSearchParams(window.location.search);
    const queryToken = searchParams.get("token");
    if (queryToken) {
      foundToken = queryToken;
      persistToken(queryToken);
    }

    const activeToken = foundToken || getStoredToken();
    if (activeToken) {
      const localUser = parseJwtLocally(activeToken);
      if (localUser) setUser(localUser);

      // If on an auth page with a valid token, redirect to dashboard
      if (window.location.pathname.startsWith("/auth/")) {
        window.location.href = "/dashboard";
        return;
      }
    }

    refreshUser();
  }, [refreshUser]);

  // ── Supabase Auth State Listener (for Google OAuth only) ──
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        persistToken(session.access_token);
        const localUser = parseJwtLocally(session.access_token);
        if (localUser) setUser(localUser);

        // Redirect from auth pages to dashboard
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/auth/")) {
          window.location.href = "/dashboard";
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Email / Password Login (Native API ONLY) ──
  const login = useCallback(async (email: string, password: string) => {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(errBody.detail || `Login failed (${res.status})`);
    }

    const data = await res.json();
    if (!data.access_token) {
      throw new Error("No access token received from server");
    }

    persistToken(data.access_token);
    const localUser = parseJwtLocally(data.access_token);
    if (localUser) setUser(localUser);
  }, []);

  // ── Email / Password Register (Native API ONLY) ──
  const register = useCallback(
    async (email: string, password: string, display_name?: string, invite_id?: string) => {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, display_name, invite_id }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: "Registration failed" }));
        throw new Error(errBody.detail || `Registration failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.access_token) {
        throw new Error("No access token received from server");
      }

      persistToken(data.access_token);
      const localUser = parseJwtLocally(data.access_token);
      if (localUser) setUser(localUser);
    },
    []
  );

  // ── Google OAuth Login ──
  const loginWithGoogle = useCallback(async () => {
    const apiBase = getApiBase();

    // 1. Try native Google OAuth (our own credentials)
    try {
      const res = await fetch(`${apiBase}/api/v1/auth/login/google`);
      if (res.ok) {
        const data = await res.json();
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
          return;
        }
      }
    } catch {
      // Native Google OAuth not available, try Supabase
    }

    // 2. Fallback: Supabase OAuth
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      throw new Error(error.message || "Google login failed");
    }
    // Supabase will redirect to Google, then back to /auth/callback
  }, []);

  // ── Logout ──
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    // Also sign out from Supabase (fire and forget)
    supabase.auth.signOut().catch(() => {});
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
