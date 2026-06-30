"use client";

import { useState, useRef, useEffect, useCallback, CSSProperties } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SmoothScroll from "@/components/SmoothScroll";
import Loader, { type FrameArrays } from "@/components/Loader";
import ScrollSequence from "@/components/ScrollSequence";
import SensorCallouts from "@/components/SensorCallouts";
import SplitReveal from "@/components/SplitReveal";
import { modelScroll } from "@/components/ModelViewer";

gsap.registerPlugin(ScrollTrigger);

// Three.js bundle stays code-split from the main page
const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => null,
});

// ── Spec data ────────────────────────────────────────────────────────
const SENSOR_SPECS = [
  { label: "Sensor Type",    value: "Back-Illuminated CMOS" },
  { label: "Format",         value: "35mm Full-Frame" },
  { label: "Resolution",     value: "61.0 Megapixels",           gold: true },
  { label: "Color Depth",    value: "14-bit RAW" },
  { label: "ISO Range",      value: "100 – 32000" },
  { label: "ISO Extended",   value: "50 – 102400" },
];

const AF_SPECS = [
  { label: "PDAF Points",  value: "693",           gold: true },
  { label: "CDAF Points",  value: "425" },
  { label: "AF Coverage",  value: "93% of Frame" },
  { label: "Eye AF",       value: "Human & Animal" },
  { label: "Lock Time",    value: "~0.02 seconds",  gold: true },
];

const BUILD_SPECS = [
  { label: "Chassis",      value: "Magnesium Alloy" },
  { label: "Sealing",      value: "Dust & Moisture" },
  { label: "Card Slots",   value: "Dual SD (UHS-II / UHS-I)" },
  { label: "Viewfinder",   value: "0.5″ OLED · 3.69M-dot" },
  { label: "Weight",       value: "650g / 22.9 oz" },
];

const IMAGING_SPECS = [
  { label: "Output",         value: "9504 × 6336 px",            gold: true },
  { label: "Pixel Pitch",    value: "3.76 μm" },
  { label: "Dynamic Range",  value: "~15 stops" },
  { label: "Color Space",    value: "sRGB · AdobeRGB · DCI-P3" },
  { label: "File Formats",   value: "RAW / JPEG" },
];

const SPEED_SPECS = [
  { label: "Burst Rate",    value: "10 fps",                     gold: true },
  { label: "Buffer",        value: "241 RAW Frames" },
  { label: "Shutter",       value: "30s – 1/8000" },
  { label: "Video",         value: "4K 30p / 1080p 120fps" },
  { label: "Stabilisation", value: "5-axis IBIS" },
];

const FINAL_SPECS = [
  { label: "Body",          value: "ILCE-7RM3A" },
  { label: "Mount",         value: "Sony E-Mount" },
  { label: "Lens System",   value: "80+ Native FE Lenses" },
  { label: "Connectivity",  value: "USB 3.1 · Wi-Fi · BT 4.1" },
  { label: "Battery Life",  value: "530 Frames (EVF)" },
  { label: "Released",      value: "October 2017" },
];

// ── Horizontal feature panels (DJI-style) ───────────────────────────
const H_PANELS = [
  {
    num:      "61",
    unit:     "MP",
    headline: "The Sensor",
    body:     "Sixty-one megapixels of back-illuminated silicon. Enough latitude to crop hard, reframe in post, and still deliver print-ready files — with 14-bit colour depth intact at native ISO 32000.",
    specs:    IMAGING_SPECS.slice(0, 4),
    accent:   "#2b8dff",
  },
  {
    num:      "693",
    unit:     "PDAF",
    headline: "Autofocus",
    body:     "693 phase-detection points blanket 93% of the frame, reading contrast and phase simultaneously. Eye AF reacquires in 0.02 seconds — the system focuses before you consciously decide to shoot.",
    specs:    AF_SPECS.slice(0, 4),
    accent:   "#2b8dff",
  },
  {
    num:      "10",
    unit:     "fps",
    headline: "Speed",
    body:     "Ten frames per second, entirely blackout-free. A 241-frame RAW buffer lets you own the sequence rather than guess at the moment. Silent electronic shutter keeps the camera from announcing itself.",
    specs:    SPEED_SPECS.slice(0, 4),
    accent:   "#2b8dff",
  },
];

// ── Constants ────────────────────────────────────────────────────────
const PAD   = "clamp(2rem, 8vw, 8rem)";
const N_SZ  = "clamp(9rem, 20vw, 24rem)";
const H2_SZ = "clamp(3.5rem, 8vw, 9rem)";

// ── CountUp ─────────────────────────────────────────────────────────
function CountUp({
  value,
  style,
  dur = 1.8,
}: {
  value: number;
  style?: CSSProperties;
  dur?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { v: 0 };
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
    tl.to(obj, {
      v: value,
      duration: dur,
      ease: "power2.out",
      onUpdate() { el.textContent = String(Math.round(obj.v)); },
    });
    return () => { tl.kill(); };
  }, [value, dur]);

  return <span ref={ref} style={style}>0</span>;
}

// ── SpecRow ──────────────────────────────────────────────────────────
// SpecRow: no per-row ScrollTrigger. A single batch in the main
// useEffect handles all spec rows together — avoids 30+ ST instances.
function SpecRow({ label, value, gold, i = 0 }: {
  label: string; value: string; gold?: boolean; i?: number;
}) {
  return (
    <div
      className="spec-row"
      data-spec-row
      data-spec-dir={i % 2 === 0 ? "-1" : "1"}
      data-spec-delay={String(i * 0.05)}
    >
      <span className="label-dim">{label}</span>
      <span className="data" style={gold ? { color: "var(--accent)" } : {}}>
        {value}
      </span>
    </div>
  );
}

// ── Fog ─────────────────────────────────────────────────────────────
function Fog({ dir }: { dir: "left" | "right" | "center" }) {
  const bg =
    dir === "left"
      ? "linear-gradient(90deg, rgba(0,0,0,0.56) 0%, rgba(0,0,0,0.22) 46%, transparent 66%)"
      : dir === "right"
      ? "linear-gradient(270deg, rgba(0,0,0,0.56) 0%, rgba(0,0,0,0.22) 46%, transparent 66%)"
      : "radial-gradient(ellipse 70% 80% at 50% 50%, transparent 25%, rgba(0,0,0,0.6) 100%)";
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, pointerEvents: "none" }} />
  );
}

