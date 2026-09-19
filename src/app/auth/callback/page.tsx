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

    async function processAuth() {
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        setError(decodeURIComponent(errorDescription || errorParam));
        setTimeout(() => router.push("/auth/login"), 2500);
        return;
      }

      // 1. Check for token in search params
      const token = searchParams.get("token");
      if (token) {
        handled = true;
        localStorage.setItem("securithm_token", token);
        setAuthToken(token);
        await refreshUser();
        window.location.href = "/dashboard";
        return;
      }

      // 2. Check for hash parameters (#access_token=...)
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashToken = hashParams.get("access_token");
        if (hashToken) {
          handled = true;
          localStorage.setItem("securithm_token", hashToken);
          setAuthToken(hashToken);
          await refreshUser();
          window.location.href = "/dashboard";
          return;
        }
      }

      // 3. Check for Supabase session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          handled = true;
          localStorage.setItem("securithm_token", session.access_token);
          setAuthToken(session.access_token);
          await refreshUser();
          window.location.href = "/dashboard";
          return;
        }
      } catch (err) {
        console.warn("Supabase session lookup error:", err);
      }

      // 4. Check if token was already in localStorage
      const existing = typeof window !== "undefined" ? localStorage.getItem("securithm_token") : null;
      if (existing) {
        handled = true;
        setAuthToken(existing);
        await refreshUser();
        window.location.href = "/dashboard";
        return;
      }

      if (!handled) {
        setError("No authentication token received");
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 2000);
      }
    }

    processAuth();
  }, [router, searchParams, refreshUser]);

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

