"use client";

import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Shared Mouse State ──────────────────────────────────────

const mouse = { x: 0, y: 0 };

function useMouseTracking() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
}

// ─── Particle Field ──────────────────────────────────────────

function ParticleField({ count = 600 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null!);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const green = new THREE.Color("#33ff00");
    const muted = new THREE.Color("#1f521f");

    for (let i = 0; i < count; i++) {
      const radius = 8 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const c = Math.random() > 0.85 ? green : muted;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return geo;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const positions = meshRef.current.geometry.attributes.position
      .array as Float32Array;
    const time = state.clock.elapsedTime * 0.05;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];

      const wave = Math.sin(time + z * 0.5 + x * 0.3) * 0.08;
      positions[i3] = x + Math.sin(time + i * 0.01) * 0.01;
      positions[i3 + 1] = y + wave + mouse.y * 0.05;
      positions[i3 + 2] = z + Math.cos(time + i * 0.01) * 0.01;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.rotation.x = mouse.y * 0.1;
    meshRef.current.rotation.y = mouse.x * 0.1 + time * 0.3;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Wireframe Torus Knot ────────────────────────────────────

function WireframeTorusKnot() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const geometry = useMemo(() => new THREE.TorusKnotGeometry(2.2, 0.7, 128, 16), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = Math.sin(time * 0.1) * 0.1 + mouse.y * 0.2;
    meshRef.current.rotation.y = time * 0.15 + mouse.x * 0.3;
    const pulse = 1 + Math.sin(time * 0.5) * 0.03;
    meshRef.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#33ff00"
        wireframe
        transparent
        opacity={0.25}
        emissive="#33ff00"
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

// ─── Glowing Inner Ring ──────────────────────────────────────

function GlowingRing() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const geometry = useMemo(() => new THREE.RingGeometry(2.8, 3, 64), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.08;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        color="#33ff00"
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ─── Connection Lines (Blockchain-inspired) ──────────────────

function ConnectionLines() {
  const lineRef = useRef<THREE.LineSegments>(null!);
  const geometry = useMemo(() => {
    const count = 24;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 3.5 + Math.random() * 1.5;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * r,
          Math.sin(angle * 2) * 1.5,
          Math.sin(angle) * r,
        ),
      );
    }
    const pairs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = points[i].distanceTo(points[j]);
        if (dist < 3 && Math.random() > 0.7) {
          pairs.push(points[i].x, points[i].y, points[i].z);
          pairs.push(points[j].x, points[j].y, points[j].z);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(pairs, 3),
    );
    return geo;
  }, []);

  useFrame((state) => {
    if (!lineRef.current) return;
    lineRef.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color="#1f521f"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

// ─── Scene ───────────────────────────────────────────────────

function Scene() {
  useMouseTracking();

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#33ff00" />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#ffb000" />
      <ParticleField count={600} />
      <WireframeTorusKnot />
      <GlowingRing />
      <ConnectionLines />
    </>
  );
}

// ─── Main Export ─────────────────────────────────────────────

export default function ThreeBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
