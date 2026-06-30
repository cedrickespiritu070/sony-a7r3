"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ── Champagne gold palette ────────────────────────────────────────────
const GOLD       = "#c5a880";
const GOLD_DIM   = "rgba(197,168,128,0.6)";
const GOLD_PULSE = "rgba(197,168,128,0.18)";

const TICK_LEN = 64; // horizontal tick length in px

// ── Milestone definitions ─────────────────────────────────────────────
// Each milestone maps to a HOLD segment in the 1200vh container.
// Container layout:
//   §1 Hero          :   0– 100vh
//   §2 Sensor Arch   : 100– 200vh
//   Sensor rotation  : 200– 300vh  (frames  0→30)
//   MILESTONE 1 hold : 300– 400vh  ← M1
//   Sensor rotation  : 400– 500vh  (frames 31→60)
//   MILESTONE 2 hold : 500– 600vh  ← M2
//   Sensor rotation  : 600– 700vh  (frames 61→90)
//   MILESTONE 3 hold : 700– 800vh  ← M3
//   Sensor end       : 800– 900vh  (frames 91→99)
//   §5–§7 Specs      : 900–1200vh
//
// ax/ay: anchor % on viewport where the pointer touches the camera feature
// tx/ty: tip of diagonal connector line (% of viewport)
const MILESTONES = [
  {
    id:      "pixelshift",
    startVh: 300,
    endVh:   400,
    ax: 49,  ay: 55,   // lens centre (front-ish view at frame 30)
    tx: 65,  ty: 33,   // connector tip
    side:    "right" as const,
    label:   "PIXEL SHIFT MULTI SHOOTING",
    value:   "169.6 MP",
    sub:     "4-Shot Composite · Tripod Mount Required",
  },
  {
    id:      "evf",
    startVh: 500,
    endVh:   600,
    ax: 70,  ay: 24,   // EVF housing (3/4-back view at frame 60)
    tx: 78,  ty: 44,
    side:    "right" as const,
    label:   "QUAD-VGA OLED TRU-FINDER",
    value:   "3.69M-dot",
    sub:     "0.78× Magnification · 23mm Eye Point",
  },
  {
    id:      "usb",
    startVh: 700,
    endVh:   800,
    ax: 28,  ay: 58,   // USB-C port on left panel (side view at frame 90)
    tx: 16,  ty: 40,
    side:    "left" as const,
    label:   "TETHERED WORKFLOWS",
    value:   "USB 3.1",
    sub:     "Gen 1 · Dual SD Slots · Wi-Fi & Bluetooth",
  },
] as const;

interface Props {
  containerRef: React.RefObject<HTMLElement | null>;
}

