"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Shield } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login/${provider}`);
      if (!res.ok) {
        const msg = provider === "google"
          ? "Google OAuth not configured. Add GOOGLE_CLIENT_ID to .env"
          : "GitHub OAuth not configured. Add GITHUB_CLIENT_ID to .env";
        throw new Error(msg);
      }
      const data = await res.json();
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} login failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-term-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm border border-[var(--color-term-border)]">
        {/* Header */}
        <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--color-term-fg)]" />
          <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
            SECURITHM LOGIN
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error */}
          {error && (
            <div className="p-2.5 border border-[var(--color-term-error)] text-xs text-[var(--color-term-error)] font-mono">
              [!] {error}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="w-full border border-[var(--color-term-border)] text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] px-4 py-2 text-sm font-mono uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              GOOGLE LOGIN
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={loading}
              className="w-full border border-[var(--color-term-border)] text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] px-4 py-2 text-sm font-mono uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GITHUB LOGIN
            </button>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-dashed border-[var(--color-term-border)]" />
            <span className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase">or email</span>
            <div className="flex-1 border-t border-dashed border-[var(--color-term-border)]" />
          </div>

          {/* Email */}
          <div>
            <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1 block">
              EMAIL
            </label>
            <div className="flex items-center border border-[var(--color-term-border)] px-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@example.com"
                required
                className="flex-1 bg-transparent border-none outline-none text-[var(--color-term-fg)] font-mono text-sm py-1.5 placeholder:text-[var(--color-term-muted)]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[9px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1 block">
              PASSWORD
            </label>
            <div className="flex items-center border border-[var(--color-term-border)] px-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="flex-1 bg-transparent border-none outline-none text-[var(--color-term-fg)] font-mono text-sm py-1.5 placeholder:text-[var(--color-term-muted)]"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full border border-[var(--color-term-fg)] text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] px-4 py-2 text-sm font-mono uppercase tracking-wider transition-all disabled:opacity-40"
          >
            {loading ? (
              <span className="animate-blink">LOGGING IN...</span>
            ) : (
              "LOGIN"
            )}
          </button>

          {/* Register link */}
          <p className="text-[10px] font-mono text-[var(--color-term-muted)] text-center">
            NO ACCOUNT?{" "}
            <a href="/auth/register" className="text-[var(--color-term-fg)] hover:underline">
              REGISTER
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
