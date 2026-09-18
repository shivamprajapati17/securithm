"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/components/scroll-animations";

/* ────────────────────────────────────────────────────────────
   Preloader — rotating orbit, word reveal, scaleX progress line
   ──────────────────────────────────────────────────────────── */
export function Preloader() {
  const ref = useRef<HTMLDivElement>(null!);
  const [done, setDone] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setDone(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const words = el.querySelectorAll(".pl-word > span");
    const bar = el.querySelector(".pl-bar");
    const orbit = el.querySelector(".pl-orbit");

    const tl = gsap.timeline({
      onComplete: () => setDone(true),
    });
    tl.fromTo(
      words,
      { yPercent: 115 },
      { yPercent: 0, duration: 0.55, stagger: 0.16, ease: "power3.out" },
    )
      .fromTo(
        bar,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.15, ease: "power2.inOut" },
        0.25,
      )
      .to(orbit, { rotation: "+=360", duration: 1.2, ease: "none" }, 0)
      .to(el, { opacity: 0, duration: 0.45, ease: "power1.out" }, "+=0.15");

    return () => {
      tl.kill();
    };
  }, [reducedMotion]);

  if (done) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#140a05]"
    >
      <div className="flex flex-col items-center gap-8">
        {/* Orbit spinner */}
        <div className="pl-orbit relative h-12 w-12">
          <span className="absolute inset-0 rounded-full border border-white/15" />
          <span className="absolute inset-0 rounded-full border-t border-[#a56bff]" />
          <span className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a56bff]" />
        </div>

        {/* Word reveal */}
        <div className="fw-mono overflow-hidden text-xs uppercase tracking-[0.35em] text-white/70">
          <span className="pl-word fw-mask">
            <span>Securing</span>
          </span>{" "}
          <span className="pl-word fw-mask">
            <span>every</span>
          </span>{" "}          <span className="pl-word fw-mask">
            <span className="text-[#a56bff]">frame</span>
          </span>{""}
          <span className="pl-word fw-mask">
            <span>of</span>
          </span>{" "}
          <span className="pl-word fw-mask">
            <span>on-chain</span>
          </span>{" "}
          <span className="pl-word fw-mask">
            <span>value</span>
          </span>
        </div>

        {/* Progress line */}
        <div className="h-px w-48 overflow-hidden bg-white/10">
          <div className="pl-bar h-full w-full origin-left ax-gradient" />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Custom cursor — 3 layers: Ring (94), Dot (95), Label (96)
   Label changes based on [data-cursor] hover targets.
   ──────────────────────────────────────────────────────────── */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null!);
  const ringRef = useRef<HTMLDivElement>(null!);
  const labelRef = useRef<HTMLDivElement>(null!);
  const [enabled, setEnabled] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    setEnabled(true);
    document.documentElement.classList.add("fw-cursor-on");

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;

    const dotX = gsap.quickTo(dot, "x", { duration: 0.06, ease: "power2" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.06, ease: "power2" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.28, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.28, ease: "power3" });
    const lblX = gsap.quickTo(label, "x", { duration: 0.35, ease: "power3" });
    const lblY = gsap.quickTo(label, "y", { duration: 0.35, ease: "power3" });

    const onMove = (e: MouseEvent) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      lblX(e.clientX);
      lblY(e.clientY);

      const target = (e.target as HTMLElement)?.closest?.("[data-cursor]");
      const text = target?.getAttribute("data-cursor");
      if (text) {
        label.textContent = text;
        gsap.to(label, { opacity: 1, scale: 1, duration: 0.25 });
        gsap.to(ring, { scale: 1.9, opacity: 0.9, duration: 0.3 });
      } else {
        gsap.to(label, { opacity: 0, scale: 0.7, duration: 0.2 });
        gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3 });
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.classList.remove("fw-cursor-on");
    };
  }, [reducedMotion]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[94] -ml-4 -mt-4 h-8 w-8 rounded-full border border-[#a56bff]/70"
        style={{ transform: "translate(-100px,-100px)" }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[95] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-[#a56bff]"
        style={{ transform: "translate(-100px,-100px)" }}
      />
      <div
        ref={labelRef}
        className="fw-mono pointer-events-none fixed left-0 top-0 z-[96] ml-5 mt-4 rounded-[4px] bg-[#8338ec] px-2 py-0.5 text-[10px] uppercase tracking-widest text-white opacity-0"
        style={{ transform: "translate(-100px,-100px)" }}
      />
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   Three.js point-cloud aura — fixed, additive blending
   ──────────────────────────────────────────────────────────── */
export function AuraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        100,
      );
      camera.position.z = 9;

      // Point cloud
      const COUNT = 1100;
      const pos = new Float32Array(COUNT * 3);
      const col = new Float32Array(COUNT * 3);
      const violet = new THREE.Color("#a56bff");
      const blue = new THREE.Color("#3a86ff");
      const dim = new THREE.Color("#2b2350");
      for (let i = 0; i < COUNT; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 26;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
        const r = Math.random();
        const c = r > 0.88 ? blue : r > 0.5 ? violet : dim;
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

      const mat = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);

      const mouse = { x: 0, y: 0 };
      const onMove = (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("resize", onResize);

      let raf = 0;
      const clock = new THREE.Clock();
      const animate = () => {
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        points.rotation.y = t * 0.03 + mouse.x * 0.12;
        points.rotation.x = mouse.y * 0.08;
        const p = geo.attributes.position.array as Float32Array;
        for (let i = 0; i < COUNT; i++) {
          const i3 = i * 3;
          p[i3 + 1] += Math.sin(t * 0.4 + p[i3] * 0.5) * 0.0012;
        }
        geo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
      };
      if (reducedMotion) {
        renderer.render(scene, camera);
      } else {
        animate();
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("resize", onResize);
        geo.dispose();
        mat.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-50"
      aria-hidden
    />
  );
}

/* ────────────────────────────────────────────────────────────
   Scroll progress bar — fixed top, scaleX mapped to depth
   ──────────────────────────────────────────────────────────── */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-white/5">
      <div ref={ref} className="fw-progress ax-gradient h-full w-full" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   useLandingMotion — shared page-level animation wiring
   (split-text mask reveals, image parallax, tilt, marquee,
   video loop-in-view, magnetic, FAQ accordion)
   ──────────────────────────────────────────────────────────── */
export function useLandingMotion(reduced: boolean) {
  const pathname = usePathname();

  useEffect(() => {
    if (reduced) return;

    const ctx = gsap.context(() => {
      // 1. Split-text mask reveals for section headings
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        const spans = el.querySelectorAll(".fw-mask > span");
        gsap.fromTo(
          spans,
          { yPercent: 115 },
          {
            yPercent: 0,
            duration: 0.9,
            stagger: 0.06,
            ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          },
        );
      });

      // 2. Hero words after the preloader clears
      const heroSpans = document.querySelectorAll("[data-hero-split] .fw-mask > span");
      if (heroSpans.length) {
        gsap.fromTo(
          heroSpans,
          { yPercent: 115 },
          { yPercent: 0, duration: 1, stagger: 0.08, ease: "power4.out", delay: 1.5 },
        );
      }

      // 2b. Hero sub-elements: slide up 20px + fade, 100ms stagger (Axiom spec)
      const heroEls = document.querySelectorAll("[data-ax-hero]");
      if (heroEls.length) {
        gsap.fromTo(
          heroEls,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            delay: 1.7,
          },
        );
      }

      // 2c. Generic scroll reveal: fade + slide up at 20% visible
      gsap.utils.toArray<HTMLElement>("[data-ax-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 80%" },
          },
        );
      });

      // 3. Parallax on images inside .fw-parallax
      gsap.utils.toArray<HTMLElement>(".fw-parallax").forEach((img) => {
        gsap.fromTo(
          img,
          { yPercent: -7 },
          {
            yPercent: 7,
            ease: "none",
            scrollTrigger: {
              trigger: img.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });

      // 4. Tilt cards (±3deg)
      gsap.utils.toArray<HTMLElement>(".fw-tilt").forEach((card) => {
        const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
        const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
        const onMove = (e: MouseEvent) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          rx(-py * 6); // ±3deg
          ry(px * 6);
        };
        const onLeave = () => {
          rx(0);
          ry(0);
        };
        card.addEventListener("mousemove", onMove);
        card.addEventListener("mouseleave", onLeave);
      });

      // 5. Marquee — infinite xPercent loop
      const track = document.querySelector<HTMLElement>(".fw-marquee-track");
      if (track) {
        const half = track.scrollWidth / 2;
        const tween = gsap.to(track, {
          x: -half,
          duration: 24,
          ease: "none",
          repeat: -1,
        });
        return () => tween.kill();
      }
    });

    return () => ctx.revert();
  }, [pathname, reduced]);
}

/* ────────────────────────────────────────────────────────────
   Video + FAQ + magnetic behaviors, mounted once
   ──────────────────────────────────────────────────────────── */
export function LandingBehaviors({ reduced }: { reduced: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    if (reduced) return;

    // Video loop-in-view: play at 35% visible, pause when out
    const videos = document.querySelectorAll<HTMLVideoElement>("video[data-loop-in-view]");
    const observers: IntersectionObserver[] = [];
    videos.forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        { threshold: [0, 0.35, 1] },
      );
      io.observe(video);
      observers.push(io);
    });

    // Magnetic buttons (0.18 factor, elastic snap-back)
    const magnets = gsap.utils.toArray<HTMLElement>(".magnetic");
    const cleanups: Array<() => void> = [];
    magnets.forEach((btn) => {
      const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
      const onMove = (e: MouseEvent) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.18);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.18);
      };
      const onLeave = () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
      };
      btn.addEventListener("mousemove", onMove);
      btn.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        btn.removeEventListener("mousemove", onMove);
        btn.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => {
      observers.forEach((o) => o.disconnect());
      cleanups.forEach((fn) => fn());
    };
  }, [pathname, reduced]);

  return null;
}
