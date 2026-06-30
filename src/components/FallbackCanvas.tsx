"use client";

import { Canvas } from "@react-three/fiber";
import FallbackMesh from "./FallbackMesh";

export default function FallbackCanvas() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <FallbackMesh />
      </Canvas>
    </div>
  );
}
