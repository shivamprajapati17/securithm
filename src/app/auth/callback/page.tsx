"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam) {
      setError(decodeURIComponent(errorDescription || errorParam));
      setTimeout(() => router.push("/auth/login"), 2000);
      return;
    }

    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("securithm_token", token);
      setAuthToken(token);
      refreshUser().then(() => {
        router.push("/dashboard");
      });
      return;
    }

    // Check if token already stored in localStorage
    const existing = typeof window !== "undefined" ? localStorage.getItem("securithm_token") : null;
    if (existing) {
      setAuthToken(existing);
      refreshUser().then(() => {
        router.push("/dashboard");
      });
    } else {
      setError("No authentication token received");
      setTimeout(() => router.push("/auth/login"), 2000);
    }
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

