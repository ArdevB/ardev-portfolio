"use client";

import { useEffect, useRef, type DependencyList, type RefObject } from "react";
import { loadGsap, scheduleScrollRefresh, type GsapBundle } from "@/lib/gsap";

/**
 * Runs GSAP setup inside a scoped gsap.context once the library has loaded.
 * Everything created inside (tweens, ScrollTriggers, SplitText) is reverted on
 * unmount / route change, so nothing leaks between pages.
 */
export function useGsap(
  scope: RefObject<HTMLElement | null>,
  setup: (b: GsapBundle) => void | (() => void),
  deps: DependencyList = [],
) {
  const setupRef = useRef(setup);
  setupRef.current = setup;

  useEffect(() => {
    let cancelled = false;
    let ctx: gsap.Context | undefined;
    let cleanup: void | (() => void);
    let handle = 0;
    loadGsap().then((b) => {
      // Each component sets up in its own task (not one long microtask chain),
      // and only when the main thread is idle — keeps TBT / INP low.
      const run = () => {
        if (cancelled || !scope.current) return;
        ctx = b.gsap.context(() => {
          cleanup = setupRef.current(b);
        }, scope.current);
        scheduleScrollRefresh();
      };
      handle = typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(run, { timeout: 1200 })
        : window.setTimeout(run, 1);
    });
    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(handle);
      window.clearTimeout(handle);
      if (typeof cleanup === "function") cleanup();
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
