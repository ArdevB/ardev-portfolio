"use client";

import type { gsap as GsapType } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import type { SplitText as SplitTextType } from "gsap/SplitText";

export type GsapBundle = {
  gsap: typeof GsapType;
  ScrollTrigger: typeof ScrollTriggerType;
  SplitText: typeof SplitTextType;
};

let bundle: Promise<GsapBundle> | null = null;

/** Wait for the page to settle (load + idle) before pulling in animation code. */
function afterIdle() {
  return new Promise<void>((resolve) => {
    const idle = () =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(() => resolve(), { timeout: 2000 }) : window.setTimeout(resolve, 200);
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  });
}

let refreshTimer: number | undefined;

/**
 * Components set up their ScrollTriggers independently (each on idle), so the
 * creation order doesn't match page order. After any setup, re-sort triggers
 * (pins first via refreshPriority) and re-measure once things settle, so
 * triggers below a pinned section account for its extra scroll length.
 */
export function scheduleScrollRefresh() {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    loadGsap().then(({ ScrollTrigger }) => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
  }, 200);
}

/**
 * GSAP + plugins are loaded lazily (after hydration) so they never sit on the
 * critical path. Every caller shares a single registered instance.
 */
export function loadGsap(): Promise<GsapBundle> {
  if (!bundle) {
    bundle = afterIdle().then(() => Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("gsap/SplitText"),
      import("gsap/CustomEase"),
    ]).then(([g, st, sp, ce]) => {
      const gsap = g.gsap;
      gsap.registerPlugin(st.ScrollTrigger, sp.SplitText, ce.CustomEase);
      ce.CustomEase.create("cine", "0.76,0,0.24,1");
      gsap.defaults({ ease: "expo.out", duration: 1 });
      st.ScrollTrigger.config({ ignoreMobileResize: true });
      return { gsap, ScrollTrigger: st.ScrollTrigger, SplitText: sp.SplitText };
    }));
  }
  return bundle;
}