export default function SensorCallouts({ containerRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root      = rootRef.current;
    const container = containerRef.current;
    if (!root || !container) return;

    const W    = window.innerWidth;
    const H    = window.innerHeight;
    const vhPx = H / 100; // 1 CSS vh → pixels

    const ns = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width",  "100%");
    svg.setAttribute("height", "100%");
    svg.style.cssText = "position:absolute;inset:0;overflow:visible;pointer-events:none;";
    root.appendChild(svg);

    const triggers: ScrollTrigger[] = [];

    MILESTONES.forEach((m) => {
      // ── Pixel coordinates ─────────────────────────────────────
      const x1      = (m.ax / 100) * W;
      const y1      = (m.ay / 100) * H;
      const x2      = (m.tx / 100) * W;
      const y2      = (m.ty / 100) * H;
      const lineLen = Math.hypot(x2 - x1, y2 - y1);
      const tickX2  = m.side === "right" ? x2 + TICK_LEN : x2 - TICK_LEN;

      // ── SVG elements ──────────────────────────────────────────
      const pulse = document.createElementNS(ns, "circle");
      pulse.setAttribute("cx",           String(x1));
      pulse.setAttribute("cy",           String(y1));
      pulse.setAttribute("r",            "10");
      pulse.setAttribute("fill",         "none");
      pulse.setAttribute("stroke",       GOLD_PULSE);
      pulse.setAttribute("stroke-width", "1.5");
      pulse.setAttribute("opacity",      "0");

      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx",      String(x1));
      dot.setAttribute("cy",      String(y1));
      dot.setAttribute("r",       "4");
      dot.setAttribute("fill",    GOLD);
      dot.setAttribute("opacity", "0");

      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1",                String(x1)); line.setAttribute("y1", String(y1));
      line.setAttribute("x2",                String(x2)); line.setAttribute("y2", String(y2));
      line.setAttribute("stroke",            GOLD_DIM);
      line.setAttribute("stroke-width",      "2");
      line.setAttribute("stroke-dasharray",  String(lineLen));
      line.setAttribute("stroke-dashoffset", String(lineLen));
      line.setAttribute("opacity",           "0");

      const tick = document.createElementNS(ns, "line");
      tick.setAttribute("x1",                String(x2));    tick.setAttribute("y1", String(y2));
      tick.setAttribute("x2",                String(tickX2)); tick.setAttribute("y2", String(y2));
      tick.setAttribute("stroke",            GOLD);
      tick.setAttribute("stroke-width",      "1.5");
      tick.setAttribute("stroke-dasharray",  String(TICK_LEN));
      tick.setAttribute("stroke-dashoffset", String(TICK_LEN));
      tick.setAttribute("opacity",           "0");

      svg.appendChild(pulse);
      svg.appendChild(line);
      svg.appendChild(tick);
      svg.appendChild(dot);

      // ── HTML text block ───────────────────────────────────────
      const textDiv = document.createElement("div");

      // Clamp left edge so text never overflows viewport on any screen size.
      // Right-side callouts: text starts just right of the tick end.
      // Left-side callouts: not enough space on the left — position inward
      //   (just right of the anchor line tip) so text stays on-screen.
      let leftPx: number;
      if (m.side === "right") {
        leftPx = Math.min(tickX2 + 18, W - 300);
      } else {
        // tickX2 is near the left edge; place text rightward from the tip (x2)
        leftPx = Math.min((m.tx / 100) * W + 18, W - 300);
      }
      leftPx = Math.max(leftPx, 16);
      const topPx = Math.max(y2 - 20, 16);

      textDiv.style.cssText = `
        position:absolute;
        left:${leftPx}px;
        top:${topPx}px;
        text-align:left;
        pointer-events:none;
        max-width:clamp(220px,28vw,290px);
        opacity:0;
        transform:translateY(14px);
        will-change:opacity,transform;
        padding:1rem 1.3rem;
        background:rgba(12,12,12,0.82);
        backdrop-filter:blur(12px);
        -webkit-backdrop-filter:blur(12px);
        border:1px solid rgba(255,255,255,0.06);
        border-left:2px solid rgba(43,141,255,0.5);
      `;
      textDiv.innerHTML = `
        <p style="font-family:var(--font-display),sans-serif;font-size:0.5rem;letter-spacing:0.26em;text-transform:uppercase;color:${GOLD};margin-bottom:0.6rem;font-weight:500;">${m.label}</p>
        <p style="font-family:var(--font-display),sans-serif;font-size:clamp(3.5rem,5.5vw,6rem);font-weight:700;letter-spacing:-0.04em;color:#ffffff;line-height:0.86;margin-bottom:0.6rem;">${m.value}</p>
        <p style="font-family:var(--font-mono),monospace;font-size:0.58rem;letter-spacing:0.07em;color:rgba(255,255,255,0.3);line-height:1.7;">${m.sub}</p>
      `;
      root.appendChild(textDiv);

      // ── Direct-progress animation function ────────────────────
      // Called every scroll tick from onUpdate. Pure function of holdProgress (0→1).
      // Scroll reversal is handled automatically — no separate reverse logic.
      function update(holdProgress: number) {
        const p = Math.max(0, Math.min(1, holdProgress));

        // Entry ramp: 0→1 during first 22% of hold (smooth settle)
        const eIn = Math.min(1, p / 0.22);
        // Exit ramp: 0→1 during last 28% of hold (gives more time to read before exit)
        const eOut = Math.max(0, (p - 0.72) / 0.28);

        // Global visibility multiplier (full → dim on exit)
        const gVis = 1 - eOut;

        // Sequential draw within entry
        const lineP = Math.min(1, eIn * 2.0);                              // line: eIn 0→0.50
        const tickP = Math.max(0, Math.min(1, (eIn - 0.25) / 0.75));      // tick: eIn 0.25→1.0
        const textP = Math.max(0, Math.min(1, (eIn - 0.40) / 0.60));      // text: eIn 0.40→1.0

        pulse.setAttribute("opacity", String(eIn * 0.9 * gVis));
        dot.setAttribute("opacity",   String(eIn * gVis));

        line.setAttribute("opacity",           String(lineP * gVis));
        line.setAttribute("stroke-dashoffset", String(lineLen * (1 - lineP)));

        tick.setAttribute("opacity",           String(tickP * gVis));
        tick.setAttribute("stroke-dashoffset", String(TICK_LEN * (1 - tickP)));

        textDiv.style.opacity   = String(textP * gVis);
        textDiv.style.transform = `translateY(${(1 - textP) * 14}px)`;
      }

      // ── One ScrollTrigger per hold window ────────────────────
      triggers.push(ScrollTrigger.create({
        trigger: container,
        start:   `top+=${m.startVh * vhPx}px top`,
        end:     `top+=${m.endVh   * vhPx}px top`,
        scrub:   0.4,   // slight lag matches Lenis deceleration into hold zone
        onUpdate(self)  { update(self.progress); },
        onLeave()       { update(1); },
        onLeaveBack()   { update(0); },
      }));
    });

    return () => {
      triggers.forEach((st) => st.kill());
      while (root.firstChild) root.removeChild(root.firstChild);
    };
  }, [containerRef]);

  return (
    <div
      ref={rootRef}
      style={{
        position:      "absolute",
        inset:         0,
        pointerEvents: "none",
        zIndex:        8,
        overflow:      "hidden",
      }}
    />
  );
}
