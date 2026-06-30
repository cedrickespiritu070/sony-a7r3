# Sony α7R III — Project Handover

**Last updated:** 2026-06-30  
**Branch:** `main`  
**Status:** Build passing · 0 TypeScript errors

---

## Quick Start

```bash
npm run dev        # Turbopack dev server → http://localhost:3000
npx tsc --noEmit   # Type check only
```

---

## What This Is

A scroll-driven product showcase for the Sony α7R III. DJI Mavic 3 Pro aesthetic applied to Sony content — bold geometric sans-serif, dark background, precision-tech vibes.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, Turbopack) |
| Styling | Tailwind CSS + inline styles |
| Smooth scroll | Lenis (`lerp: 0.1`) |
| Scroll animation | GSAP + ScrollTrigger (`scrub: true` — not 0.5) |
| 3D model | Three.js via `@react-three/fiber` + `@react-three/drei` |
| Canvas frames | HTML5 Canvas + `ImageBitmap` (GPU-resident, zero decode overhead) |
| Fonts | Space Grotesk (`--font-display`) · Space Mono (`--font-mono`) · Cormorant Garamond (`--font-serif`, scoped only to sensor milestone callout values) |

---

## Page Architecture

### Total scroll container: **1200vh**

```
 0–100vh   §1 Hero              Pure CSS animations, no GSAP
100–200vh   §2 Sensor Architecture  SplitReveal headline, SENSOR_SPECS table
200–900vh   SENSOR PHASE (7 × 100vh segments)
    200–300vh  seg 0  rotate frames  0→30
    300–400vh  seg 1  MILESTONE 1 hold @frame 30   (Pixel Shift / 169.6MP)
    400–500vh  seg 2  rotate frames 31→60
    500–600vh  seg 3  MILESTONE 2 hold @frame 60   (EVF Tru-Finder / 3.69M-dot)
    600–700vh  seg 4  rotate frames 61→90
    700–800vh  seg 5  MILESTONE 3 hold @frame 90   (USB 3.1 / Connectivity)
    800–900vh  seg 6  rotate frames 91→99
900–1000vh  §5 Imaging Performance  IMAGING_SPECS table
1000–1100vh §6 Speed              CountUp(10fps) + SPEED_SPECS table
1100–1200vh §7 Full Specification  FINAL_SPECS table
```

After the 1200vh container: horizontal DJI-style feature scroll → Three.js 3D model section (200vh sticky).

### Frame sequence phases (global scroll progress 0→1)

| Phase | P-start | P-end | Frames used |
|---|---|---|---|
| Phase 1 · hero | `0` | `P1 = 1/6 ≈ 0.167` | `public/frames/hero/` (100 files) |
| Phase 2 · sensor | `P1` | `P2 = 3/4 = 0.75` | `public/frames/sensor/` (100 files) |
| Phase 3 · specs | `P2` | `1.0` | `public/frames/specs/` (100 files) |

Crossfade half-window: `XF = 0.018` (very narrow — clean cut between phases).

---

## Key Files

```
src/
  app/
    layout.tsx          — Google Fonts imports (Space Grotesk, Space Mono, Cormorant Garamond)
    page.tsx            — Main page. 1200vh container + horizontal scroll + model section
    globals.css         — Design tokens, utility classes, hero CSS keyframe animations

  components/
    ScrollSequence.tsx  — Canvas frame renderer. Phase 1/2/3 routing + sensorFrameT() milestone mapping
    SensorCallouts.tsx  — 3 milestone callout overlays (SVG lines + serif text blocks)
    SmoothScroll.tsx    — Lenis wrapper
    Loader.tsx          — Preloads all 300 frames as ImageBitmap before revealing page
    ModelViewer.tsx     — Three.js camera model (modelScroll singleton for scroll-driven rotation)
    SplitReveal.tsx     — Line-mask text reveal (gsap clip-path animation)
    CountUp.tsx         — Animated number counter
    ModelErrorBoundary.tsx

public/
  frames/
    hero/     ezgif-frame-001.jpg … ezgif-frame-100.jpg   (100 frames)
    sensor/   ezgif-frame-001.jpg … ezgif-frame-100.jpg   (100 frames)
    specs/    ezgif-frame-001.jpg … ezgif-frame-100.jpg   (100 frames)
  models/
    sony_alpha_3/
      scene.gltf
      scene.bin
  screenshots/
```

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0c0c0c` | Page background (DJI charcoal) |
| `--accent` | `#2b8dff` | DJI blue — labels, hero accent, spec gold highlight |
| `--fg` | `#ffffff` | Body text |
| `--fg-mid` | `rgba(255,255,255,0.58)` | Secondary text |
| `--fg-dim` | `rgba(255,255,255,0.28)` | Dim labels |
| `--font-display` | Space Grotesk | All headlines, labels, nav |
| `--font-mono` | Space Mono | Spec values, sub-labels |
| `--font-serif` | Cormorant Garamond | **ONLY** SensorCallouts milestone metric values (169.6 MP, 3.69M-dot, USB 3.1) |
| Canvas fill | `#000000` | Pure black during sensor phase for milestone contrast |

---

## SensorCallouts — Milestone System

