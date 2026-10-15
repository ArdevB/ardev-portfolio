"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Dot + lerped ring. Elements opt in with data-cursor="grow" | "view" and an
 * optional data-cursor-label. Mounted only on fine pointers (never touch) and
 * never with reduced motion.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");
    const d = dot.current!, r = ring.current!, l = label.current!;
    let mx = -100, my = -100, rx = -100, ry = -100, raf = 0, visible = false;
    let mode: "default" | "grow" | "view" = "default";

    const render = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      d.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      const scale = mode === "view" ? 2.4 : mode === "grow" ? 1.6 : 1;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.1 ? requestAnimationFrame(render) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const setMode = (m: typeof mode, text = "") => {
      if (m === mode && l.textContent === text) return;
      mode = m;
      r.dataset.mode = m;
      d.dataset.mode = m;
      l.textContent = text;
      kick();
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        rx = mx;
        ry = my;
        r.style.opacity = d.style.opacity = "1";
      }
      kick();
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as Element).closest<HTMLElement>("[data-cursor], a, button");
      if (!t) return setMode("default");
      const kind = t.dataset.cursor;
      if (kind === "view") return setMode("view", t.dataset.cursorLabel ?? "View");
      setMode("grow");
    };
    const leave = () => {
      visible = false;
      r.style.opacity = d.style.opacity = "0";
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div
        ref={ring}
        aria-hidden="true"
        data-mode="default"
        className="group/cursor pointer-events-none fixed left-0 top-0 z-[80] grid size-10 place-items-center rounded-full border border-white opacity-0 mix-blend-difference transition-[opacity,background-color,border-color] duration-300 data-[mode=view]:border-transparent data-[mode=view]:bg-accent data-[mode=view]:mix-blend-normal"
      >
        <span
          ref={label}
          className="text-[0.32rem] font-semibold uppercase tracking-[0.12em] text-on-accent opacity-0 transition-opacity duration-200 group-data-[mode=view]/cursor:opacity-100"
        />
      </div>
      <div
        ref={dot}
        aria-hidden="true"
        data-mode="default"
        className="pointer-events-none fixed left-0 top-0 z-[80] size-1.5 rounded-full bg-white opacity-0 mix-blend-difference transition-opacity duration-200 data-[mode=view]:!opacity-0"
      />
    </>
  );
}
