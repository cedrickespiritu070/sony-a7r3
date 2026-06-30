import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

// Space Grotesk — geometric sans-serif, DJI-style precision
// Variable weights 300-700 cover display numbers, headings, body
const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Cormorant Garamond — luxury editorial serif for milestone callout headings
const serifFont = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

// Space Mono — technical monospace for data values and labels
const monoFont = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sony α7R III — 61 Megapixels",
  description:
    "61MP back-illuminated full-frame CMOS. 693 phase-detection points. Every pixel, accounted for.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${monoFont.variable} ${serifFont.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
