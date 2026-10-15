"use client";

import { useRef, type ElementType } from "react";
import { useGsap } from "@/hooks/useGsap";

type Props = {
  as?: ElementType;
  children: string;
  className?: string;
  id?: string;
  /** Split into lines (masked slide-up) or chars. */
  type?: "lines" | "chars";
  delay?: number;
  start?: string;
};

/**
 * SplitText masked reveal on scroll. Screen readers get the plain sentence
 * (sr-only copy); the split, animated copy is aria-hidden. Re-splits on
 * resize (autoSplit) and reverts on unmount. Reduced motion → plain fade.
 */
export function RevealText({ as: Tag = "div", children, className, id, type = "lines", delay = 0, start = "top 85%" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useGsap(ref, ({ gsap, SplitText }) => {
    const el = ref.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.from(el, { opacity: 0, duration: 0.6, ease: "none", scrollTrigger: { trigger: el, start, once: true } });
      return;
    }
    const split = SplitText.create(el, {
      type: type === "chars" ? "lines,chars" : "lines",
      mask: "lines",
      autoSplit: true,
      aria: "none",
      onSplit(self) {
        const targets = type === "chars" ? self.chars : self.lines;
        return gsap.from(targets, {
          yPercent: 115,
          duration: 1.1,
          ease: "expo.out",
          stagger: type === "chars" ? 0.025 : 0.08,
          delay,
          scrollTrigger: { trigger: el, start, once: true },
        });
      },
    });
    return () => split.revert();
  });

  return (
    <Tag id={id} className={className}>
      <span className="sr-only">{children}</span>
      <span ref={ref} aria-hidden="true" className="block">
        {children}
      </span>
    </Tag>
  );
}
