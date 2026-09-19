"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    let handled = false;

    const navigateToDashboard = async (token: string) => {
      if (handled) return;
      handled = true;
      localStorage.setItem("securithm_token", token);
      setAuthToken(token);
      await refreshUser();
      window.location.href = "/dashboard";
    };

    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam) {
      setError(decodeURIComponent(errorDescription || errorParam));
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2500);
      return;
    }

    // 1. Check for token in search params
    const token = searchParams.get("token");
    if (token) {
      navigateToDashboard(token);
      return;
    }

    // 2. Check for hash parameters (#access_token=...)
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashToken = hashParams.get("access_token");
      if (hashToken) {
        navigateToDashboard(hashToken);
        return;
      }
    }

    // 3. Check for existing token in localStorage
    const existing = typeof window !== "undefined" ? localStorage.getItem("securithm_token") : null;
    if (existing) {
      navigateToDashboard(existing);
      return;
    }

    // 4. Supabase onAuthStateChange listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        navigateToDashboard(session.access_token);
      }
    });

    // 5. Supabase getSession
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        navigateToDashboard(session.access_token);
      }
    });

    // Fallback timeout after 3.5 seconds
    const timeout = setTimeout(() => {
      if (!handled) {
        const lastCheck = typeof window !== "undefined" ? localStorage.getItem("securithm_token") : null;
        if (lastCheck) {
          navigateToDashboard(lastCheck);
        } else {
          setError("No authentication token received");
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 2000);
        }
      }
    }, 3500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [searchParams, refreshUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-term-bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm border border-[var(--color-term-error)] p-4 text-center">
          <p className="text-xs text-[var(--color-term-error)] font-mono">[!] {error}</p>
          <p className="text-[9px] text-[var(--color-term-muted)] font-mono mt-2">REDIRECTING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-term-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm border border-[var(--color-term-border)] p-4 text-center">
        <p className="text-xs text-[var(--color-term-fg)] font-mono">AUTHENTICATING WITH GOOGLE...</p>
        <p className="text-[9px] text-[var(--color-term-muted)] font-mono mt-2 animate-blink">▌</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-term-bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm border border-[var(--color-term-border)] p-4 text-center">
          <p className="text-xs text-[var(--color-term-fg)] font-mono">LOADING...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}

