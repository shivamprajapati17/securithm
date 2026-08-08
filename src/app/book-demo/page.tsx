"use client";

import { Navbar } from "@/components/navbar";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Send } from "lucide-react";

interface Booking {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

const STORAGE_KEY = "securithm_demo_bookings";

export default function BookDemoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please fill in your name and email.");
      return;
    }
    const booking: Booking = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      const bookings: Booking[] = existing ? JSON.parse(existing) : [];
      bookings.unshift(booking);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch {
      // storage unavailable — ignore
    }
    setError("");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="border border-[var(--color-term-border)]">
          <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--color-term-fg)]" />
            <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
              SECURITHM DEMO
            </span>
          </div>

          <div className="p-6">
            {submitted ? (
              <div className="text-center py-10">
                <div className="inline-flex h-12 w-12 items-center justify-center border border-[var(--color-term-fg)] mb-4">
                  <CheckCircle2 className="h-6 w-6 text-[var(--color-term-fg)]" />
                </div>
                <h1 className="text-base font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider mb-2">
                  THANK YOU, {name.trim().toUpperCase()}!
                </h1>
                <p className="text-xs text-[var(--color-term-muted)] font-mono max-w-md mx-auto">
                  Your demo request has been received. Our team will reach out
                  to you at {email.trim()} to schedule a walkthrough.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName("");
                    setEmail("");
                    setMessage("");
                  }}
                  className="mt-6 border border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] hover:border-[var(--color-term-fg)] px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  book another demo
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-lg font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider mb-2">
                  BOOK A DEMO
                </h1>
                <p className="text-xs text-[var(--color-term-muted)] font-mono mb-6">
                  Schedule a live walkthrough of Securithm.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1">
                      NAME *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-transparent border border-[var(--color-term-border)] px-3 py-2 text-xs font-mono text-[var(--color-term-fg)] placeholder:text-[var(--color-term-muted)] focus:outline-none focus:border-[var(--color-term-fg)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1">
                      EMAIL *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full bg-transparent border border-[var(--color-term-border)] px-3 py-2 text-xs font-mono text-[var(--color-term-fg)] placeholder:text-[var(--color-term-muted)] focus:outline-none focus:border-[var(--color-term-fg)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1">
                      MESSAGE
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Tell us what you'd like to see (optional)"
                      className="w-full bg-transparent border border-[var(--color-term-border)] px-3 py-2 text-xs font-mono text-[var(--color-term-fg)] placeholder:text-[var(--color-term-muted)] focus:outline-none focus:border-[var(--color-term-fg)] resize-y"
                    />
                  </div>

                  {error && (
                    <div className="border border-[var(--color-term-error)] text-[var(--color-term-error)] px-3 py-2 text-[10px] font-mono">
                      [ ERROR ] {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 border border-[var(--color-term-fg)] text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] px-6 py-3 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    SUBMIT
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
