import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Fix: Next.js doesn't set Content-Type for .bin files by default,
        // causing GLTFLoader to silently fail when fetching scene.bin buffers.
        source: "/:path*.bin",
        headers: [{ key: "Content-Type", value: "application/octet-stream" }],
      },
      {
        source: "/:path*.glb",
        headers: [{ key: "Content-Type", value: "model/gltf-binary" }],
      },
      {
        source: "/:path*.gltf",
        headers: [{ key: "Content-Type", value: "model/gltf+json" }],
      },
    ];
  },
};

export default nextConfig;
