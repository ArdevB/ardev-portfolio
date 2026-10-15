"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "@/hooks/useLenis";

const PHRASE = ["Design", "Develop", "Deploy"];

/**
 * Infinite strip. Base drift + scroll velocity boost; direction follows the
 * scroll direction. Paused off-screen and with reduced motion.
 */
export function Marquee() {
  const track = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const el = track.current, host = wrap.current;
    if (!el || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let half = el.scrollWidth / 2;
    const ro = new ResizeObserver(() => (half = el.scrollWidth / 2));
    ro.observe(el);
    let x = 0, dir = -1, raf = 0, last = performance.now(), lastY = window.scrollY, visible = false, vel = 0;
    const base = 60; // px/s

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const v = lenis ? lenis.velocity : (window.scrollY - lastY) / Math.max(dt, 0.001) / 60;
      lastY = window.scrollY;
      vel += (v - vel) * 0.1;
      if (Math.abs(vel) > 0.2) dir = vel > 0 ? -1 : 1;
      const speed = base + Math.min(Math.abs(vel) * 90, 1400);
      x += dir * speed * dt;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      el.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      el.style.willChange = visible ? "transform" : "";
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(host);
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [lenis]);

  const items = Array.from({ length: 4 }).flatMap(() => PHRASE);

  return (
    <div ref={wrap} className="relative z-10 -my-4 overflow-x-clip py-10" aria-label="Design, develop, deploy" role="img">
      <div className="-rotate-2 bg-accent py-5 text-on-accent md:py-7">
        <div ref={track} className="flex w-max" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0">
              {items.map((w, i) => (
                <span
                  key={`${copy}-${i}`}
                  className="flex items-center whitespace-nowrap px-[0.35em] font-display text-[clamp(2.5rem,7vw,6.5rem)] font-bold uppercase leading-none tracking-[-0.04em]"
                >
                  {w}
                  <span className="ml-[0.7em] inline-block size-[0.28em] rounded-full bg-on-accent" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
