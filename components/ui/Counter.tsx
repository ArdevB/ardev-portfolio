"use client";

import { useEffect, useRef } from "react";

/** Counts up from 0 when scrolled into view. SSR renders the final value. */
export function Counter({ value, duration = 1600, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(2, -10 * t);
          el.textContent = Math.round(value * (t === 1 ? 1 : eased)).toLocaleString("en-US") + suffix;
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        el.textContent = "0" + suffix;
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, suffix]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
