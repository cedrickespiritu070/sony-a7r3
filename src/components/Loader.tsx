"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const SEQS = [
  { dir: "hero",   count: 100 },
  { dir: "sensor", count: 100 },
  { dir: "specs",  count: 100 },
] as const;

const TOTAL     = SEQS.reduce((a, s) => a + s.count, 0);
const RING_R    = 20;
const RING_CIRC = 2 * Math.PI * RING_R; // ≈ 125.66

export type FrameArrays = {
  hero:   ImageBitmap[];
  sensor: ImageBitmap[];
  specs:  ImageBitmap[];
};

interface Props {
  onComplete: (frames: FrameArrays) => void;
}

function frameSrc(dir: string, i: number) {
  return `/frames/${dir}/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;
}

export default function Loader({ onComplete }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const numRef     = useRef<HTMLSpanElement>(null);
  const lineRef    = useRef<HTMLDivElement>(null);
  const ringRef    = useRef<SVGCircleElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const display = { val: 0 };
    let loaded  = 0;
    let exiting = false;

    const raw: { hero: HTMLImageElement[]; sensor: HTMLImageElement[]; specs: HTMLImageElement[] } = {
      hero:   new Array(100),
      sensor: new Array(100),
      specs:  new Array(100),
    };

    const setNum = (v: number) => {
      const n = Math.round(v);
      if (numRef.current)  numRef.current.textContent = String(n).padStart(2, "0");
      if (lineRef.current) lineRef.current.style.transform = `scaleX(${n / 100})`;
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(RING_CIRC * (1 - n / 100));
      }
    };

    const tweenTo = (target: number, dur: number, cb?: () => void) =>
      gsap.to(display, {
        val: target, duration: dur, ease: "power2.out", overwrite: "auto",
        onUpdate: () => setNum(display.val),
        onComplete: cb,
      });

    const exit = (bitmaps: FrameArrays) => {
      if (exiting) return;
      exiting = true;
      tweenTo(100, 0.3, () => {
        setTimeout(() => {
          gsap.to(overlayRef.current, {
            opacity: 0, duration: 0.85, ease: "power3.inOut",
            onComplete: () => { setVisible(false); onComplete(bitmaps); },
          });
        }, 160);
      });
    };

    const onDone = () => {
      loaded++;
      const pct = Math.round((loaded / TOTAL) * 85);
      if (!exiting) tweenTo(pct, 0.2);

      if (loaded === TOTAL) {
        tweenTo(85, 0.1, async () => {
          try {
            const toBitmaps = (imgs: HTMLImageElement[]) =>
              Promise.all(imgs.map((img) =>
                img.naturalWidth
                  ? createImageBitmap(img)
                  : Promise.resolve(null as unknown as ImageBitmap)
              ));
            tweenTo(93, 0.4);
            const [hero, sensor, specs] = await Promise.all([
              toBitmaps(raw.hero),
              toBitmaps(raw.sensor),
              toBitmaps(raw.specs),
            ]);
            exit({ hero, sensor, specs });
          } catch {
            exit(raw as unknown as FrameArrays);
          }
        });
      }
    };

    SEQS.forEach(({ dir, count }) => {
      const key = dir as keyof typeof raw;
      for (let i = 0; i < count; i++) {
        const img = new Image();
        img.src      = frameSrc(dir, i + 1);
        raw[key][i]  = img;
        img.onload   = onDone;
        img.onerror  = onDone;
      }
    });

    tweenTo(4, 0.5);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed", inset: 0,
        background: "#0c0c0c",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(1.5rem, 3vh, 2.5rem)",
      }}
    >
      {/* Top-left brand */}
      <p style={{
        position: "absolute",
        top: "clamp(1.5rem, 4vh, 2.5rem)",
        left: "clamp(1.5rem, 6vw, 4rem)",
        fontFamily: "var(--font-mono), monospace",
        fontSize: "0.5rem",
        letterSpacing: "0.38em",
        color: "rgba(255,255,255,0.18)",
        textTransform: "uppercase",
      }}>Sony α7R III</p>

      {/* Top-right: model code */}
      <p style={{
        position: "absolute",
        top: "clamp(1.5rem, 4vh, 2.5rem)",
        right: "clamp(1.5rem, 6vw, 4rem)",
        fontFamily: "var(--font-mono), monospace",
        fontSize: "0.5rem",
        letterSpacing: "0.28em",
        color: "rgba(255,255,255,0.1)",
        textTransform: "uppercase",
      }}>ILCE-7RM3A</p>

      {/* ── Camera SVG icon ── */}
      <div style={{ width: "clamp(200px, 30vw, 300px)", position: "relative" }}>
        {/* Subtle lens glow behind SVG */}
        <div style={{
          position: "absolute",
          top: "58%", left: "39%",
          transform: "translate(-50%, -50%)",
          width: "clamp(80px, 12vw, 120px)",
          height: "clamp(80px, 12vw, 120px)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(43,141,255,0.18) 0%, transparent 70%)",
          animation: "loaderLensGlow 2.6s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        <svg
          viewBox="0 0 120 86"
          width="100%"
          height="auto"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* ── Camera body ── */}
          <rect
            x="1" y="19" width="118" height="66" rx="5"
            stroke="rgba(255,255,255,0.3)" strokeWidth="1"
          />
          {/* Inner body shadow line */}
          <rect
            x="4" y="22" width="112" height="60" rx="4"
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"
          />

          {/* ── Viewfinder hump (top left) ── */}
          <rect
            x="11" y="9" width="32" height="12" rx="3"
            stroke="rgba(255,255,255,0.28)" strokeWidth="1"
          />
          {/* Viewfinder glass */}
          <rect
            x="14" y="12" width="26" height="7" rx="2"
            stroke="rgba(43,141,255,0.25)" strokeWidth="0.8"
            fill="rgba(43,141,255,0.03)"
          />

          {/* ── Mode dial (top right area) ── */}
          <circle cx="90" cy="20" r="8"
            stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"
          />
          <circle cx="90" cy="20" r="4"
            stroke="rgba(255,255,255,0.1)" strokeWidth="0.6"
          />
          {/* Dial tick marks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x1  = 90 + Math.cos(rad) * 6;
            const y1  = 20 + Math.sin(rad) * 6;
            const x2  = 90 + Math.cos(rad) * 8;
            const y2  = 20 + Math.sin(rad) * 8;
            return (
              <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.12)" strokeWidth="0.6"
              />
            );
          })}

          {/* ── Shutter button ── */}
          <circle cx="58" cy="11" r="4"
            stroke="rgba(255,255,255,0.22)" strokeWidth="0.8"
          />
          <circle cx="58" cy="11" r="2"
            fill="rgba(255,255,255,0.08)" strokeWidth="0"
          />

          {/* ── Grip detail (right side) ── */}
          {[108, 112, 116].map((x) => (
            <line key={x} x1={x} y1="26" x2={x} y2="80"
              stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"
            />
          ))}

          {/* ── Control buttons (right of lens area) ── */}
          {[36, 46, 56, 66].map((y) => (
            <circle key={y} cx="98" cy={y} r="2.2"
              stroke="rgba(255,255,255,0.12)" strokeWidth="0.7"
            />
          ))}

          {/* ══ Lens system (cx=46, cy=52) ══ */}

          {/* Outermost shadow ring */}
          <circle cx="46" cy="52" r="26"
            stroke="rgba(0,0,0,0.4)" strokeWidth="1"
          />
          {/* Lens mount collar */}
          <circle cx="46" cy="52" r="24"
            stroke="rgba(255,255,255,0.18)" strokeWidth="1"
          />
          {/* Lens bezel */}
          <circle cx="46" cy="52" r="22"
            stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"
          />

          {/* Progress fill arc (starts empty at top, fills clockwise) */}
          <circle
            ref={ringRef}
            cx="46" cy="52" r={RING_R}
            stroke="rgba(43,141,255,0.9)"
            strokeWidth="1.6"
            strokeDasharray={String(RING_CIRC)}
            strokeDashoffset={String(RING_CIRC)}
            style={{
              transformOrigin: "46px 52px",
              transform: "rotate(-90deg)",
              transition: "none",
            }}
          />

          {/* Spinning aperture blade ring */}
          <circle
            cx="46" cy="52" r="16"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="0.8"
            strokeDasharray="2.8 5.5"
            className="loader-aperture-spin"
            style={{ transformOrigin: "46px 52px" }}
          />

          {/* Counter-spin ring (slower) */}
          <circle
            cx="46" cy="52" r="13"
            stroke="rgba(43,141,255,0.08)"
            strokeWidth="0.6"
            strokeDasharray="4 4"
            className="loader-aperture-spin-rev"
            style={{ transformOrigin: "46px 52px" }}
          />

          {/* Inner lens glass */}
          <circle cx="46" cy="52" r="11"
            stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"
          />
          <circle cx="46" cy="52" r="7"
            stroke="rgba(255,255,255,0.06)" strokeWidth="0.6"
            fill="rgba(255,255,255,0.015)"
          />

          {/* Lens center dot — accent */}
          <circle cx="46" cy="52" r="2.8"
            fill="rgba(43,141,255,0.95)" strokeWidth="0"
          />

          {/* Lens glare highlight */}
          <ellipse cx="41" cy="47" rx="2.8" ry="1.5"
            fill="rgba(255,255,255,0.07)" strokeWidth="0"
            transform="rotate(-40 41 47)"
          />
        </svg>
      </div>

      {/* ── Progress readout ── */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          display: "flex", alignItems: "baseline",
          justifyContent: "center", gap: "0.35rem",
        }}>
          <span
            ref={numRef}
            style={{
              fontFamily: "var(--font-display), sans-serif",
              fontSize: "clamp(2.4rem, 5.5vw, 5rem)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              color: "#fff",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >00</span>
          <span style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.08em",
          }}>%</span>
        </div>
        <p style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.44rem",
          letterSpacing: "0.32em",
          color: "rgba(255,255,255,0.16)",
          textTransform: "uppercase",
          marginTop: "0.55rem",
        }}>ILCE-7RM3A · Loading frame sequence</p>
      </div>

      {/* ── Bottom progress line ── */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: "1px",
        background: "rgba(255,255,255,0.04)",
      }}>
        <div
          ref={lineRef}
          style={{
            height: "100%",
            background: "rgba(43,141,255,0.55)",
            transformOrigin: "left center",
            transform: "scaleX(0)",
          }}
        />
      </div>
    </div>
  );
}
