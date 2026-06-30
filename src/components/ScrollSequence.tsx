"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { FrameArrays } from "./Loader";

gsap.registerPlugin(ScrollTrigger);

// ── Phase boundaries (fraction of 0→1 global progress) ───────────────
// Container: 1200vh total
// Phase 1 · hero frames  : 0–200vh   → 0 to 200/1200 = 1/6
// Phase 2 · sensor frames: 200–900vh → 1/6 to 3/4
// Phase 3 · specs frames : 900–1200vh→ 3/4 to 1.0
//
// Phase 2 is subdivided into 7 equal 100vh segments:
//   seg 0 (200–300vh)  : rotate frames 0→30
//   seg 1 (300–400vh)  : MILESTONE 1 — HOLD frame 30
//   seg 2 (400–500vh)  : rotate frames 31→60
//   seg 3 (500–600vh)  : MILESTONE 2 — HOLD frame 60
//   seg 4 (600–700vh)  : rotate frames 61→90
//   seg 5 (700–800vh)  : MILESTONE 3 — HOLD frame 90
//   seg 6 (800–900vh)  : rotate frames 91→99
const P1 = 1 / 6;   // ≈ 0.1667 — hero→sensor crossfade starts
const P2 = 3 / 4;   //  = 0.75  — sensor→specs crossfade starts
const XF = 0.038;   // crossfade half-window — wider for a softer blend

// Per-segment [firstFrame, lastFrame] (out of 0–99 index)
const SEG_FRAMES: [number, number][] = [
  [0,  30], // seg 0: rotate
  [30, 30], // seg 1: HOLD
  [31, 60], // seg 2: rotate
  [60, 60], // seg 3: HOLD
  [61, 90], // seg 4: rotate
  [90, 90], // seg 5: HOLD
  [91, 99], // seg 6: rotate to end
];
const N_SEGS = SEG_FRAMES.length; // 7

// Convert global progress → normalised sensor frame position (0→1).
// The milestone HOLD segments freeze the frame regardless of scroll position.
//
// IMPORTANT: clamp local to [0, 1] before doing segment math.
//   local < 0 (crossfade zone before sensor phase): return 0 → frame 0
//   local > 1 (crossfade zone after sensor phase):  return 1 → frame 99
// Without this, negative local produces a non-zero frac that maps to a
// mid-sequence frame, causing the camera to play backwards at crossfade edges.
function sensorFrameT(globalP: number): number {
  const local = (globalP - P1) / (P2 - P1); // raw 0→1 within sensor phase
  if (local <= 0) return 0;  // before/during hero crossfade — hold at frame 0
  if (local >= 1) return 1;  // after sensor phase — hold at frame 99

  const seg  = local * N_SEGS;
  const idx  = Math.min(Math.floor(seg), N_SEGS - 1);
  const frac = seg - Math.floor(seg);

  const [fromF, toF] = SEG_FRAMES[idx];
  const isHold = fromF === toF;
  const frameIdx = fromF + (isHold ? 0 : (toF - fromF) * frac);
  return frameIdx / 99;
}

interface Props {
  triggerRef: React.RefObject<HTMLElement | null>;
  frames: FrameArrays;
}

export default function ScrollSequence({ triggerRef, frames }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas  = canvasRef.current;
    const trigger = triggerRef.current;
    if (!canvas || !trigger) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let progress = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = Math.round(window.innerWidth  * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width  = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    };

    const clamp = (v: number) => Math.max(0, Math.min(1, v));

    const pick = (arr: ImageBitmap[], t: number): ImageBitmap =>
      arr[Math.min(arr.length - 1, Math.floor(clamp(t) * arr.length))];

    const drawImg = (img: ImageBitmap, alpha: number) => {
      if (!img || !img.width) return;
      const W = window.innerWidth, H = window.innerHeight;
      const s  = Math.max(W / img.width, H / img.height);
      const dw = img.width * s, dh = img.height * s;
      ctx.save();
      ctx.globalAlpha = clamp(alpha);
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.restore();
    };

    const render = () => {
      const p = progress;
      const W = window.innerWidth, H = window.innerHeight;

      ctx.fillStyle = "#000000"; // pristine black for sensor milestone contrast
      ctx.fillRect(0, 0, W, H);

      if (p < P1 - XF) {
        // ── Phase 1 only: hero ─────────────────────────────────
        drawImg(pick(frames.hero, p / P1), 1);

      } else if (p < P1 + XF) {
        // ── Crossfade: hero → sensor ───────────────────────────
        const blend = clamp((p - (P1 - XF)) / (XF * 2));
        drawImg(pick(frames.hero,   p / P1),           1 - blend);
        drawImg(pick(frames.sensor, sensorFrameT(p)),  blend);

      } else if (p < P2 - XF) {
        // ── Phase 2: sensor (milestone-aware frame mapping) ────
        drawImg(pick(frames.sensor, sensorFrameT(p)), 1);

      } else if (p < P2 + XF) {
        // ── Crossfade: sensor → specs ──────────────────────────
        const blend = clamp((p - (P2 - XF)) / (XF * 2));
        drawImg(pick(frames.sensor, sensorFrameT(p)),            1 - blend);
        drawImg(pick(frames.specs,  (p - P2) / (1 - P2)), blend);

      } else {
        // ── Phase 3 only: specs ────────────────────────────────
        drawImg(pick(frames.specs, (p - P2) / (1 - P2)), 1);
      }
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const st = ScrollTrigger.create({
      trigger,
      start: "top top",
      end:   "bottom bottom",
      scrub: true,   // track instantly — Lenis lerp already provides smoothing
      onUpdate(self) {
        progress = self.progress;
        render();
      },
    });

    return () => {
      st.kill();
      window.removeEventListener("resize", resize);
    };
  }, [triggerRef, frames]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, display: "block" }}
    />
  );
}
