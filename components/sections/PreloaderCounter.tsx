"use client";

import { useEffect, useRef } from "react";

export function PreloaderCounter() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (document.documentElement.dataset.preloader !== "show") return;
    const el = ref.current;
    if (!el) return;
    const start = 0; // performance.now() is measured from navigation start, matching the CSS timeline
    const duration = 1000;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease in-out to match the progress line
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      el.textContent = String(Math.round(eased * 100)).padStart(3, "0");
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <span ref={ref} className="block font-display text-[clamp(8rem,42vw,16rem)] leading-[0.8] tracking-[-0.06em] tabular-nums">
      000
    </span>
  );
}
