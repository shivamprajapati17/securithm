"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam) {
      setError(decodeURIComponent(errorDescription || errorParam));
      setTimeout(() => router.push("/auth/login"), 2000);
      return;
    }

    // Handle PKCE code exchange (Supabase OAuth callback)
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          setError(exchangeError.message);
          setTimeout(() => router.push("/auth/login"), 2000);
        } else {
          router.push("/dashboard");
        }
      });
      return;
    }

    // Check if session already exists (hash fragment / auto-detected by supabase-js)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      } else {
        // Wait a moment for Supabase to process any auth params
        const timeout = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) {
              router.push("/dashboard");
            } else {
              setError("No authentication token received");
              setTimeout(() => router.push("/auth/login"), 2000);
            }
          });
        }, 1500);
        return () => clearTimeout(timeout);
      }
    });
  }, [router, searchParams]);

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
        <p className="text-xs text-[var(--color-term-fg)] font-mono">AUTHENTICATING...</p>
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
