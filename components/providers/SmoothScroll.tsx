"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";
import { LenisContext } from "@/hooks/useLenis";
import { loadGsap } from "@/lib/gsap";

/**
 * Lenis smooth scrolling driven by the GSAP ticker so ScrollTrigger and Lenis
 * share one clock. Off for reduced motion and touch devices.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Native scrolling on touch devices (Lenis wouldn't smooth touch anyway, and
    // skipping it keeps a per-frame JS loop off phones) and with reduced motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)").matches) return;
    let instance: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;
    let cancelled = false;

    Promise.all([import("lenis"), loadGsap()]).then(([{ default: LenisCtor }, { gsap, ScrollTrigger }]) => {
      if (cancelled) return;
      instance = new LenisCtor({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), autoRaf: false });
      instance.on("scroll", ScrollTrigger.update);
      tick = (time: number) => instance?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      setLenis(instance);
    });

    return () => {
      cancelled = true;
      if (tick) loadGsap().then(({ gsap }) => gsap.ticker.remove(tick!));
      instance?.destroy();
      setLenis(null);
    };
  }, []);

  // In-page anchor links scroll smoothly through Lenis.
  useEffect(() => {
    if (!lenis) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element).closest<HTMLAnchorElement>("a[href*='#']");
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4 });
      history.replaceState(null, "", url.hash);
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenis]);

  // Route change: jump to top (or hash) and re-measure triggers.
  useEffect(() => {
    const hash = window.location.hash;
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) {
      if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
      else target.scrollIntoView();
    } else if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
    const id = window.setTimeout(() => loadGsap().then(({ ScrollTrigger }) => ScrollTrigger.refresh()), 120);
    return () => window.clearTimeout(id);
  }, [pathname, lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
