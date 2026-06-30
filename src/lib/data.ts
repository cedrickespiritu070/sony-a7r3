export interface TechMetric {
  label: string;
  value: string;
}

export interface Section {
  section_id: string;
  title: string;
  subtitle: string;
  description: string;
  technical_metrics: TechMetric[];
}

export const sections: Section[] = [
  {
    section_id: "hero",
    title: "Engineered for Those Who See Differently",
    subtitle: "Sony redefines what a camera can be — sensor, speed, and intelligence in one body.",
    description:
      "For over a decade, Sony has pushed the mirrorless frontier. From full-frame Alpha bodies to Cinema Line workhorses, every system is built around a single belief: that the space between an idea and an image should be zero. Sony cameras don't just capture light — they interpret it.",
    technical_metrics: [
      { label: "Sensor Generations",  value: "Exmor R & RS CMOS" },
      { label: "Mount System",        value: "Sony E-Mount" },
      { label: "Max Resolution",      value: "61 MP" },
      { label: "Cinema Line",         value: "FX3 · FX6 · FX9 · VENICE" },
    ],
  },
  {
    section_id: "sensor",
    title: "The Sensor Is the System",
    subtitle: "Sony doesn't just build cameras. It builds the sensors the world shoots on.",
    description:
      "Sony Semiconductor manufactures image sensors used by over 50% of the global camera and smartphone market. The Exmor R back-illuminated architecture, first introduced in 2009, set the industry standard for low-light performance. In Sony's own Alpha lineup, these sensors are matched with processing systems designed alongside them — not bolted on after.",
    technical_metrics: [
      { label: "Global Market Share", value: "~50% Sensor Supply" },
      { label: "Architecture",        value: "Back-Illuminated (BSI)" },
      { label: "Stacked Sensors",     value: "Exmor RS (A9 II, A1)" },
      { label: "Dynamic Range",       value: "15+ Stops (A7R V)" },
    ],
  },
  {
    section_id: "speed",
    title: "Speed Defined the Alpha A9",
    subtitle: "20 fps. Silent. No blackout. The moment professional sport switched systems.",
    description:
      "When Sony released the A9 in 2017, it proved mirrorless could outperform DSLR at the highest level. 20 fps blackout-free shooting, real-time Eye AF, and a stacked Exmor RS sensor with on-chip DRAM rewrote the sports photography playbook. The A9 III followed with a global shutter — the first full-frame camera to eliminate rolling shutter entirely at 120 fps.",
    technical_metrics: [
      { label: "A9 III Burst",     value: "120 fps" },
      { label: "Shutter Type",     value: "Global Electronic (A9 III)" },
      { label: "Rolling Shutter",  value: "Eliminated" },
      { label: "Tracking",         value: "AI Subject Recognition" },
    ],
  },
  {
    section_id: "stabilization",
    title: "Resolution Without Limits",
    subtitle: "The A7R series redefined what 'enough megapixels' means.",
    description:
      "The Alpha 7R lineage — from 36 MP in 2013 to 61 MP in the A7R V — is the clearest evidence of Sony's sensor roadmap. Each generation introduced not just more resolution, but smarter pixel architecture: wider dynamic range, deeper color depth, improved read-out speed. The A7R V added a dedicated AI processing unit for subject recognition that runs independently of the main imaging pipeline.",
    technical_metrics: [
      { label: "A7R V Resolution",   value: "61 MP" },
      { label: "Sensor Type",        value: "35mm Full-Frame BSI CMOS" },
      { label: "AI Processor",       value: "Dedicated AI Processing Unit" },
      { label: "In-Body Stabilization", value: "8.0 Stops (A7R V)" },
    ],
  },
  {
    section_id: "autofocus",
    title: "AI That Predicts the Frame",
    subtitle: "Real-time tracking that identifies subject, anticipates motion, and holds focus.",
    description:
      "Sony's AI-driven autofocus — now standard across the Alpha lineup — uses deep learning models trained on millions of images to recognize humans, animals, insects, vehicles, aircraft, and trains. In the A1 and A9 III, this runs at 120 times per second. The result: a camera that understands what you're shooting before the shutter fires.",
    technical_metrics: [
      { label: "Recognition",       value: "Human, Animal, Vehicle, Aircraft" },
      { label: "A1 AF Coverage",    value: "759 Phase-Detection Points" },
      { label: "AF Refresh Rate",   value: "120× per Second (A9 III)" },
      { label: "Low-Light AF",      value: "EV -4 (A7 IV)" },
    ],
  },
  {
    section_id: "cinema",
    title: "The Cinema Line",
    subtitle: "From FX30 to VENICE 2 — a complete ecosystem for moving images.",
    description:
      "Sony Cinema Line cameras share their sensor and processing DNA with the Alpha stills bodies, but are tuned for video professionals: internal RAW recording, full-size HDMI, XLR audio, S-Cinetone color science, and S-Log3 gamma. The FX3 fits in a mirrorless body. The VENICE 2 shoots 8.6K full-frame with dual base ISO — the same camera used on major streaming productions.",
    technical_metrics: [
      { label: "VENICE 2 Resolution", value: "8.6K Full-Frame" },
      { label: "Dual Base ISO",       value: "ISO 800 / ISO 3200" },
      { label: "Color Science",       value: "S-Cinetone / S-Log3" },
      { label: "FX3 Format",          value: "Full-Frame, Mirrorless Body" },
    ],
  },
  {
    section_id: "build",
    title: "Built to Last. Built to Work.",
    subtitle: "Magnesium alloy shell. Sealed to withstand dust, moisture, and real-world demands.",
    description:
      "Sony Alpha bodies are professional tools built for professional conditions. Magnesium alloy chassis are rigid and light. Sealing protects against moisture and dust ingress. Dual card slots eliminate the single-point-of-failure on location shoots. The battery grip ecosystem enables extended sessions. Every material choice is deliberate — not for its feel, but for what it can endure.",
    technical_metrics: [
      { label: "Body Material",      value: "Magnesium Alloy" },
      { label: "Environmental Sealing", value: "Dust & Moisture Resistant" },
      { label: "Dual Card Slots",    value: "Available on A7 IV, A7R V, A1" },
      { label: "Battery System",     value: "NP-FZ100 (Shared Ecosystem)" },
    ],
  },
  {
    section_id: "specs_grid",
    title: "The Alpha Lineup",
    subtitle: "One mount. Every discipline.",
    description:
      "The Sony E-Mount ecosystem spans over 80 native lenses and supports every imaging discipline — from compact APS-C travel systems to 61 MP full-frame studios, AI-driven sports bodies, and 8.6K cinema rigs. One mount connects every body Sony makes today and every body it has made since 2010.",
    technical_metrics: [
      { label: "Entry Body",         value: "ZV-E10 II (APS-C, 26 MP)" },
      { label: "Hybrid",             value: "A7 IV (33 MP, 10 fps)" },
      { label: "Resolution",         value: "A7R V (61 MP, 8 Stops IBIS)" },
      { label: "Speed",              value: "A9 III (24.6 MP, 120 fps)" },
      { label: "Flagship",           value: "A1 (50 MP, 30 fps, 8K)" },
      { label: "Cinema Entry",       value: "FX30 (APS-C, 4K 120p)" },
      { label: "Cinema Pro",         value: "FX6 (Full-Frame, 12.1 MP)" },
      { label: "Cinema Flagship",    value: "VENICE 2 (8.6K, Dual ISO)" },
      { label: "E-Mount Lenses",     value: "80+ Native G Master & G Lenses" },
      { label: "Mount Standard",     value: "E-Mount (since 2010)" },
      { label: "Sensor Supply",      value: "Sony Semiconductor (~50% global)" },
      { label: "Color Science",      value: "S-Cinetone, S-Log2/3, HLG" },
    ],
  },
];
