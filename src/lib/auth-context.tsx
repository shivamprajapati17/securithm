"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

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
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, display_name?: string, invite_id?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:8000";


/** Fetch the user profile from the backend (auto-creates user if needed). */
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for Supabase auth state changes (handles initial session + login/logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (newSession?.access_token) {
          // Fetch the backend user profile (auto-creates on first login)
          const profile = await fetchBackendProfile(newSession.access_token);
          setUser(profile);
        } else {
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Email / Password Login ──
  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  // ── Email / Password Register ──
  const register = useCallback(
    async (email: string, password: string, display_name?: string, _invite_id?: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: display_name || email.split("@")[0] },
        },
      });
      if (error) throw new Error(error.message);
    },
    []
  );

  // ── Google OAuth ──
  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new Error(error.message);
  }, []);

  // ── GitHub OAuth ──
  const loginWithGithub = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new Error(error.message);
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        register,
        loginWithGoogle,
        loginWithGithub,
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
