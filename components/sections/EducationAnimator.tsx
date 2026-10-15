"use client";

import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";

export function EducationAnimator({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGsap(ref, ({ gsap }) => {
    const root = ref.current!;
    const line = root.querySelector("[data-edu-line]");
    const steps = gsap.utils.toArray<HTMLElement>("[data-edu-step]", root);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const desktop = window.matchMedia("(min-width: 768px)").matches;

      // the accent line draws itself as you scroll through the timeline
      gsap.fromTo(
        line,
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: root, start: "top 65%", end: "bottom 65%", scrub: 0.6 } },
      );

      steps.forEach((step) => {
        const fromRight = step.dataset.side === "right";
        const dot = step.querySelector("[data-edu-dot] > span");
        const card = step.querySelector("[data-edu-card]");
        const chips = step.querySelectorAll("[data-edu-chip]");
        const segs = step.querySelectorAll("[data-edu-seg]");
        const ghost = step.querySelector("[data-edu-ghost]");

        const tl = gsap.timeline({ scrollTrigger: { trigger: step, start: "top 72%", once: true } });
        tl.from(dot, { scale: 0, duration: 0.7, ease: "back.out(2.4)" })
          .from(
            card,
            {
              x: desktop ? (fromRight ? 90 : -90) : 40,
              opacity: 0,
              clipPath: "inset(0% 0% 100% 0% round 24px)",
              duration: 1.1,
              ease: "expo.out",
              clearProps: "transform,clipPath,opacity",
            },
            0.1,
          )
          .from(chips, { y: 14, opacity: 0, stagger: 0.06, duration: 0.6, ease: "expo.out" }, 0.45);
        if (segs.length) {
          tl.from(segs, { scale: 0.4, opacity: 0, rotate: -40, stagger: 0.07, duration: 0.6, ease: "back.out(2)" }, 0.55);
        }

        // ghost label drifts against the scroll
        if (ghost) {
          gsap.fromTo(
            ghost,
            { yPercent: 35 },
            { yPercent: -35, ease: "none", scrollTrigger: { trigger: step, start: "top bottom", end: "bottom top", scrub: true } },
          );
        }
      });
    });

    return () => mm.revert();
  });

  return <div ref={ref}>{children}</div>;
}
