"use client";

import { useEffect, useRef, ElementType, CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  text: string;          // use \n for forced line breaks
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  stagger?: number;      // between lines
  duration?: number;
  start?: string;        // ScrollTrigger start
}

/**
 * DJI-style line-mask reveal.
 * Each line sits inside an overflow:hidden clip; the text slides up from below.
 * Only works with plain string content — use `text` prop, not children.
 */
export default function SplitReveal({
  text,
  as: Tag = "span",
  className,
  style,
  delay     = 0,
  stagger   = 0.12,
  duration = 0.88,
  start    = "top 88%",
}: Props) {
  const wrapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const lines = wrap.querySelectorAll<HTMLSpanElement>("[data-line]");
    if (!lines.length) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start,
        toggleActions: "play none none none",
      },
    });

    tl.from(lines, {
      y: "105%",
      opacity: 0,
      stagger,
      duration,
      delay,
      ease: "power4.out",
    });

    return () => { tl.kill(); };
  }, [delay, stagger, duration, start]);

  const lines = text.split(/\\n|\n/);

  return (
    // @ts-ignore — generic ref type
    <Tag ref={wrapRef} className={className} style={style}>
      {lines.map((line, i) => (
        <span
          key={i}
          style={{
            display: "block",
            overflow: "hidden",
            // preserve empty lines
            minHeight: line === "" ? "0.5em" : undefined,
          }}
        >
          <span
            data-line
            style={{ display: "block" }}
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
