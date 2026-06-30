"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";
// @ts-ignore — ESM path, no declaration
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import ModelErrorBoundary from "./ModelErrorBoundary";

const MODEL_PATH = "/models/sony_alpha_3/scene.gltf";

// Module-level singletons — no React re-render cost
const mouse       = { x: 0, y: 0 };
// Exported so page.tsx ScrollTrigger can drive rotation without prop drilling
export const modelScroll = { progress: 0 };

if (typeof window !== "undefined") {
  window.addEventListener(
    "mousemove",
    (e) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );
}

function CameraScene() {
  const outerRef   = useRef<THREE.Group>(null);
  const innerRef   = useRef<THREE.Group>(null);
  const scrollRef  = useRef(0);   // lerped Y rotation
  const scrollXRef = useRef(0);   // lerped X drift (left↔right)
  const scrollYRef = useRef(0);   // lerped Y travel (top→bottom of screen)
  const scrollZRef = useRef(0);   // lerped Z zoom (in↔out)
  const { gl, scene: threeScene } = useThree();
  const { scene } = useGLTF(MODEL_PATH);

  // Synthetic IBL — no external asset fetch
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    threeScene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }, [gl, threeScene]);

  useFrame(({ clock }) => {
    const t        = clock.getElapsedTime();
    const progress = modelScroll.progress;

    if (outerRef.current) {
      // Y breathe (time-based float, runs constantly)
      const breatheY = Math.sin(t * 0.55) * 0.04 + Math.cos(t * 0.29) * 0.016;

      // ── Scroll-driven Y rotation ─────────────────────────
      const targetRotY = (progress - 0.5) * Math.PI * 1.4;
      scrollRef.current += (targetRotY - scrollRef.current) * 0.04;
      outerRef.current.rotation.y = scrollRef.current;

      // ── Scroll-driven X drift (left ↔ right sweep) ──────
      const targetX = Math.sin(progress * Math.PI * 2) * 1.5;
      scrollXRef.current += (targetX - scrollXRef.current) * 0.05;

      // ── Scroll-driven Y travel (arc top → bottom of screen) ──
      // cos(0→π): starts at +0.72 (high), crosses 0 at midpoint, ends at -0.72 (low)
      const targetY = Math.cos(progress * Math.PI) * 0.72;
      scrollYRef.current += (targetY - scrollYRef.current) * 0.04;

      // ── Scroll-driven Z zoom (in at mid-scroll, out at ends) ─
      const targetZ = Math.sin(progress * Math.PI) * 3.5;
      scrollZRef.current += (targetZ - scrollZRef.current) * 0.05;

      outerRef.current.position.set(
        scrollXRef.current,
        breatheY + scrollYRef.current,
        scrollZRef.current,
      );
    }

    // Mouse parallax on inner group
    if (innerRef.current) {
      innerRef.current.rotation.x +=
        (-mouse.y * 0.06 - innerRef.current.rotation.x) * 0.05;
      innerRef.current.rotation.y +=
        ( mouse.x * 0.05 - innerRef.current.rotation.y) * 0.05;
    }
  });

  return (
    <>
      {/* ── Lights ──────────────────────────────────────── */}
      <ambientLight intensity={0.55} color="#d4dce8" />
      <spotLight
        position={[0, 10, 5]}
        angle={0.32}
        penumbra={0.65}
        intensity={5.0}
        color="#ffffff"
        castShadow={false}
      />
      <directionalLight position={[-5, 5, 4]}  intensity={2.2} color="#f0ece6" />
      <directionalLight position={[0,  0, 8]}  intensity={0.8} color="#ffffff" />
      <directionalLight position={[6,  2, -3]} intensity={0.6} color="#b4c8e0" />
      <directionalLight position={[0,  2, -8]} intensity={0.7} color="#dce8ff" />
      <pointLight position={[0, -3, 3]}         intensity={1.2} color="#c8b07a" />

      {/* ── Model ───────────────────────────────────────── */}
      <group ref={outerRef}>
        <group ref={innerRef}>
          <Center>
            <primitive object={scene} scale={0.19} />
          </Center>
        </group>
      </group>
    </>
  );
}

useGLTF.preload(MODEL_PATH);

export default function ModelViewer() {
  return (
    <ModelErrorBoundary>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Canvas
          camera={{ position: [0, 0, 6.2], fov: 36 }}
          gl={{
            antialias:           true,
            alpha:               true,
            powerPreference:     "high-performance",
            toneMapping:         THREE.NeutralToneMapping,
            toneMappingExposure: 1.8,
          }}
          onCreated={({ gl }) => {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          }}
        >
          <Suspense fallback={null}>
            <CameraScene />
          </Suspense>
        </Canvas>
      </div>
    </ModelErrorBoundary>
  );
}
