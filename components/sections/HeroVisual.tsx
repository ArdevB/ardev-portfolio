"use client";

import { useEffect, useRef } from "react";

/**
 * Layered abstract composition with mouse parallax. Each layer moves by its
 * data-depth; transform only, rAF-lerped, idle when settled.
 */
export function HeroVisual() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches)
      return;
    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-depth]"));
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const render = () => {
      x += (tx - x) * 0.07;
      y += (ty - y) * 0.07;
      for (const l of layers) {
        const d = Number(l.dataset.depth);
        l.style.transform = `translate3d(${(x * d).toFixed(2)}px, ${(y * d).toFixed(2)}px, 0)`;
      }
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(render) : 0;
    };
    const move = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(render);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none absolute -right-[14vw] top-[22svh] aspect-square w-[88vw] md:right-[6vw] md:top-[13svh] md:w-[min(40vw,31rem)]"
    >
      <div data-depth="-14" className="absolute inset-0">
        <div className="hero-pop size-full" style={{ "--d": "0.35s" } as React.CSSProperties}>
          <div className="size-full rounded-full border border-border" />
        </div>
      </div>
      <div data-depth="26" className="absolute inset-[14%]">
        <div className="hero-pop size-full" style={{ "--d": "0.25s" } as React.CSSProperties}>
          <div className="relative size-full overflow-clip rounded-full bg-accent">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.35),transparent_55%)]" />
          </div>
        </div>
      </div>
      <div data-depth="44" className="absolute inset-0">
        <div className="hero-pop size-full" style={{ "--d": "0.45s" } as React.CSSProperties}>
          <svg viewBox="0 0 200 200" className="size-full animate-[spin_24s_linear_infinite] motion-reduce:animate-none">
            <defs>
              <path id="hero-ring" d="M100,100 m-88,0 a88,88 0 1,1 176,0 a88,88 0 1,1 -176,0" />
            </defs>
            <text className="fill-fg text-[9px] uppercase" style={{ letterSpacing: "0.32em" }}>
              <textPath href="#hero-ring">Design • Develop • Deploy • Design • Develop • Deploy •</textPath>
            </text>
          </svg>
        </div>
      </div>
      <div data-depth="60" className="absolute left-[3%] top-[6%] size-[16%]">
        <div className="hero-pop size-full" style={{ "--d": "0.6s" } as React.CSSProperties}>
          <div className="size-full rounded-full bg-fg" />
        </div>
      </div>
    </div>
  );
}
