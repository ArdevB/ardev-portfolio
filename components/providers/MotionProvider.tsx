"use client";

import { LazyMotion } from "motion/react";

// Animation features (incl. layout animations) are fetched after hydration,
// keeping the public bundle small. Components use `m.*` instead of `motion.*`.
// Wait for idle so the projection engine never competes with hydration.
const loadFeatures = () =>
  new Promise<void>((resolve) =>
    "requestIdleCallback" in window ? window.requestIdleCallback(() => resolve(), { timeout: 2500 }) : setTimeout(resolve, 600),
  )
    .then(() => import("./motion-features"))
    .then((m) => m.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
