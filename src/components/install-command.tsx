"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";

const installSteps = [
  { cmd: "npm install securithm", duration: 1200 },
  { cmd: "npx securithm init", duration: 800 },
  { cmd: "Securithm scan . --contract ./contracts", duration: 600 },
];

export default function InstallCommand() {
  const [step, setStep] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [displayCmd, setDisplayCmd] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null!);
  const [visible, setVisible] = useState(false);

  // Intersection observer to trigger on scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((c) => !c), 500);
    return () => clearInterval(interval);
  }, []);

  // Typing effect for current command
  useEffect(() => {
    if (step < 0 || step >= installSteps.length) return;
    const cmd = installSteps[step].cmd;
    let i = 0;
    setDisplayCmd("");
    const interval = setInterval(() => {
      i++;
      setDisplayCmd(cmd.slice(0, i));
      if (i >= cmd.length) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [step]);

  // Run steps sequentially when visible
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    const runSteps = async () => {
      for (let i = 0; i < installSteps.length; i++) {
        if (cancelled) return;
        setStep(i);
        setProgress(0);

        // Wait for typing to finish + small pause
        await new Promise((r) => setTimeout(r, installSteps[i].duration + 300));

        if (cancelled) return;

        // Progress bar animation
        const startTime = Date.now();
        const barDuration = 800;
        await new Promise<void>((resolve) => {
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min(elapsed / barDuration, 1);
            setProgress(pct);
            if (pct < 1) requestAnimationFrame(tick);
            else resolve();
          };
          requestAnimationFrame(tick);
        });
      }

      if (!cancelled) {
        setCompleted(true);
      }
    };

    const timer = setTimeout(runSteps, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [visible]);

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      {/* Terminal window chrome */}
      <div className="border border-[var(--color-term-border)] bg-[#050505]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-[var(--color-term-border)] px-3 py-1.5 bg-[var(--color-term-dim)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 border border-[var(--color-term-muted)] bg-[var(--color-term-muted)]" />
            <span className="w-2.5 h-2.5 border border-[var(--color-term-secondary)] bg-[var(--color-term-secondary)]" />
            <span className="w-2.5 h-2.5 border border-[var(--color-term-fg)] bg-[var(--color-term-fg)]" />
          </div>
          <span className="text-[9px] text-[var(--color-term-muted)] font-mono ml-2">
            terminal — bash
          </span>
        </div>

        {/* Terminal body */}
        <div className="p-4 space-y-2 text-xs font-mono">
          {/* Prompt line */}
          <div className="flex items-start gap-2">
            <span className="text-[var(--color-term-muted)] shrink-0">$</span>
            <div className="flex-1">
              <span className="text-[var(--color-term-fg)]">
                {step >= 0 && step < installSteps.length
                  ? displayCmd
                  : visible
                    ? ""
                    : " "}
              </span>
              {step >= 0 && step < installSteps.length && displayCmd.length < installSteps[step].cmd.length && (
                <span
                  className={`ml-0.5 text-[var(--color-term-fg)] ${showCursor ? "opacity-100" : "opacity-0"}`}
                >
                  ▊
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {step >= 0 && !completed && (
            <div className="flex items-center gap-3 pl-5 mt-1">
              <div className="flex-1 h-4 border border-[var(--color-term-border)] bg-[var(--color-term-bg)] relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[var(--color-term-fg)] transition-none"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-[var(--color-term-muted)] w-8 text-right font-mono">
                {Math.round(progress * 100)}%
              </span>
            </div>
          )}

          {/* Success checkmark */}
          {completed && (
            <div className="flex items-center gap-2 pl-5 mt-2 text-[var(--color-term-fg)]">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">
                Securithm installed and initialized successfully.
              </span>
            </div>
          )}

          {/* Empty prompt at end */}
          {completed && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[var(--color-term-muted)] shrink-0">$</span>
              <span className={`text-[var(--color-term-fg)] ${showCursor ? "opacity-100" : "opacity-0"}`}>
                ▊
              </span>
            </div>
          )}

          {/* Initial state */}
          {!visible && step === -1 && (
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-term-muted)] shrink-0">$</span>
              <span className="text-[var(--color-term-muted)]">
                Scroll here to install...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
