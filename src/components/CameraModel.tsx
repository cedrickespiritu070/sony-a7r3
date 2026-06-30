"use client";

import { useRef, useLayoutEffect, useMemo } from "react";
import { useGLTF, Center } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

const MODEL_PATH = "/models/camera-opt.glb";

// ── Section poses ──────────────────────────────────────────
// S_INTRO: centered front-facing hero — fills viewport
const SI = { px:  0.0, pz:  0.3, ry:  0.18, rx:  0.06, rz:  0.005, sc: 0.50 };
// S0: right side — pushed far right so left text panel has clear space
const S0 = { px:  2.2, pz:  0.0, ry: -0.45, rx:  0.10, rz:  0.012, sc: 0.37 };
// S1: slight left of center, back plate facing viewer — cinema reveal
const S1 = { px: -0.5, pz:  0.4, ry:  3.14, rx: -0.05, rz:  0.000, sc: 0.37 };
// S2: left side — pushed far left so right text panel has clear space
const S2 = { px: -2.2, pz:  0.0, ry:  5.65, rx:  0.08, rz: -0.012, sc: 0.37 };

// Module-level mouse tracker
const mouse = { x: 0, y: 0 };
if (typeof window !== "undefined") {
  window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
}

function Model({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const outerRef  = useRef<THREE.Group>(null);
  const innerRef  = useRef<THREE.Group>(null);
  const accentRef = useRef<THREE.PointLight>(null);
  const spotRef   = useRef<THREE.SpotLight>(null);
  const { scene } = useGLTF(MODEL_PATH);
  const model     = useMemo(() => scene.clone(true), [scene]);

  useLayoutEffect(() => {
    const group   = outerRef.current;
    const trigger = scrollRef.current;
    if (!group || !trigger) return;

    // Initial state — hero beat (S_INTRO, large scale, centered)
    gsap.set(group.position, { x: SI.px, y: 0, z: SI.pz });
    gsap.set(group.rotation, { x: SI.rx, y: SI.ry, z: SI.rz });
    gsap.set(group.scale,    { x: SI.sc, y: SI.sc, z: SI.sc });

    // ── Timeline: 4 sections × 100vh = 400vh total ──────────
    // SI hold: 0.00–0.22  (first ~100vh, full-screen hero beat)
    // SI→S0:  0.22–0.30  (quick sweep out as first text arrives)
    // S0 hold: 0.30–0.45  (first text section)
    // S0→S1:  0.45–0.62  (rotate to back plate)
    // S1 hold: 0.62–0.68  (second text section midpoint)
    // S1→S2:  0.68–0.82  (sweep to left)
    // S2 hold: 0.82–1.00  (third text section)
    // Total durations: 0.22+0.08+0.15+0.17+0.06+0.14+0.18 = 1.00

    const tl = gsap.timeline({
      scrollTrigger: { trigger, start: "top top", end: "bottom bottom", scrub: 0.5 },
    });

    // SI hold (intro beat — 22% of total scroll)
    tl.to({}, { duration: 0.22 });

    // Sweep SI → S0 (model jumps to right, scale shrinks, text panel 1 fades in)
    tl.to(group.position, { x: S0.px, z: S0.pz, ease: "power2.inOut", duration: 0.08 })
      .to(group.rotation, { y: S0.ry, x: S0.rx, z: S0.rz, ease: "power2.inOut", duration: 0.08 }, "<")
      .to(group.scale,    { x: S0.sc, y: S0.sc, z: S0.sc, ease: "power2.inOut", duration: 0.08 }, "<");

    // S0 hold
    tl.to({}, { duration: 0.15 });

    // Sweep S0 → S1
    tl.to(group.position, { x: S1.px, z: S1.pz, ease: "power2.inOut", duration: 0.17 })
      .to(group.rotation, { y: S1.ry, x: S1.rx, z: S1.rz, ease: "power2.inOut", duration: 0.17 }, "<");

    // S1 hold
    tl.to({}, { duration: 0.06 });

    // Sweep S1 → S2
    tl.to(group.position, { x: S2.px, z: S2.pz, ease: "power2.inOut", duration: 0.14 })
      .to(group.rotation, { y: S2.ry, x: S2.rx, z: S2.rz, ease: "power2.inOut", duration: 0.14 }, "<");

    // S2 hold
    tl.to({}, { duration: 0.18 });

    return () => { tl.kill(); };
  }, [scrollRef]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Y float (GSAP never touches y)
    if (outerRef.current) {
      outerRef.current.position.y = Math.sin(t * 0.6) * 0.045 + Math.cos(t * 0.33) * 0.018;
    }

    // Mouse parallax on inner group
    if (innerRef.current) {
      innerRef.current.rotation.x += (-mouse.y * 0.09 - innerRef.current.rotation.x) * 0.055;
      innerRef.current.rotation.y += ( mouse.x * 0.11 - innerRef.current.rotation.y) * 0.055;
    }

    // Accent light color: blue(SI/S0) → amber(S1) → teal(S2)
    if (accentRef.current && outerRef.current) {
      const px = outerRef.current.position.x;
      const n  = Math.max(0, Math.min(1, (px - S0.px) / (S2.px - S0.px)));
      const c  = n < 0.5
        ? new THREE.Color().lerpColors(new THREE.Color(0x3a7bf5), new THREE.Color(0xd4882a), n * 2)
        : new THREE.Color().lerpColors(new THREE.Color(0xd4882a), new THREE.Color(0x2ac4d4), (n - 0.5) * 2);
      accentRef.current.color.set(c);
    }

    // Spotlight pulse during intro beat (model is centered and large)
    if (spotRef.current && outerRef.current) {
      const sx = outerRef.current.scale.x;
      // As scale goes from 0.52 (intro) to 0.38 (section), spotlight dims
      const t2 = clock.getElapsedTime();
      spotRef.current.intensity = THREE.MathUtils.lerp(
        spotRef.current.intensity,
        4.5 + Math.sin(t2 * 0.7) * 0.3,
        0.02,
      );
    }
  });

  return (
    <>
      {/* ── Lights ─────────────────────────────── */}

      {/* Ambient — lift shadow floor, keeps dark body visible */}
      <ambientLight intensity={0.65} color="#d0dcf0" />

      {/* Dramatic overhead spot — the single "Apple" hero light */}
      <spotLight
        ref={spotRef}
        position={[0, 8, 4]}
        angle={0.38}
        penumbra={0.7}
        intensity={4.5}
        color="#ffffff"
        castShadow={false}
        target-position={[0, 0, 0]}
      />

      {/* Key — top-left, main specular source */}
      <directionalLight position={[-5, 5, 4]}  intensity={2.4} color="#f2eeea" />

      {/* Front fill — catches lens glass */}
      <directionalLight position={[0, 0, 8]}   intensity={0.9} color="#ffffff" />

      {/* Cool side fill */}
      <directionalLight position={[6, 2, -3]}  intensity={0.7} color="#b4c8e0" />

      {/* Rim — catches body edge from behind */}
      <directionalLight position={[0, 2, -8]}  intensity={0.8} color="#dce8ff" />

      {/* Accent point — hue shifts per section */}
      <pointLight ref={accentRef} position={[3, 2, 4]} intensity={3.2} color="#3a7bf5" />

      {/* Warm under-rim — bounces off bottom, lifts shadow */}
      <pointLight position={[0, -3, 3]} intensity={1.4} color="#c8b07a" />

      {/* ── Model ─────────────────────────────── */}
      <group ref={outerRef} scale={SI.sc}>
        <group ref={innerRef}>
          <Center>
            <primitive object={model} />
          </Center>
        </group>
      </group>

      {/* ── Post-processing ───────────────────── */}
      <EffectComposer>
        {/* Bloom on bright specular highlights (lens glass, metal edges) */}
        <Bloom
          luminanceThreshold={0.55}
          luminanceSmoothing={0.3}
          intensity={0.7}
          mipmapBlur
          blendFunction={BlendFunction.ADD}
        />
        {/* Subtle vignette — focuses eye on camera, kills canvas edge cheapness */}
        <Vignette
          offset={0.28}
          darkness={0.55}
          eskil={false}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  );
}

export default function CameraModel(props: { scrollRef: React.RefObject<HTMLElement | null> }) {
  return <Model {...props} />;
}
