"use client";

import { useEffect, useRef } from "react";
import { useGsap } from "@/hooks/useGsap";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>";

/** Briefly scrambles a heading's letters and resolves them left to right. */
function scramble(el: HTMLElement) {
  const final = el.getAttribute("aria-label") ?? el.textContent ?? "";
  if (el.dataset.scrambling) return;
  el.dataset.scrambling = "1";
  const start = performance.now();
  const duration = 520;
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const solved = Math.floor(p * final.length);
    let out = "";
    for (let i = 0; i < final.length; i++) {
      const ch = final[i]!;
      out += i < solved || ch === " " || ch === "/" ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
    else {
      el.textContent = final;
      delete el.dataset.scrambling;
    }
  };
  requestAnimationFrame(tick);
}

/**
 * Stack motion:
 *  - bento cards wipe in (clip-path) with pills popping, titles scrambling
 *  - scroll parallax: each card drifts at its own depth, ghost numbers and the
 *    Frontend orb counter-drift, a ring of tool names rotates with scroll,
 *    floating shapes move by depth (scroll) and follow the mouse
 *  - marquee rows slide with scroll and lean with scroll velocity
 *  - cards tilt in 3D toward the cursor with a spotlight
 * Everything is transform / opacity / clip-path, and off with reduced motion.
 */
