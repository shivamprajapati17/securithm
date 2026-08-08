"use client";

import { Navbar } from "@/components/navbar";
import { useState, useEffect } from "react";
import { CalendarDays, CheckCircle2, Clock, Trash2 } from "lucide-react";

interface Booking {
  id: string;
  name: string;
  email: string;
  company: string;
  date: string;
  time: string;
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = "securithm_demo_bookings";

function loadBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking[]) : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings: Booking[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch {
    // storage full or unavailable — ignore
  }
}

const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export default function BookDemoPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBookings(loadBookings());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !date || !time) {
      setError("Please fill in your name, email, preferred date, and time.");
      return;
    }
    const booking: Booking = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      date,
      time,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [booking, ...bookings];
    setBookings(updated);
    saveBookings(updated);
    setName("");
    setEmail("");
    setCompany("");
    setDate("");
    setTime("");
    setNotes("");
    setError("");
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 6000);
  };

  const handleDelete = (id: string) => {
    const updated = bookings.filter((b) => b.id !== id);
    setBookings(updated);
    saveBookings(updated);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-[var(--color-term-bg)]">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="border border-[var(--color-term-border)] mb-8">
          <div className="border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)] px-4 py-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--color-term-fg)]" />
            <span className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider term-glow">
              SECURITHM DEMO
            </span>
          </div>
          <div className="p-6">
            <h1 className="text-lg font-bold text-[var(--color-term-fg)] term-glow uppercase tracking-wider mb-2">
              BOOK A DEMO
            </h1>
            <p className="text-xs text-[var(--color-term-muted)] font-mono max-w-2xl mb-6">
              Schedule a live walkthrough of Securithm. Our team will show you
              smart contract scanning, continuous monitoring, and the risk
              score API.
            </p>

            {submitted && (
              <div className="border border-[var(--color-term-fg)] bg-[var(--color-term-dim)] p-4 mb-6 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[var(--color-term-fg)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider mb-1">
                    [ BOOKING CONFIRMED ]
                  </p>
                  <p className="text-[10px] text-[var(--color-term-muted)] font-mono">
                    Your demo request has been saved. We will contact you at the
                    email provided to confirm the slot.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="ml-auto text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] text-xs font-mono cursor-pointer"
                  aria-label="Dismiss confirmation"
                >
                  [X]
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 mb-8">
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
                  WORK EMAIL *
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
                  COMPANY
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company Inc."
                  className="w-full bg-transparent border border-[var(--color-term-border)] px-3 py-2 text-xs font-mono text-[var(--color-term-fg)] placeholder:text-[var(--color-term-muted)] focus:outline-none focus:border-[var(--color-term-fg)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1">
                  PREFERRED DATE *
                </label>
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent border border-[var(--color-term-border)] px-3 py-2 text-xs font-mono text-[var(--color-term-fg)] focus:outline-none focus:border-[var(--color-term-fg)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1">
                  PREFERRED TIME *
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-transparent border border-[var(--color-term-border)] px-3 py-2 text-xs font-mono text-[var(--color-term-fg)] focus:outline-none focus:border-[var(--color-term-fg)]"
                >
                  <option value="" className="text-black">Select a time slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot} className="text-black">
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider mb-1">
                  NOTES
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="What would you like to see? (optional)"
                  className="w-full bg-transparent border border-[var(--color-term-border)] px-3 py-2 text-xs font-mono text-[var(--color-term-fg)] placeholder:text-[var(--color-term-muted)] focus:outline-none focus:border-[var(--color-term-fg)] resize-y"
                />
              </div>

              {error && (
                <div className="sm:col-span-2 border border-[var(--color-term-error)] text-[var(--color-term-error)] px-3 py-2 text-[10px] font-mono">
                  [ ERROR ] {error}
                </div>
              )}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 border border-[var(--color-term-fg)] text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] px-6 py-3 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  REQUEST DEMO
                </button>
              </div>
            </form>

            {/* My bookings */}
            <div className="border-t border-[var(--color-term-border)] pt-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-[var(--color-term-fg)] uppercase tracking-wider">
                  [ MY BOOKINGS ]
                </h2>
                <span className="text-[9px] font-mono text-[var(--color-term-muted)]">
                  {bookings.length} REQUEST{bookings.length === 1 ? "" : "S"} SAVED LOCALLY
                </span>
              </div>

              {bookings.length === 0 ? (
                <p className="text-[10px] text-[var(--color-term-muted)] font-mono">
                  No demo requests yet. Submit the form above to book a demo.
                </p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="border border-[var(--color-term-border)] p-3 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[var(--color-term-fg)] uppercase tracking-wider">
                            {b.name}
                          </span>
                          {b.company && (
                            <span className="text-[9px] font-mono text-[var(--color-term-muted)]">
                              @ {b.company}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-[var(--color-term-muted)] mb-1">
                          {b.email}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--color-term-fg)]">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {b.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {b.time}
                          </span>
                        </div>
                        {b.notes && (
                          <p className="text-[9px] font-mono text-[var(--color-term-muted)] mt-1 italic">
                            {b.notes}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id)}
                        className="text-[var(--color-term-muted)] hover:text-[var(--color-term-error)] transition-colors p-1 cursor-pointer"
                        aria-label={`Delete booking for ${b.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
