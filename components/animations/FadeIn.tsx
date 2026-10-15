import type { ReactNode } from "react";
import { InView } from "./InView";

/** Opacity + translate on enter. CSS-driven (one IntersectionObserver, no animation library). */
export function FadeIn({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <InView className={`fade-in ${className}`} style={{ "--fade-delay": `${delay}s` } as React.CSSProperties}>
      {children}
    </InView>
  );
}