export function SkillsAnimator({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGsap(ref, ({ gsap, ScrollTrigger }) => {
    const root = ref.current!;
    const section = root.closest("section") ?? root;
    const mm = gsap.matchMedia();

    mm.add(
      { motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 1024px)" },
      (ctx) => {
        const { motion, desktop } = ctx.conditions as { motion: boolean; desktop: boolean };
        if (!motion) return;
        const depth = desktop ? 1 : 0.45;

        /* ── reveal ─────────────────────────────────────── */
        const cards = gsap.utils.toArray<HTMLElement>("[data-skill-card]", root);
        gsap.set(cards, { clipPath: "inset(100% 0% 0% 0% round 24px)", y: 60 });
        ScrollTrigger.batch(cards, {
          start: "top 88%",
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              clipPath: "inset(0% 0% 0% 0% round 24px)",
              y: 0,
              duration: 1.2,
              ease: "expo.out",
              stagger: 0.09,
              clearProps: "clipPath,transform",
            });
            batch.forEach((card, i) => {
              gsap.from(card.querySelectorAll("[data-skill-pill]"), {
                scale: 0.6,
                opacity: 0,
                duration: 0.7,
                ease: "back.out(2)",
                stagger: 0.035,
                delay: 0.35 + i * 0.09,
              });
              const title = card.querySelector<HTMLElement>("[data-scramble]");
              if (title) gsap.delayedCall(0.2 + i * 0.09, () => scramble(title));
            });
          },
        });

        /* ── per-card depth parallax (not on phones: single column would overlap) ── */
        const tabletUp = window.matchMedia("(min-width: 768px)").matches;
        gsap.utils.toArray<HTMLElement>(tabletUp ? "[data-parallax]" : "[data-none]", root).forEach((wrap) => {
          const shift = Number(wrap.dataset.shift ?? 0) * depth;
          gsap.fromTo(
            wrap,
            { y: shift },
            { y: -shift, ease: "none", scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 0.8 } },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-ghost]", root).forEach((g) => {
          gsap.fromTo(
            g,
            { yPercent: 30, rotate: -4 },
            { yPercent: -25, rotate: 4, ease: "none", scrollTrigger: { trigger: g.parentElement, start: "top bottom", end: "bottom top", scrub: true } },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-orb]", root).forEach((o) => {
          gsap.fromTo(
            o,
            { y: -60 * depth, x: 30 * depth },
            { y: 80 * depth, x: -20 * depth, ease: "none", scrollTrigger: { trigger: o.parentElement, start: "top bottom", end: "bottom top", scrub: true } },
          );
        });

        /* ── background ring + floating shapes ───────────── */
        const ring = root.querySelector("[data-ring]");
        if (ring) {
          gsap.fromTo(
            ring,
            { rotate: -40, yPercent: 10 },
            { rotate: 140, yPercent: -25, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1 } },
          );
        }
        const shapes = gsap.utils.toArray<HTMLElement>("[data-shape]", root);
        shapes.forEach((sh) => {
          const d = Number(sh.dataset.depth ?? 1);
          gsap.fromTo(
            sh,
            { y: 220 * d * depth, rotate: -30 * d },
            { y: -220 * d * depth, rotate: 30 * d, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1.2 } },
          );
        });
        // shapes also lean toward the cursor (inner element so it doesn't fight the scroll tween)
        if (desktop) {
          const movers = shapes.map((sh) => {
            const inner = sh.querySelector<HTMLElement>("[data-shape-inner]")!;
            const d = Number(sh.dataset.depth ?? 1);
            return {
              d,
              x: gsap.quickTo(inner, "x", { duration: 1.1, ease: "expo.out" }),
              y: gsap.quickTo(inner, "y", { duration: 1.1, ease: "expo.out" }),
            };
          });
          const onMove = (e: PointerEvent) => {
            const r = section.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width - 0.5;
            const ny = (e.clientY - r.top) / r.height - 0.5;
            movers.forEach((m) => {
              m.x(nx * 60 * m.d);
              m.y(ny * 60 * m.d);
            });
          };
          section.addEventListener("pointermove", onMove as EventListener);
          return () => section.removeEventListener("pointermove", onMove as EventListener);
        }
      },
    );

    /* ── marquee rows: scroll slide + velocity lean ─────── */
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-row]", section);
      rows.forEach((row, i) => {
        gsap.fromTo(
          row,
          { xPercent: i % 2 ? -8 : 4 },
          { xPercent: i % 2 ? 4 : -8, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: 0.6 } },
        );
      });
      const skews = rows.map((r) => gsap.quickTo(r, "skewX", { duration: 0.6, ease: "power3.out" }));
      const st = ScrollTrigger.create({
        trigger: rows[0]?.parentElement ?? section,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-12, 12, self.getVelocity() / -260);
          skews.forEach((s, i) => s(i % 2 ? -v : v));
        },
        onLeave: () => skews.forEach((s) => s(0)),
        onLeaveBack: () => skews.forEach((s) => s(0)),
      });
      // ease back to upright when scrolling stops
      const settle = () => skews.forEach((s) => s(0));
      ScrollTrigger.addEventListener("scrollEnd", settle);
      return () => {
        st.kill();
        ScrollTrigger.removeEventListener("scrollEnd", settle);
      };
    });

    return () => mm.revert();
  });

  // Spotlight + 3D tilt + hover scramble (fine pointers only)
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let current: HTMLElement | null = null;
    let raf = 0;
    const reset = (card: HTMLElement | null) => {
      if (!card) return;
      card.querySelector<HTMLElement>("[data-glow]")?.style.setProperty("opacity", "0");
      card.style.transition = "transform 0.8s cubic-bezier(0.16,1,0.3,1)";
      card.style.transform = "";
    };
    const move = (e: PointerEvent) => {
      const card = (e.target as Element).closest<HTMLElement>("[data-skill-card]");
      if (card !== current) {
        reset(current);
        current = card;
        if (card) {
          card.querySelector<HTMLElement>("[data-glow]")?.style.setProperty("opacity", "1");
          card.style.transition = "transform 0.35s cubic-bezier(0.16,1,0.3,1)";
          const t = card.querySelector<HTMLElement>("[data-scramble]");
          if (t) scramble(t);
        }
      }
      if (!card) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(1100px) rotateX(${((0.5 - py) * 7).toFixed(2)}deg) rotateY(${((px - 0.5) * 9).toFixed(2)}deg) translateZ(0)`;
        const glow = card.querySelector<HTMLElement>("[data-glow]");
        if (glow) glow.style.transform = `translate3d(${e.clientX - r.left - 210}px, ${e.clientY - r.top - 210}px, 0)`;
      });
    };
    const leave = () => {
      reset(current);
      current = null;
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
