"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * One listener for many magnetic items: every descendant with [data-magnetic]
 * is pulled toward the pointer while hovered. Far cheaper than a component per
 * item. Fine pointers only, never with reduced motion.
 */
export function MagneticGroup({ children, strength = 0.3, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let active: HTMLElement | null = null;
    let raf = 0;

    const release = (el: HTMLElement) => {
      el.style.transition = "transform 0.6s cubic-bezier(0.16,1,0.3,1)";
      el.style.transform = "";
      window.setTimeout(() => (el.style.willChange = ""), 600);
    };
    const move = (e: PointerEvent) => {
      const el = (e.target as Element).closest<HTMLElement>("[data-magnetic]");
      if (active && active !== el) release(active);
      active = el;
      if (!el) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.willChange = "transform";
        el.style.transition = "transform 0.25s cubic-bezier(0.16,1,0.3,1)";
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
    };
    const leave = () => {
      if (active) release(active);
      active = null;
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
