"use client";

import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";

/** Scrubbed word-by-word reveal + clip-path portrait reveal. */
export function AboutAnimator({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGsap(ref, ({ gsap }) => {
    const root = ref.current!;
    const words = root.querySelectorAll("[data-word]");
    const para = root.querySelector("[data-words]");
    const portrait = root.querySelector("[data-portrait]");
    const inner = root.querySelector("[data-portrait-inner]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      gsap.from([para, portrait], { opacity: 0, duration: 0.6, ease: "none", scrollTrigger: { trigger: root, start: "top 80%", once: true } });
      return;
    }

    gsap.fromTo(
      words,
      { opacity: 0.15 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.08,
        // immediateRender:false keeps words fully opaque until the paragraph
        // reaches the viewport edge — readable without JS and for audits.
        immediateRender: false,
        scrollTrigger: { trigger: para, start: "top bottom", end: "bottom 45%", scrub: true },
      },
    );

    if (portrait && inner) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: portrait, start: "top 85%", once: true } });
      tl.fromTo(portrait, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "cine" }).fromTo(
        inner,
        { scale: 1.2 },
        { scale: 1, duration: 1.6, ease: "expo.out", clearProps: "transform" },
        0,
      );
    }
  });

  return <div ref={ref}>{children}</div>;
}