// ── Main page ────────────────────────────────────────────────────────
export default function Home() {
  const [frames, setFrames]    = useState<FrameArrays | null>(null);
  const containerRef           = useRef<HTMLDivElement>(null);   // 700vh scroll
  const hScrollRef             = useRef<HTMLDivElement>(null);   // horizontal pin wrapper
  const hTrackRef              = useRef<HTMLDivElement>(null);   // horizontal slide track
  const modelSectionRef        = useRef<HTMLDivElement>(null);   // 3d model section
  const modelPhase0Ref         = useRef<HTMLDivElement>(null);
  const modelPhase1Ref         = useRef<HTMLDivElement>(null);
  const modelPhase2Ref         = useRef<HTMLDivElement>(null);
  const modelProgressRef       = useRef<HTMLDivElement>(null);
  const modelCrosshairRef      = useRef<HTMLDivElement>(null);
  const modelTelemetryRef      = useRef<HTMLDivElement>(null);
  const canvasWrapRef          = useRef<HTMLDivElement>(null);
  const cursorRef              = useRef<HTMLDivElement>(null);
  const scrollFillRef          = useRef<HTMLDivElement>(null);

  const handleLoaderComplete = useCallback((f: FrameArrays) => {
    setFrames(f);
  }, []);

  // ── Custom cursor ────────────────────────────────────────────────
  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX - 3.5}px, ${e.clientY - 3.5}px)`;
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // ── All GSAP after loader ────────────────────────────────────────
  useEffect(() => {
    if (!frames) return;

    // Pre-set all scroll-animated elements to their initial invisible state
    // immediately — before any ScrollTrigger runs — so there is no opacity
    // flash when a batch fires on first scroll.
    gsap.set("[data-blur]",     { opacity: 0, y: 20 });
    gsap.set("[data-spec-row]", { opacity: 0 });

    // Allow DOM to paint before measuring
    const t = setTimeout(() => {
      ScrollTrigger.refresh();

      // Scroll progress fill
      const fill = scrollFillRef.current;
      ScrollTrigger.create({
        start: "top top",
        end:   "bottom bottom",
        onUpdate(self) {
          if (fill) fill.style.height = `${self.progress * 100}%`;
        },
      });

      // ── Hero section: fade out as it exits the viewport ────────
      // Fade starts once the hero is ~50% scrolled past, finishes
      // just as the §2 section begins entering.
      const heroSection = document.querySelector<HTMLElement>("[data-hero-section]");
      if (heroSection && containerRef.current) {
        gsap.to(heroSection, {
          opacity: 0,
          ease: "power2.in",
          scrollTrigger: {
            trigger: containerRef.current,
            start:   "5% top",    // 60vh into scroll
            end:     "9% top",    // 108vh — hero fully past viewport
            scrub:   0.6,
          },
        });
      }

      // ── §2 Sensor Architecture: fade out as it exits into canvas zone ──
      // Gives a smooth handoff from overlay text → pure canvas.
      const s2Section = document.querySelector<HTMLElement>("[data-s2-section]");
      if (s2Section && containerRef.current) {
        gsap.to(s2Section, {
          opacity: 0,
          y: -18,
          ease: "power2.in",
          scrollTrigger: {
            trigger: containerRef.current,
            start:   "11% top",   // 132vh — §2 starts to exit
            end:     "17% top",   // 204vh — fully in canvas zone
            scrub:   0.6,
          },
        });
      }

      // ── Blur-in reveals (batched → 1 ScrollTrigger vs N) ─────────
      // Use gsap.to (not from) because elements are pre-set to opacity:0
      // above — gsap.from would animate to the pre-set state (a no-op).
      ScrollTrigger.batch("[data-blur]", {
        onEnter(batch) {
          batch.forEach((el) => {
            const delay = Number((el as HTMLElement).dataset.blurDelay ?? 0);
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.85,
              delay,
              ease: "power3.out",
              overwrite: true,
            });
          });
        },
        start: "top 90%",
        once: true,
      });

      // ── Spec row reveals (batched) ─────────────────────────────
      ScrollTrigger.batch("[data-spec-row]", {
        onEnter(batch) {
          batch.forEach((el) => {
            const dir   = Number((el as HTMLElement).dataset.specDir ?? -1);
            const delay = Number((el as HTMLElement).dataset.specDelay ?? 0);
            gsap.fromTo(el,
              { x: dir * 16, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.5, delay, ease: "power3.out", overwrite: true },
            );
          });
        },
        start: "top 92%",
        once: true,
      });

      // ── Horizontal feature scroll (DJI showcase) ───────────────
      const hWrap   = hScrollRef.current;
      const hTrack  = hTrackRef.current;
      const isMobile = window.innerWidth < 768;
      if (hWrap && hTrack && !isMobile) {
        const panels = hTrack.querySelectorAll<HTMLElement>("[data-hpanel]");
        const dist   = hTrack.scrollWidth - window.innerWidth;

        const hST = gsap.to(hTrack, {
          x: () => -dist,
          ease: "none",
          scrollTrigger: {
            trigger:  hWrap,
            pin:      true,
            scrub:    1.2,
            end:      () => `+=${dist}`,
            invalidateOnRefresh: true,
          },
        });

        // Stagger panel content in as each panel enters
        panels.forEach((panel, pi) => {
          const items = panel.querySelectorAll("[data-pitem]");
          gsap.from(items, {
            opacity: 0,
            y: 30,
            stagger: 0.1,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger:        panel,
              containerAnimation: hST,
              start:          "left 85%",
              toggleActions:  "play none none none",
            },
          });
        });
      }

      // ── Model scroll rotation + phase overlays (400vh section) ──────
      const modelSec = modelSectionRef.current;
      if (modelSec) {
        const phases: [number, number][] = [
          [0.22, 0.47],
          [0.47, 0.72],
          [0.72, 0.96],
        ];
        const phaseEls = [
          modelPhase0Ref.current,
          modelPhase1Ref.current,
          modelPhase2Ref.current,
        ];

        ScrollTrigger.create({
          trigger:  modelSec,
          start:    "top bottom",
          end:      "bottom bottom",
          scrub:    true,
          onUpdate(self) {
            modelScroll.progress = self.progress;
            const p = self.progress;

            // Progress bar
            const prog = modelProgressRef.current;
            if (prog) {
              const w = Math.max(0, (p - 0.20) / 0.80 * 100);
              prog.style.width = `${Math.min(100, w)}%`;
            }

            // rawX: -1→+1 as model sweeps left↔right (one full sine cycle)
            const rawX = Math.sin(p * Math.PI * 2);

            // Crosshair tracks model horizontal drift
            const xhair = modelCrosshairRef.current;
            if (xhair) {
              const xPx = rawX * (window.innerWidth * 0.16);
              xhair.style.left = `calc(50% + ${xPx}px)`;
            }

            // Telemetry panel slides vertically (opposite to model drift)
            const telem = modelTelemetryRef.current;
            if (telem) {
              const tyPx = rawX * -22;
              telem.style.transform = `translateY(calc(-50% + ${tyPx}px))`;
            }

            // Phase overlays: fade + entry slide + vertical parallax
            phases.forEach(([pStart, pEnd], i) => {
              const el = phaseEls[i];
              if (!el) return;
              const local   = (p - pStart) / (pEnd - pStart);
              const fw      = 0.13;
              const fadeIn  = Math.max(0, Math.min(1, local / fw));
              const fadeOut = Math.max(0, Math.min(1, (1 - local) / fw));
              const vis     = fadeIn * fadeOut;
              // "bumababa" — slides down when model drifts right, up when left
              const yParallax = rawX * 16;
              const yEntry    = (1 - Math.min(fadeIn, 1)) * 12;
              el.style.opacity   = String(vis);
              el.style.transform = `translateY(${yEntry + yParallax}px)`;
            });
          },
        });
      }

      // ── Canvas zoom-out at end of 1200vh container ───────────────
      const cWrap = canvasWrapRef.current;
      if (cWrap && containerRef.current) {
        gsap.to(cWrap, {
          scale:           0.78,
          opacity:         0,
          transformOrigin: "center center",
          ease:            "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start:   "86% top",
            end:     "100% top",
            scrub:   1.5,
          },
        });
      }

      // ── Horizontal panels zoom-in entrance ───────────────────────
      if (hScrollRef.current) {
        gsap.from(hScrollRef.current, {
          scale:           0.86,
          opacity:         0,
          transformOrigin: "center center",
          ease:            "none",
          scrollTrigger: {
            trigger: hScrollRef.current,
            start:   "top 92%",
            end:     "top 10%",
            scrub:   1.8,
          },
        });
      }

      // ── Model section sticky zoom-in entrance ────────────────────
      const modelSticky = modelSectionRef.current?.querySelector<HTMLElement>("[data-model-sticky]");
      if (modelSticky) {
        gsap.from(modelSticky, {
          scale:           0.86,
          opacity:         0,
          transformOrigin: "center center",
          ease:            "none",
          scrollTrigger: {
            trigger: modelSectionRef.current!,
            start:   "top 90%",
            end:     "top 5%",
            scrub:   2,
          },
        });
      }

      // ── §9 Build section zoom-in ──────────────────────────────────
      const build9 = document.querySelector<HTMLElement>("[data-build-section]");
      if (build9) {
        gsap.from(build9, {
          scale:           0.88,
          opacity:         0,
          transformOrigin: "center center",
          ease:            "none",
          scrollTrigger: {
            trigger: build9,
            start:   "top 88%",
            end:     "top 15%",
            scrub:   1.8,
          },
        });
      }

    }, 80);

    return () => {
      clearTimeout(t);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [frames]);

  // ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Loader onComplete={handleLoaderComplete} />

      <div id="cursor" ref={cursorRef} />

      {frames && (
        <SmoothScroll>
          <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

            {/* ── Fixed nav ──────────────────────────────────── */}
            <nav style={{
              position: "fixed", top: 0, left: 0, right: 0,
              zIndex: 50,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: `clamp(1.2rem, 3vw, 2rem) ${PAD}`,
              pointerEvents: "none",
            }}>
              <span style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.52rem", letterSpacing: "0.42em",
                color: "rgba(255,255,255,0.38)", textTransform: "uppercase",
              }}>
                Sony α
              </span>
              <span style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.48rem", letterSpacing: "0.38em",
                color: "rgba(255,255,255,0.18)", textTransform: "uppercase",
              }}>
                α7R III
              </span>
            </nav>

            {/* ── Scroll progress ────────────────────────────── */}
            <div style={{
              position: "fixed",
              right: "clamp(14px, 3.5vw, 36px)",
              top: "50%", transform: "translateY(-50%)",
              zIndex: 50,
            }}>
              <div style={{
                width: "1px", height: "72px",
                background: "rgba(255,255,255,0.08)",
                position: "relative", overflow: "hidden",
              }}>
                <div ref={scrollFillRef} style={{
                  position: "absolute", top: 0, left: 0,
                  width: "100%", height: "0%",
                  background: "var(--accent)",
                  transition: "height 0.1s linear",
                }} />
              </div>
            </div>

            {/* ══════════════════════════════════════════════════
                1200 vh FRAME SEQUENCE SCROLL JOURNEY
                Phase 1 (hero):    0– 200vh
                Phase 2 (sensor): 200– 900vh  ← 7 × 100vh segments
                  seg 0: rotate frames  0→30    (200–300vh)
                  seg 1: MILESTONE 1 hold @30   (300–400vh)
                  seg 2: rotate frames 31→60    (400–500vh)
                  seg 3: MILESTONE 2 hold @60   (500–600vh)
                  seg 4: rotate frames 61→90    (600–700vh)
                  seg 5: MILESTONE 3 hold @90   (700–800vh)
                  seg 6: rotate frames 91→99    (800–900vh)
                Phase 3 (specs):  900–1200vh
                ══════════════════════════════════════════════════ */}
            <div ref={containerRef} style={{ position: "relative", height: "1200vh" }}>

              {/* Sticky canvas */}
              <div ref={canvasWrapRef} data-zoom-enter style={{
                position: "sticky", top: 0,
                height: "100vh", marginBottom: "-100vh",
                zIndex: 1, overflow: "hidden",
                transformOrigin: "center center",
              }}>
                <ScrollSequence
                  triggerRef={containerRef as React.RefObject<HTMLElement>}
                  frames={frames}
                />
                {/* Sensor callout annotations — appear during Phase 2 only */}
                <SensorCallouts
                  containerRef={containerRef as React.RefObject<HTMLElement>}
                />
                {/* Edge vignette */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2,
                  background: "radial-gradient(ellipse 80% 90% at 50% 50%, transparent 44%, rgba(0,0,0,0.6) 100%)",
                }} />
              </div>

              {/* ─── §1 · Hero (pure CSS — no GSAP) ────────── */}
              <section data-hero-section style={{
                position: "relative", height: "100vh",
                display: "flex", alignItems: "center", zIndex: 5,
                willChange: "opacity",
              }}>
                <Fog dir="left" />

                {/* Corner markers — top-left / bottom-right */}
                <div style={{
                  position: "absolute",
                  top: "clamp(1.8rem,4vw,4rem)", left: "clamp(1.8rem,5vw,5rem)",
                  width: 28, height: 28,
                  borderTop: "1px solid rgba(43,141,255,0.35)",
                  borderLeft: "1px solid rgba(43,141,255,0.35)",
                  animation: "heroFadeUp 0.6s ease 1.2s both",
                  zIndex: 2,
                }} />
                <div style={{
                  position: "absolute",
                  bottom: "clamp(1.8rem,4vw,4rem)", right: "clamp(1.8rem,5vw,5rem)",
                  width: 28, height: 28,
                  borderBottom: "1px solid rgba(43,141,255,0.35)",
                  borderRight: "1px solid rgba(43,141,255,0.35)",
                  animation: "heroFadeUp 0.6s ease 1.2s both",
                  zIndex: 2,
                }} />

                <div style={{ paddingLeft: PAD, position: "relative", zIndex: 1 }}>

                  {/* Label */}
                  <p className="label hero-anim-1" style={{ marginBottom: "1.8rem" }}>
                    Full-Frame Mirrorless · ILCE-7RM3A
                  </p>

                  {/* Main title — huge, static, CSS animated */}
                  <h1
                    className="hero-anim-2"
                    style={{
                      fontFamily: "var(--font-display), sans-serif",
                      fontSize: "clamp(5rem,16vw,18rem)",
                      fontWeight: 700,
                      letterSpacing: "-0.05em",
                      lineHeight: 0.88,
                      color: "#fff",
                      whiteSpace: "nowrap",
                      marginBottom: "2rem",
                    }}
                  >
                    α7R <span style={{ color: "var(--accent)" }}>III</span>
                  </h1>

                  {/* Divider lines */}
                  <div className="hero-anim-3" style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    marginBottom: "1.8rem",
                  }}>
                    <div className="hero-line" style={{
                      height: 1, background: "rgba(255,255,255,0.1)",
                      width: "clamp(5rem,14vw,14rem)", flexShrink: 0,
                    }} />
                    <div className="hero-line" style={{
                      height: 1, background: "var(--accent)",
                      width: "2.5rem", flexShrink: 0,
                    }} />
                  </div>

                  {/* Static spec row */}
                  <div className="hero-anim-4" style={{ display: "flex", gap: "2rem", alignItems: "baseline", flexWrap: "wrap" }}>
                    {([["61","MP"],["693","PDAF"],["10","fps"],["~15","stops DR"]] as const).map(([n,u]) => (
                      <div key={u} style={{ display: "flex", alignItems: "baseline", gap: "0.28rem" }}>
                        <span style={{
                          fontFamily: "var(--font-display), sans-serif",
                          fontSize: "clamp(1.5rem,2.8vw,2.4rem)",
                          fontWeight: 700,
                          letterSpacing: "-0.04em",
                          color: "#fff",
                        }}>{n}</span>
                        <span className="label">{u}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scroll indicator */}
                <div className="hero-anim-4" style={{
                  position: "absolute",
                  bottom: "clamp(2rem,5vw,4rem)",
                  left: PAD, zIndex: 1,
                }}>
                  <p className="label-dim" style={{ letterSpacing: "0.3em", marginBottom: "0.6rem" }}>SCROLL</p>
                  <div style={{ width: 1, height: "2.8rem", background: "rgba(255,255,255,0.1)", position: "relative", overflow: "hidden" }}>
                    <div className="hero-scroll-pulse" />
                  </div>
                </div>
              </section>

              {/* ─── §2 · Sensor Architecture ──────────────── */}
              <section data-s2-section style={{
                position: "relative", height: "100vh",
                display: "flex", alignItems: "center", zIndex: 5,
                willChange: "opacity",
              }}>
                <Fog dir="left" />

                {/* Top decorative rule */}
                <div style={{
                  position: "absolute",
                  top: "clamp(5.5rem,10vh,7.5rem)",
                  left: PAD, right: 0,
                  height: 1, background: "var(--rule)",
                  zIndex: 2, pointerEvents: "none",
                }} />

                <div className="mob-grid-2col" style={{
                  paddingLeft: PAD, paddingRight: PAD,
                  width: "100%",
                  position: "relative", zIndex: 1,
                }}>

                  {/* Left: headline + 61 MP metric */}
                  <div>
                    <div data-blur style={{
                      display: "flex", alignItems: "center",
                      gap: "1.2rem", marginBottom: "2.2rem",
                    }}>
                      <div style={{
                        width: "clamp(1.5rem,2.5vw,2.5rem)", height: 1,
                        background: "var(--accent)", flexShrink: 0,
                      }} />
                      <p className="label-dim">01 — Sensor</p>
                    </div>

                    <SplitReveal
                      as="h2"
                      text="Exmor R"
                      style={{
                        fontFamily: "var(--font-display), sans-serif",
                        fontSize: "clamp(5rem, 13vw, 15rem)",
                        fontWeight: 700,
                        letterSpacing: "-0.045em",
                        lineHeight: 0.86,
                        marginBottom: "2.2rem",
                        display: "block",
                      }}
                    />

                    {/* Giant 61 MP metric */}
                    <div data-blur data-blur-delay="0.12" style={{
                      display: "flex", alignItems: "flex-end", gap: "0.8rem",
                    }}>
                      <span style={{
                        fontFamily: "var(--font-display), sans-serif",
                        fontSize: "clamp(4.5rem, 11vw, 13rem)",
                        fontWeight: 700, letterSpacing: "-0.05em",
                        lineHeight: 0.82, color: "#fff",
                      }}>61</span>
                      <div style={{ paddingBottom: "clamp(0.5rem, 1.2vw, 1rem)" }}>
                        <p className="label" style={{
                          fontSize: "clamp(0.7rem, 1.3vw, 1rem)",
                          marginBottom: "0.4rem",
                        }}>MP</p>
                        <p className="label-dim" style={{ letterSpacing: "0.14em" }}>Back-Illuminated</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: specs + pixel-shift callout */}
                  <div>
                    <div>
                      {SENSOR_SPECS.map((r, i) => <SpecRow key={r.label} {...r} i={i} />)}
                    </div>

                    {/* Pixel Shift callout box */}
                    <div data-blur data-blur-delay="0.28" style={{
                      marginTop: "1.8rem",
                      padding: "1.4rem 1.6rem",
                      border: "1px solid rgba(43,141,255,0.18)",
                      background: "rgba(43,141,255,0.035)",
                      position: "relative",
                    }}>
                      {/* Corner accent */}
                      <div style={{
                        position: "absolute", top: -1, left: -1,
                        width: 16, height: 16,
                        borderTop: "2px solid var(--accent)",
                        borderLeft: "2px solid var(--accent)",
                      }} />
                      <p className="label" style={{ marginBottom: "0.5rem" }}>
                        Pixel Shift Multi Shooting
                      </p>
                      <p style={{
                        fontFamily: "var(--font-display), sans-serif",
                        fontSize: "clamp(2rem, 4vw, 4.5rem)",
                        fontWeight: 700, letterSpacing: "-0.04em",
                        lineHeight: 1, color: "#fff", marginBottom: "0.35rem",
                      }}>169.6 MP</p>
                      <p className="label-dim">4-Shot Composite · Tripod Required</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ═══ SENSOR PHASE SCROLL SPACE: 700vh ═════════════════════
                  Seven 100vh segments. SensorCallouts handles all visuals.
                  Sections are intentionally empty — pure scroll architecture.
                  ═════════════════════════════════════════════════════════ */}

              {/* Sensor seg 0 — rotate frames 0→30   (200–300vh) */}
              <section style={{ position: "relative", height: "100vh", zIndex: 5, pointerEvents: "none" }} />

              {/* Sensor seg 1 — MILESTONE 1 hold @30  (300–400vh) */}
              <section style={{ position: "relative", height: "100vh", zIndex: 5, pointerEvents: "none" }} />

              {/* Sensor seg 2 — rotate frames 31→60  (400–500vh) */}
              <section style={{ position: "relative", height: "100vh", zIndex: 5, pointerEvents: "none" }} />

              {/* Sensor seg 3 — MILESTONE 2 hold @60  (500–600vh) */}
              <section style={{ position: "relative", height: "100vh", zIndex: 5, pointerEvents: "none" }} />

              {/* Sensor seg 4 — rotate frames 61→90  (600–700vh) */}
              <section style={{ position: "relative", height: "100vh", zIndex: 5, pointerEvents: "none" }} />

              {/* Sensor seg 5 — MILESTONE 3 hold @90  (700–800vh) */}
              <section style={{ position: "relative", height: "100vh", zIndex: 5, pointerEvents: "none" }} />

              {/* Sensor seg 6 — rotate frames 91→99  (800–900vh) */}
              <section style={{ position: "relative", height: "100vh", zIndex: 5, pointerEvents: "none" }} />

              {/* ─── §5 · Imaging Performance ───────────────── */}
              <section style={{
                position: "relative", height: "100vh",
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                zIndex: 5,
              }}>
                <Fog dir="right" />
                <div className="spec-col-right" style={{ position: "relative", zIndex: 1 }}>
                  <p data-blur className="label-dim" style={{ marginBottom: "2.5rem" }}>
                    02 — Image Quality
                  </p>
                  <SplitReveal
                    as="h2"
                    text="Raw Output"
                    className="serif"
                    style={{
                      fontSize: "clamp(3rem, 7vw, 8rem)",
                      fontWeight: 700,
                      lineHeight: 0.92,
                      marginBottom: "2.5rem",
                      display: "block",
                    }}
                  />
                  <div>
                    {IMAGING_SPECS.map((r, i) => <SpecRow key={r.label} {...r} i={i} />)}
                  </div>
                </div>
              </section>

              {/* ─── §6 · Speed ─────────────────────────────── */}
              <section style={{
                position: "relative", height: "100vh",
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                zIndex: 5,
              }}>
                <Fog dir="right" />
                <div className="spec-col-right" style={{ position: "relative", zIndex: 1 }}>
                  <p data-blur className="label-dim" style={{ marginBottom: "2.5rem" }}>
                    03 — Capture Speed
                  </p>

                  <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "baseline", gap: "1rem" }}>
                    <CountUp
                      value={10}
                      style={{
                        fontFamily: "var(--font-display), sans-serif",
                        fontSize: N_SZ,
                        fontWeight: 700,
                        letterSpacing: "-0.04em",
                        lineHeight: 0.82,
                      }}
                    />
                    <span data-blur className="label">fps</span>
                  </div>

                  <p data-blur className="label-dim" style={{ marginBottom: "2rem" }}>
                    Blackout-free continuous shooting
                  </p>
                  <div>
                    {SPEED_SPECS.map((r, i) => <SpecRow key={r.label} {...r} i={i} />)}
                  </div>
                </div>
              </section>

              {/* ─── §7 · Full Specification ─────────────────── */}
              <section style={{
                position: "relative", height: "100vh",
                display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
                zIndex: 5,
              }}>
                <Fog dir="right" />
                <div className="spec-col-right" style={{
                  paddingBottom: "clamp(3rem, 7vw, 7rem)",
                  position: "relative", zIndex: 1,
                }}>
                  <p data-blur className="label-dim" style={{ marginBottom: "2.5rem" }}>
                    04 — Specification
                  </p>
                  <SplitReveal
                    as="h2"
                    text={"Every number.\nAccounted for."}
                    className="serif"
                    style={{
                      fontSize: "clamp(2.5rem, 5.5vw, 6.5rem)",
                      fontWeight: 700,
                      lineHeight: 0.9,
                      marginBottom: "2.5rem",
                      display: "block",
                    }}
                    stagger={0.16}
                  />
                  <div>
                    {FINAL_SPECS.map((r, i) => <SpecRow key={r.label} {...r} i={i} />)}
                  </div>
                </div>
              </section>
            </div>
            {/* end 1200vh */}

            {/* ══════════════════════════════════════════════════
                HORIZONTAL FEATURE SCROLL (DJI showcase pattern)
                Pin the wrapper; slide the track leftward on scroll
                ══════════════════════════════════════════════════ */}
            <div
              ref={hScrollRef}
              style={{ overflow: "hidden", background: "var(--bg)" }}
            >
              <div
                ref={hTrackRef}
                className="hpanel-track"
                style={{ width: `${H_PANELS.length * 100}vw` }}
              >
                {H_PANELS.map((panel, pi) => (
                  <div
                    key={pi}
                    data-hpanel
                    style={{
                      width: "100vw",
                      height: "100vh",
                      flexShrink: 0,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    {/* Ambient radial glow */}
                    <div style={{
                      position: "absolute", inset: 0, pointerEvents: "none",
                      background: `radial-gradient(ellipse 60% 70% at ${pi === 0 ? "70%" : pi === 1 ? "50%" : "30%"} 50%, rgba(43,141,255,0.04) 0%, transparent 65%)`,
                    }} />

                    {/* Left: giant number */}
                    <div className="hpanel-left" style={{
                      paddingLeft: PAD,
                      width: "45%",
                      flexShrink: 0,
                      position: "relative", zIndex: 1,
                    }}>
                      <p data-pitem className="label-dim" style={{ marginBottom: "2rem", letterSpacing: "0.22em" }}>
                        {panel.headline.toUpperCase()}
                      </p>
                      <div data-pitem style={{ lineHeight: 0.82 }}>
                        <span
                          className="serif hpanel-number"
                          style={{
                            fontSize: "clamp(10rem, 22vw, 28rem)",
                            fontWeight: 700,
                            letterSpacing: "-0.04em",
                            display: "block",
                            color: "#fff",
                          }}
                        >
                          {panel.num}
                        </span>
                      </div>
                      <p data-pitem className="label" style={{ marginTop: "1.2rem" }}>
                        {panel.unit}
                      </p>
                    </div>

                    {/* Divider */}
                    <div data-pitem className="hpanel-divider" style={{
                      width: "1px", height: "40%",
                      background: "rgba(255,255,255,0.07)",
                      flexShrink: 0,
                      margin: "0 clamp(2rem, 5vw, 5rem)",
                    }} />

                    {/* Right: body + specs */}
                    <div data-pitem className="hpanel-right" style={{
                      flex: 1,
                      paddingRight: PAD,
                      position: "relative", zIndex: 1,
                    }}>
                      <p
                        className="serif"
                        style={{
                          fontSize: "clamp(1rem, 1.4vw, 1.5rem)",
                          fontWeight: 400,
                          color: "rgba(255,255,255,0.5)",
                          lineHeight: 1.65,
                          marginBottom: "2.5rem",
                          maxWidth: "28rem",
                        }}
                      >
                        {panel.body}
                      </p>
                      {panel.specs.map((r, i) => (
                        <div key={r.label} className="spec-row">
                          <span className="label-dim">{r.label}</span>
                          <span className="data" style={r.gold ? { color: "var(--accent)" } : {}}>
                            {r.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* end horizontal */}

            {/* ══════════════════════════════════════════════════
                §8 · 3D MODEL EXPLORE  (400vh — sticky inner)
                Scroll drives Y rotation + 3 phase overlay reveals.
                Phase 0 (0.22–0.47): Sensor specs, front/left view
                Phase 1 (0.47–0.72): AF specs, front/right view
                Phase 2 (0.72–0.96): Build specs, right/back view
                ══════════════════════════════════════════════════ */}
            <section
              ref={modelSectionRef}
              style={{
                position: "relative",
                height: "800vh",
                background: "var(--bg)",
              }}
            >
              <div data-model-sticky style={{
                position: "sticky", top: 0,
                height: "100vh", overflow: "hidden",
                transformOrigin: "center center",
              }}>
                <ModelViewer />

                {/* Ambient radial glow */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: "radial-gradient(ellipse 65% 75% at 50% 52%, rgba(43,141,255,0.07) 0%, transparent 60%)",
                }} />

                {/* Faint blue tech grid */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2,
                  opacity: 0.022,
                  backgroundImage: [
                    "linear-gradient(rgba(43,141,255,0.9) 1px, transparent 1px)",
                    "linear-gradient(90deg, rgba(43,141,255,0.9) 1px, transparent 1px)",
                  ].join(", "),
                  backgroundSize: "72px 72px",
                }} />

                {/* Giant α watermark */}
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-48%)",
                  zIndex: 2, pointerEvents: "none",
                  fontFamily: "var(--font-display), sans-serif",
                  fontSize: "clamp(14rem,32vw,38rem)",
                  fontWeight: 700, letterSpacing: "-0.06em",
                  color: "rgba(43,141,255,0.022)",
                  userSelect: "none", lineHeight: 1, whiteSpace: "nowrap",
                }}>α</div>

                {/* Thin scroll progress line */}
                <div ref={modelProgressRef} style={{
                  position: "absolute", top: 0, left: 0,
                  height: "1px", width: "0%",
                  background: "var(--accent)", opacity: 0.65,
                  zIndex: 20, pointerEvents: "none", transition: "none",
                }} />

                {/* Animated scan line */}
                <div className="model-scan-line" />

                {/* 4 corner markers */}
                <div style={{ position:"absolute", top:28, left:28, width:22, height:22, borderTop:"1px solid rgba(43,141,255,0.45)", borderLeft:"1px solid rgba(43,141,255,0.45)", zIndex:12, pointerEvents:"none" }} />
                <div style={{ position:"absolute", top:28, right:28, width:22, height:22, borderTop:"1px solid rgba(43,141,255,0.45)", borderRight:"1px solid rgba(43,141,255,0.45)", zIndex:12, pointerEvents:"none" }} />
                <div style={{ position:"absolute", bottom:28, left:28, width:22, height:22, borderBottom:"1px solid rgba(43,141,255,0.45)", borderLeft:"1px solid rgba(43,141,255,0.45)", zIndex:12, pointerEvents:"none" }} />
                <div style={{ position:"absolute", bottom:28, right:28, width:22, height:22, borderBottom:"1px solid rgba(43,141,255,0.45)", borderRight:"1px solid rgba(43,141,255,0.45)", zIndex:12, pointerEvents:"none" }} />

                {/* Section label — top left */}
                <div style={{
                  position: "absolute",
                  top: "clamp(2rem,5vw,4.5rem)", left: PAD,
                  zIndex: 10, pointerEvents: "none",
                }}>
                  <p className="label-dim" style={{ marginBottom: "0.7rem" }}>05 — Examine</p>
                  <p style={{
                    fontFamily: "var(--font-display), sans-serif",
                    fontSize: "clamp(1.8rem,4vw,4rem)",
                    fontWeight: 700, letterSpacing: "-0.03em",
                    color: "#fff", lineHeight: 1,
                  }}>α7R III</p>
                </div>

                {/* Phase labels — top right */}
                <div style={{
                  position: "absolute",
                  top: "clamp(2rem,5vw,4.5rem)", right: PAD,
                  zIndex: 10, pointerEvents: "none",
                  display: "flex", flexDirection: "column",
                  alignItems: "flex-end", gap: "0.55rem",
                }}>
                  {(["Sensor", "Autofocus", "Build"] as const).map((label) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span className="label-dim" style={{ letterSpacing: "0.18em" }}>{label}</span>
                      <div style={{ width: 18, height: 1, background: "rgba(255,255,255,0.1)" }} />
                    </div>
                  ))}
                </div>

                {/* Crosshair — GSAP moves left prop in onUpdate */}
                <div ref={modelCrosshairRef} className="mob-hide" style={{
                  position: "absolute", top: "50%", left: "50%",
                  zIndex: 12, pointerEvents: "none", opacity: 0.28,
                }}>
                  <div style={{ position:"relative", transform:"translate(-50%,-50%)" }}>
                    {/* Arms */}
                    <div style={{ position:"absolute", top:"50%", left:"-55px", right:"-55px", height:"1px", background:"rgba(43,141,255,0.55)", transform:"translateY(-50%)" }} />
                    <div style={{ position:"absolute", top:"-55px", bottom:"-55px", left:"50%", width:"1px", background:"rgba(43,141,255,0.55)", transform:"translateX(-50%)" }} />
                    {/* Outer ring */}
                    <div style={{ width:34, height:34, borderRadius:"50%", border:"1px solid rgba(43,141,255,0.4)", position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
                    {/* Inner dot */}
                    <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--accent)", position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", opacity:0.9 }} />
                  </div>
                </div>

                {/* Left telemetry — vertical stack top-left, below section label */}
                <div ref={modelTelemetryRef} className="mob-hide" style={{
                  position: "absolute",
                  left: PAD, top: "clamp(9rem, 16vh, 13rem)",
                  zIndex: 12, pointerEvents: "none",
                  opacity: 0.38,
                }}>
                  {([
                    { k: "MOUNT",    v: "E-MOUNT" },
                    { k: "FORMAT",   v: "35mm FF" },
                    { k: "BITDEPTH", v: "14-bit RAW" },
                    { k: "ISO_MAX",  v: "102400" },
                  ] as const).map(({ k, v }) => (
                    <div key={k} style={{
                      display: "flex", justifyContent: "space-between",
                      gap: "1.8rem", padding: "0.22rem 0",
                      fontSize: "0.48rem", letterSpacing: "0.11em",
                      fontFamily: "var(--font-mono), monospace",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      minWidth: "clamp(10rem, 14vw, 13rem)",
                    }}>
                      <span style={{ color: "rgba(255,255,255,0.25)" }}>{k}</span>
                      <span style={{ color: "var(--accent)" }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Right spec meters — top-right, below phase labels */}
                <div style={{
                  position: "absolute",
                  right: PAD, top: "clamp(9rem, 16vh, 13rem)",
                  zIndex: 12, pointerEvents: "none",
                  opacity: 0.38,
                }}>
                  {([
                    { label: "MEGAPIXELS", pct: 0.61, display: "61 MP" },
                    { label: "PDAF PTS",   pct: 0.77, display: "693" },
                    { label: "DYN RANGE",  pct: 0.75, display: "~15 stops" },
                  ] as const).map(({ label, pct, display }) => (
                    <div key={label} style={{ marginBottom: "0.9rem" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.25rem" }}>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.46rem", letterSpacing:"0.12em", color:"rgba(255,255,255,0.22)" }}>{label}</span>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.46rem", color:"var(--accent)", marginLeft:"1.2rem" }}>{display}</span>
                      </div>
                      <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", position:"relative", width:"clamp(7rem,10vw,10rem)" }}>
                        <div style={{ position:"absolute", top:0, left:0, height:"100%", background:"var(--accent)", width:`${pct*100}%`, opacity:0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Phase 0: Sensor · front/left view ───────── */}
                <div ref={modelPhase0Ref} style={{
                  position: "absolute",
                  bottom: "clamp(7rem, 13vh, 11rem)", left: PAD,
                  zIndex: 10, opacity: 0, pointerEvents: "none",
                }}>
                  <p className="label" style={{ marginBottom: "0.5rem" }}>Full-Frame BSI-CMOS</p>
                  <div style={{
                    display: "flex", alignItems: "baseline",
                    gap: "0.45rem", marginBottom: "1rem",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-display), sans-serif",
                      fontSize: "clamp(2.8rem, 5vw, 6rem)",
                      fontWeight: 700, letterSpacing: "-0.04em",
                      lineHeight: 0.85, color: "#fff",
                    }}>61</span>
                    <span className="label" style={{ fontSize: "clamp(0.7rem, 1.1vw, 1rem)" }}>MP</span>
                  </div>
                  {[
                    { l: "Sensor Format", v: "35mm Full-Frame" },
                    { l: "Color Depth",   v: "14-bit RAW" },
                    { l: "ISO Range",     v: "100 – 102400" },
                  ].map(({ l, v }) => (
                    <div key={l} style={{
                      display: "flex", justifyContent: "space-between",
                      gap: "2rem", padding: "0.35rem 0",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                      minWidth: "clamp(14rem, 20vw, 20rem)",
                    }}>
                      <span className="label-dim">{l}</span>
                      <span className="data">{v}</span>
                    </div>
                  ))}
                </div>

                {/* ── Phase 1: Autofocus · front/right view ────── */}
                <div ref={modelPhase1Ref} style={{
                  position: "absolute",
                  bottom: "clamp(7rem, 13vh, 11rem)", right: PAD,
                  zIndex: 10, opacity: 0, pointerEvents: "none",
                  textAlign: "right",
                }}>
                  <p className="label" style={{ marginBottom: "0.5rem" }}>Phase-Detection AF</p>
                  <div style={{
                    display: "flex", alignItems: "baseline",
                    gap: "0.45rem", justifyContent: "flex-end",
                    marginBottom: "1rem",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-display), sans-serif",
                      fontSize: "clamp(2.8rem, 5vw, 6rem)",
                      fontWeight: 700, letterSpacing: "-0.04em",
                      lineHeight: 0.85, color: "#fff",
                    }}>693</span>
                    <span className="label" style={{ fontSize: "clamp(0.7rem, 1.1vw, 1rem)" }}>PDAF</span>
                  </div>
                  {[
                    { l: "CDAF Points", v: "425" },
                    { l: "AF Coverage", v: "93% of Frame" },
                    { l: "Lock Speed",  v: "~0.02 seconds" },
                  ].map(({ l, v }) => (
                    <div key={l} style={{
                      display: "flex", justifyContent: "space-between",
                      gap: "2rem", padding: "0.35rem 0",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                      minWidth: "clamp(12rem, 18vw, 18rem)",
                    }}>
                      <span className="label-dim">{l}</span>
                      <span className="data">{v}</span>
                    </div>
                  ))}
                </div>

                {/* ── Phase 2: Build · bottom gradient bar ─────── */}
                <div ref={modelPhase2Ref} style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  zIndex: 10, opacity: 0, pointerEvents: "none",
                  padding: `clamp(2rem, 4vh, 3rem) ${PAD}`,
                  background: "linear-gradient(0deg, rgba(12,12,12,0.94) 0%, rgba(12,12,12,0.4) 70%, transparent 100%)",
                  display: "flex", gap: "0", alignItems: "flex-end",
                }}>
                  {([
                    { l: "Chassis",       v: "Magnesium Alloy" },
                    { l: "Sealing",       v: "Dust & Moisture" },
                    { l: "Stabilization", v: "5-axis IBIS" },
                    { l: "Connectivity",  v: "USB 3.1 · Wi-Fi · BT" },
                    { l: "Battery",       v: "530 Frames (EVF)" },
                  ] as const).map(({ l, v }, i) => (
                    <div key={l} style={{
                      flexShrink: 0,
                      paddingLeft: i > 0 ? "clamp(1.4rem, 3vw, 3rem)" : undefined,
                      paddingRight: "clamp(1.4rem, 3vw, 3rem)",
                      borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.07)" : undefined,
                    }}>
                      <p className="label-dim" style={{ marginBottom: "0.35rem" }}>{l}</p>
                      <p style={{
                        fontFamily: "var(--font-display), sans-serif",
                        fontSize: "clamp(0.85rem, 1.3vw, 1.25rem)",
                        fontWeight: 600, letterSpacing: "-0.01em", color: "#fff",
                      }}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Scroll hint — bottom center, well above phase bar */}
                <div style={{
                  position: "absolute",
                  bottom: "clamp(14rem, 20vh, 18rem)",
                  left: "50%", transform: "translateX(-50%)",
                  zIndex: 10, pointerEvents: "none", textAlign: "center",
                }}>
                  <p style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "0.44rem", letterSpacing: "0.32em",
                    color: "rgba(255,255,255,0.15)", textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}>Turn it over.</p>
                </div>

                {/* Edge rules */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 1,
                  background: "rgba(255,255,255,0.04)", zIndex: 10,
                }} />
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
                  background: "rgba(255,255,255,0.04)", zIndex: 10,
                }} />
              </div>
            </section>

            {/* ══════════════════════════════════════════════════
                §9 · BUILD & PRECISION
                Static section — reveals on scroll
                ══════════════════════════════════════════════════ */}
            <section data-build-section style={{
              position: "relative", zIndex: 10,
              background: "var(--bg)",
              padding: `clamp(6rem, 12vh, 11rem) ${PAD}`,
              transformOrigin: "center center",
            }}>
              {/* Top rule */}
              <div style={{
                position: "absolute", top: 0, left: PAD, right: PAD,
                height: 1, background: "var(--rule)",
              }} />

              <div className="mob-grid-2col-even" style={{ alignItems: "start" }}>
                {/* Left: headline + copy */}
                <div>
                  <div data-blur style={{
                    display: "flex", alignItems: "center",
                    gap: "1.2rem", marginBottom: "2.2rem",
                  }}>
                    <div style={{
                      width: "clamp(1.5rem,2.5vw,2.5rem)", height: 1,
                      background: "var(--accent)", flexShrink: 0,
                    }} />
                    <p className="label-dim">06 — Construction</p>
                  </div>

                  <SplitReveal
                    as="h2"
                    text={"Built for\nthe field."}
                    style={{
                      fontFamily: "var(--font-display), sans-serif",
                      fontSize: "clamp(3rem, 7.5vw, 8.5rem)",
                      fontWeight: 700,
                      letterSpacing: "-0.04em",
                      lineHeight: 0.88,
                      marginBottom: "2.5rem",
                      display: "block",
                    }}
                    stagger={0.12}
                  />

                  <p data-blur className="label-dim" style={{
                    lineHeight: 1.9, maxWidth: "27rem", letterSpacing: "0.04em",
                  }}>
                    The α7R III doesn&apos;t negotiate with conditions. Full magnesium-alloy,
                    sealed at every seam against dust and moisture. Five-axis
                    stabilisation is built into the mount — not the glass. You keep
                    the aperture; the camera handles the shake.
                  </p>

                  {/* Two stat boxes */}
                  <div data-blur data-blur-delay="0.14" style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: "1rem", marginTop: "2.8rem",
                  }}>
                    {[
                      { label: "Stabilization", value: "5-axis", sub: "IBIS · 5.5 stops" },
                      { label: "Burst Rate",    value: "10 fps",  sub: "241 RAW frames buffer" },
                    ].map(({ label, value, sub }) => (
                      <div key={label} style={{
                        padding: "1.4rem",
                        border: "1px solid var(--rule)",
                        background: "rgba(255,255,255,0.015)",
                        position: "relative",
                      }}>
                        <div style={{
                          position: "absolute", top: -1, left: -1,
                          width: 12, height: 12,
                          borderTop: "1px solid var(--accent)",
                          borderLeft: "1px solid var(--accent)",
                        }} />
                        <p className="label-dim" style={{ marginBottom: "0.5rem" }}>{label}</p>
                        <p style={{
                          fontFamily: "var(--font-display), sans-serif",
                          fontSize: "clamp(1.8rem, 3.5vw, 3.8rem)",
                          fontWeight: 700, letterSpacing: "-0.03em",
                          lineHeight: 1, color: "#fff",
                        }}>{value}</p>
                        <p className="label-dim" style={{ marginTop: "0.4rem" }}>{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: spec table + connectivity callout */}
                <div>
                  <div>
                    {BUILD_SPECS.map((r, i) => <SpecRow key={r.label} {...r} i={i} />)}
                  </div>

                  <div data-blur data-blur-delay="0.2" style={{
                    marginTop: "2rem",
                    padding: "1.4rem 1.6rem",
                    border: "1px solid rgba(43,141,255,0.15)",
                    background: "rgba(43,141,255,0.03)",
                    position: "relative",
                  }}>
                    <div style={{
                      position: "absolute", top: -1, left: -1,
                      width: 14, height: 14,
                      borderTop: "2px solid var(--accent)",
                      borderLeft: "2px solid var(--accent)",
                    }} />
                    <p className="label" style={{ marginBottom: "0.5rem" }}>Connectivity</p>
                    <p style={{
                      fontFamily: "var(--font-display), sans-serif",
                      fontSize: "clamp(1.4rem, 2.5vw, 2.8rem)",
                      fontWeight: 700, letterSpacing: "-0.03em",
                      lineHeight: 1.1, color: "#fff", marginBottom: "0.4rem",
                    }}>USB 3.1 · Wi-Fi · BT 4.1</p>
                    <p className="label-dim">Dual SD · UHS-II in Slot 1</p>
                  </div>
                </div>
              </div>

              {/* §9 — Key Numbers strip */}
              <div data-blur style={{
                marginTop: "clamp(4rem, 8vh, 7rem)",
                borderTop: "1px solid var(--rule)",
                paddingTop: "clamp(2rem, 4vh, 3.5rem)",
                display: "flex",
                flexWrap: "wrap",
                gap: "0",
                justifyContent: "space-between",
              }}>
                {([
                  { val: "650g",     label: "Body weight" },
                  { val: "5.5 ev",   label: "Stabilisation stops" },
                  { val: "3.69M",    label: "Viewfinder resolution" },
                  { val: "530",      label: "Shots per charge" },
                  { val: "Mg alloy", label: "Chassis material" },
                ] as const).map(({ val, label }, i) => (
                  <div key={label} style={{
                    flex: "1 1 0",
                    padding: "0 clamp(0.8rem, 2vw, 2rem)",
                    textAlign: "center",
                    borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                  }}>
                    <p style={{
                      fontFamily: "var(--font-display), sans-serif",
                      fontSize: "clamp(1.4rem, 2.5vw, 2.6rem)",
                      fontWeight: 700, letterSpacing: "-0.03em",
                      color: "#fff", lineHeight: 1,
                      marginBottom: "0.45rem",
                    }}>{val}</p>
                    <p className="label-dim" style={{ fontSize: "0.48rem" }}>{label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Footer ────────────────────────────────────── */}
            <footer style={{
              position: "relative", zIndex: 10,
              background: "#000",
            }}>
              {/* Top accent gradient rule */}
              <div style={{
                height: "1px",
                background: "linear-gradient(90deg, transparent 0%, rgba(43,141,255,0.35) 30%, rgba(43,141,255,0.35) 70%, transparent 100%)",
              }} />

              {/* Spec highlights row */}
              <div className="footer-specs" style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                padding: `clamp(2rem, 4vh, 3.5rem) ${PAD}`,
              }}>
                {([
                  { label: "Resolution",     value: "61.0 MP",       sub: "9504 × 6336 pixels" },
                  { label: "Dynamic Range",  value: "~15 stops",     sub: "Full native ISO latitude" },
                  { label: "Viewfinder",     value: "3.69M-dot",     sub: "0.78× Quad-VGA OLED" },
                  { label: "Buffer",         value: "241 frames",    sub: "Uncompressed RAW" },
                ] as const).map(({ label, value, sub }, i) => (
                  <div key={label} style={{
                    padding: "0 clamp(1rem, 2.5vw, 2.5rem)",
                    borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                  }}>
                    <p className="label-dim" style={{ marginBottom: "0.5rem" }}>{label}</p>
                    <p style={{
                      fontFamily: "var(--font-display), sans-serif",
                      fontSize: "clamp(1rem, 1.8vw, 1.9rem)",
                      fontWeight: 700, letterSpacing: "-0.025em",
                      color: "#fff", lineHeight: 1, marginBottom: "0.35rem",
                    }}>{value}</p>
                    <p style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: "0.46rem", letterSpacing: "0.08em",
                      color: "rgba(255,255,255,0.2)",
                    }}>{sub}</p>
                  </div>
                ))}
              </div>

              {/* Bottom row */}
              <div className="footer-inner" style={{
                display: "flex", alignItems: "flex-end",
                justifyContent: "space-between",
                flexWrap: "wrap", gap: "2rem",
                padding: `clamp(2.5rem, 5vh, 4.5rem) ${PAD}`,
              }}>
                {/* Brand */}
                <div>
                  <SplitReveal
                    as="p"
                    text="Sony α7R III"
                    className="serif"
                    style={{
                      fontSize: "clamp(2rem, 5vw, 5rem)",
                      fontWeight: 700, lineHeight: 1,
                      marginBottom: "1rem", display: "block",
                    }}
                    start="top 98%"
                  />
                  <p className="label-dim" style={{ letterSpacing: "0.12em" }}>
                    ILCE-7RM3A · E-Mount · October 2017
                  </p>
                </div>

                {/* Center: feature anchors */}
                <nav style={{
                  display: "flex", flexDirection: "column",
                  gap: "0.7rem", alignSelf: "center",
                }}>
                  {(["Exmor R BSI-CMOS", "693-point PDAF", "5-axis IBIS", "Dual SD · UHS-II"] as const).map((item) => (
                    <p key={item} style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: "0.5rem", letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.22)",
                    }}>{item}</p>
                  ))}
                </nav>

                {/* Right: copy + disclaimer */}
                <div style={{ textAlign: "right" }}>
                  <p style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "0.46rem", letterSpacing: "0.22em",
                    color: "rgba(255,255,255,0.18)",
                    textTransform: "uppercase",
                    marginBottom: "0.6rem",
                  }}>© Sony Corporation</p>
                  <p className="label-dim" style={{ fontSize: "0.44rem", letterSpacing: "0.1em" }}>
                    Specifications subject to change without notice.
                  </p>
                </div>
              </div>
            </footer>

          </div>
        </SmoothScroll>
      )}
    </>
  );
}
