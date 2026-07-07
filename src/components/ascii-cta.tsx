"use client";

import { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "@/components/scroll-animations";

gsap.registerPlugin(ScrollTrigger);

export default function AsciiCta() {
  const sectionRef = useRef<HTMLDivElement>(null!);
  const borderRef = useRef<SVGSVGElement>(null!);
  const btnRef = useRef<HTMLAnchorElement>(null!);
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          isDesktop: `(min-width: 768px) and (prefers-reduced-motion: no-preference)`,
          isMobile: `(max-width: 767px) and (prefers-reduced-motion: no-preference)`,
        },
        (context) => {
          const { isDesktop } = context.conditions!;

          // Self-drawing border animation
          if (borderRef.current) {
            const borderPath = borderRef.current.querySelector("rect");
            if (borderPath) {
              const length = borderPath.getTotalLength();
              gsap.set(borderPath, {
                strokeDasharray: length,
                strokeDashoffset: length,
              });

              gsap.to(borderPath, {
                strokeDashoffset: 0,
                duration: isDesktop ? 2 : 1.2,
                ease: "power3.inOut",
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top 80%",
                  end: "top 40%",
                  toggleActions: "play none none reverse",
                },
              });
            }
          }

          // Content fade-in
          const content = sectionRef.current.querySelector(".cta-content");
          if (content) {
            gsap.fromTo(
              content,
              { y: isDesktop ? 30 : 15, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: isDesktop ? 1 : 0.6,
                delay: isDesktop ? 0.3 : 0.2,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top 80%",
                  end: "top 40%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          }

          // Button pulsing glow after border draws
          if (btnRef.current) {
            gsap.fromTo(
              btnRef.current,
              { boxShadow: "0 0 0px rgba(51, 255, 0, 0)" },
              {
                boxShadow: "0 0 20px rgba(51, 255, 0, 0.4)",
                duration: 0.8,
                delay: isDesktop ? 2.5 : 1.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top 80%",
                  end: "top 40%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          }
        },
      );
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [pathname, reducedMotion]);

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 relative">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative">
        {/* Self-drawing ASCII border SVG */}
        <svg
          ref={borderRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 800 350"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%" }}
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke="var(--color-term-fg)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          {/* Corner markers */}
          <text
            x="6"
            y="14"
            fill="var(--color-term-fg)"
            fontSize="10"
            fontFamily="monospace"
            vectorEffect="non-scaling-size"
          >
            ╔
          </text>
          <text
            x="790"
            y="14"
            fill="var(--color-term-fg)"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
            vectorEffect="non-scaling-size"
          >
            ╗
          </text>
          <text
            x="6"
            y="340"
            fill="var(--color-term-fg)"
            fontSize="10"
            fontFamily="monospace"
            vectorEffect="non-scaling-size"
          >
            ╚
          </text>
          <text
            x="790"
            y="340"
            fill="var(--color-term-fg)"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
            vectorEffect="non-scaling-size"
          >
            ╝
          </text>
          {/* Top/bottom lines */}
          <line
            x1="16"
            y1="14"
            x2="784"
            y2="14"
            stroke="var(--color-term-fg)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="16"
            y1="340"
            x2="784"
            y2="340"
            stroke="var(--color-term-fg)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          {/* Side lines */}
          <line
            x1="6"
            y1="24"
            x2="6"
            y2="330"
            stroke="var(--color-term-fg)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="794"
            y1="24"
            x2="794"
            y2="330"
            stroke="var(--color-term-fg)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Content */}
        <div className="cta-content relative z-10 flex flex-col items-center justify-center px-6 py-12 sm:py-16 text-center">
          <h2 className="text-lg sm:text-xl font-bold mb-3 text-[var(--color-term-fg)] term-glow">
            START SECURING NOW
          </h2>
          <p className="text-xs text-[var(--color-term-muted)] mb-6 max-w-lg mx-auto">
            No credit card required. Free tier includes 50 scans per month and
            basic monitoring for one contract.
          </p>

          <a
            ref={btnRef}
            href="/auth/register"
            className="inline-flex items-center gap-2 border border-[var(--color-term-fg)] text-[var(--color-term-fg)] bg-transparent hover:bg-[var(--color-term-fg)] hover:text-[var(--color-term-bg)] px-6 py-3 text-sm font-mono uppercase tracking-wider transition-colors"
          >
            scan your first contract
            <ArrowRight className="h-4 w-4" />
          </a>

          <p className="text-[9px] text-[var(--color-term-muted)] mt-6 font-mono max-w-lg">
            DISCLAIMER: AI analysis provides preliminary findings and is not a
            substitute for a full manual audit. Always engage a professional
            security firm for production deployments.
          </p>
        </div>
      </div>
    </section>
  );
}
