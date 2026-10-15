"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

function read(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* storage unavailable — theme still applies for this page view */
  }
}

/**
 * Theme state + a toggle that animates as a circular clip-path reveal
 * expanding from the given origin (the toggle button).
 */
export function useTheme() {
  const theme = useSyncExternalStore<Theme>(subscribe, read, () => "light");

  const setTheme = useCallback((next: Theme, origin?: { x: number; y: number }) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
    };

    if (!doc.startViewTransition || reduce) {
      apply(next);
      return;
    }

    const x = origin?.x ?? window.innerWidth - 40;
    const y = origin?.y ?? 40;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const root = document.documentElement;
    root.classList.add("theme-vt");
    const vt = doc.startViewTransition(() => apply(next));
    vt.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 750, easing: "cubic-bezier(0.76, 0, 0.24, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {});
    vt.finished.finally(() => root.classList.remove("theme-vt"));
  }, []);

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => setTheme(read() === "dark" ? "light" : "dark", origin),
    [setTheme],
  );

  return { theme, setTheme, toggle };
}
