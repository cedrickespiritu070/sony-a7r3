"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import CameraModel from "./CameraModel";
import ModelErrorBoundary from "./ModelErrorBoundary";

interface Props {
  scrollRef: React.RefObject<HTMLElement | null>;
}

function LoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1.4, 0.9, 0.6]} />
      <meshStandardMaterial color="#111" roughness={0.8} metalness={0.2} />
    </mesh>
  );
}

export default function CanvasContainer({ scrollRef }: Props) {
  return (
    <ModelErrorBoundary>
      <div className="absolute inset-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 7], fov: 40 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.NeutralToneMapping,
            toneMappingExposure: 1.8,
          }}
          onCreated={({ gl, scene }) => {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

            // Synthetic IBL — no external fetch, proper metallic reflections
            const pmrem = new THREE.PMREMGenerator(gl);
            pmrem.compileEquirectangularShader();
            scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
            pmrem.dispose();

            const canvas = gl.domElement;
            canvas.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              console.warn("[Canvas] WebGL context lost");
            });
            canvas.addEventListener("webglcontextrestored", () => {
              gl.setSize(canvas.clientWidth, canvas.clientHeight);
            });
          }}
        >
          <Suspense fallback={<LoadingPlaceholder />}>
            <CameraModel scrollRef={scrollRef} />
          </Suspense>
        </Canvas>
      </div>
    </ModelErrorBoundary>
  );
}
