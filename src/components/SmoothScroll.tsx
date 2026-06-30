"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    // Store reference so the same function can be removed on cleanup
    const rafFn = (time: number) => { lenis.raf(time * 1000); };
    gsap.ticker.add(rafFn);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      lenis.destroy();
      gsap.ticker.remove(rafFn);
    };
  }, []);

  return <>{children}</>;
}
