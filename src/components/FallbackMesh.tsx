"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

export default function FallbackMesh() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.15;
    }
  });

  return (
    <>
      <Environment preset="studio" />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      <group ref={groupRef}>
        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[2.4, 1.6, 1.0]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Grip */}
        <mesh position={[-1.3, -0.3, 0]} castShadow>
          <boxGeometry args={[0.6, 1.1, 0.9]} />
          <meshStandardMaterial color="#111" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Lens mount */}
        <mesh position={[0.2, 0, 0.55]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.15, 40]} />
          <meshStandardMaterial color="#0a0a0a" metalness={1} roughness={0.1} />
        </mesh>
        {/* Lens barrel */}
        <mesh position={[0.2, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.48, 1.2, 40]} />
          <meshStandardMaterial color="#161616" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Gold accent ring */}
        <mesh position={[0.2, 0, 0.72]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.015, 12, 40]} />
          <meshStandardMaterial color="#c8a96e" metalness={1} roughness={0.1} />
        </mesh>
      </group>
    </>
  );
}