**File:** `src/components/SensorCallouts.tsx`

Three independent `ScrollTrigger` instances, one per 100vh hold window:

| Milestone | Hold window | Frame | Feature | Value |
|---|---|---|---|---|
| M1 | 300–400vh | 30 | Lens / Pixel Shift | 169.6 MP |
| M2 | 500–600vh | 60 | EVF Tru-Finder | 3.69M-dot |
| M3 | 700–800vh | 90 | USB-C port | USB 3.1 |

**Line style:** champagne gold `#c5a880`, `stroke-width: 2` (diagonal) + `1.5` (tick). Anchor dot `r=4`.

**Animation sequence within each hold (0→1 progress):**
1. `0→0.4` enter: anchor dot → line draws → tick draws → serif text fades up
2. `0.4→0.8` plateau: all fully visible
3. `0.8→1.0` exit: everything fades out together

`onLeave` / `onLeaveBack` callbacks ensure clean state on fast trackpad swipe.

**Callout anchor positions (% of viewport, estimated — may need recalibration):**

| Milestone | ax | ay | tx | ty | side |
|---|---|---|---|---|---|
| M1 (lens) | 49 | 55 | 65 | 33 | right |
| M2 (EVF) | 70 | 24 | 78 | 44 | right |
| M3 (USB-C) | 28 | 58 | 16 | 40 | left |

These are approximate. Run the dev server, scroll to each milestone, and adjust `ax/ay` until the pointer dots land exactly on the camera feature in each frozen frame.

---

## ScrollSequence — Frame Pinning Logic

**File:** `src/components/ScrollSequence.tsx`

The `sensorFrameT(globalProgress)` function handles the milestone frame freeze:

```
7 segments, each 1/7 of sensor local progress (0→1):

  seg 0  [0,   30]  → rotate   (linear 0→30)
  seg 1  [30,  30]  → HOLD     (always frame 30)
  seg 2  [31,  60]  → rotate
  seg 3  [60,  60]  → HOLD     (always frame 60)
  seg 4  [61,  90]  → rotate
  seg 5  [90,  90]  → HOLD     (always frame 90)
  seg 6  [91,  99]  → rotate to end
```

Scrolling back (trackpad reverse) works automatically — pure functional, no state.

---

## Known Issues / Things to Calibrate

### 1. Callout anchor positions need visual calibration
The `ax/ay` and `tx/ty` values in `SensorCallouts.tsx` are rough estimates. To fix:
- `npm run dev`
- Scroll to each milestone hold (300vh, 500vh, 700vh)
- Inspect the frozen frame and adjust anchor percentages so pointer dots hit the actual camera feature
- Specifically: at frame 30, is the lens clearly centered at ~49%, 55%? At frame 90, is the USB-C port visible at all (side profile view)?

### 2. Sensor frame rotation direction unknown
The frame sequence `public/frames/sensor/` goes 001→100. We don't know the exact angle at each frame. Frame 30 might be a front-ish view (good for lens), frame 60 mid-rotation, frame 90 side/back. If the rotation goes the wrong direction for the feature at each milestone, you may need to re-map which frames map to which milestone.

### 3. No mobile layout
Everything is desktop-first. No responsive breakpoints on the milestone callouts or hero section.

### 4. Three.js model — Playwright test environment
`scene.bin` throws "Could not load" in Playwright (headless) but works in a real browser. Not a production bug.

---

## Important GSAP Rule

**Never use `scrub: 0.5` (or any number).** Use `scrub: true` only.

Lenis `lerp: 0.1` already smooths the scroll. Adding a GSAP scrub tween on top doubles the lag and causes frame animation to feel sticky. This was a bug that was fixed and should not be re-introduced.

---

## Lenis vh Calculation (Critical)

When computing pixel offsets for ScrollTrigger from CSS vh values:

```js
// CORRECT
const vhPx = window.innerHeight / 100;  // 1 CSS vh in pixels
const offset300vh = 300 * vhPx;         // = 300 * 9 = 2700px (in 900px viewport)

// WRONG — this was a past bug
const vh = window.innerHeight;           // gives px per 100vh, not per 1vh
```

---

## Horizontal Scroll Section (after 1200vh container)

Standard GSAP pin-and-slide pattern. Four feature panels slide horizontally on scroll. No changes needed here currently.

## Three.js Model Section (after horizontal scroll)

- `height: "200vh"` outer + `position: sticky; top: 0; height: 100vh` inner
- `modelScroll.progress` singleton driven by a ScrollTrigger in `page.tsx`
- Camera: `position: [0, 0, 6.2]`, `fov: 36`
- Model scale: `0.19`
- Rotation: `(modelScroll.progress - 0.5) * Math.PI * 1.4`

---

## Session Memory

Auto-memory is saved at:  
`C:\Users\cedri\.claude\projects\C--Users-cedri-OneDrive-Desktop-clonedrepo-sony-a7r3\memory\`

Key files:
- `MEMORY.md` — index
- `project_scroll_architecture.md` — 1200vh layout, phase boundaries, milestone positions
- `project_design_system.md` — fonts, colors, typography rules
- `feedback_scroll_animation.md` — scrub:true rule, Lenis lerp, StrictMode ticker cleanup
