"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Hook: useReducedMotion ─────────────────────────────────
// Shared hook for prefers-reduced-motion detection

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reducedMotion;
}

// ─── Component: FadeInSection ────────────────────────────────
// Wraps any section with a fade-in + slide-up on scroll

export function FadeInSection({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null!);
  const pathname = usePathname();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          isDesktop: `(min-width: 768px) and (prefers-reduced-motion: no-preference)`,
        },
        (context) => {
          const { isDesktop } = context.conditions!;
          gsap.fromTo(
            sectionRef.current,
            { y: isDesktop ? 40 : 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: isDesktop ? 0.8 : 0.5,
              delay,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 85%",
                end: "top 30%",
                toggleActions: "play none none reverse",
              },
            },
          );
        },
      );
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [pathname, delay, reducedMotion]);

  return (
    <div ref={sectionRef} className={className} style={{ opacity: reducedMotion ? 1 : undefined }}>
      {children}
    </div>
  );
}

// ─── Component: ScaleInSection ────────────────────────────────
// Cards scale in from slightly smaller

export function ScaleInSection({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null!);
  const pathname = usePathname();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          isDesktop: `(min-width: 768px) and (prefers-reduced-motion: no-preference)`,
        },
        (context) => {
          const { isDesktop } = context.conditions!;
          gsap.fromTo(
            sectionRef.current,
            { scale: 0.92, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: isDesktop ? 0.7 : 0.4,
              delay,
              ease: "power3.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 88%",
                end: "top 40%",
                toggleActions: "play none none reverse",
              },
            },
          );
        },
      );
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [pathname, delay, reducedMotion]);

  return (
    <div ref={sectionRef} className={className} style={{ opacity: reducedMotion ? 1 : undefined }}>
      {children}
    </div>
  );
}

// ─── Component: StaggerGrid ──────────────────────────────────
// Stagger-children animation for grids

export function StaggerGrid({
  children,
  className = "",
  staggerAmount = 0.08,
}: {
  children: ReactNode;
  className?: string;
  staggerAmount?: number;
}) {
  const gridRef = useRef<HTMLDivElement>(null!);
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !gridRef.current) return;

    const items = gridRef.current.children;
    if (!items.length) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          isDesktop: `(min-width: 768px) and (prefers-reduced-motion: no-preference)`,
        },
        (context) => {
          const { isDesktop } = context.conditions!;
          gsap.fromTo(
            items,
            { y: isDesktop ? 30 : 15, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: isDesktop ? 0.6 : 0.3,
              stagger: staggerAmount,
              ease: "power2.out",
              scrollTrigger: {
                trigger: gridRef.current,
                start: "top 85%",
                end: "top 30%",
                toggleActions: "play none none reverse",
              },
            },
          );
        },
      );
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [pathname, staggerAmount, reducedMotion]);

  return (
    <div ref={gridRef} className={className} style={{ opacity: reducedMotion ? 1 : undefined }}>
      {children}
    </div>
  );
}
