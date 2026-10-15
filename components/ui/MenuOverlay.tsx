"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { TransitionLink } from "./TransitionLink";
import { navLinks } from "@/lib/nav";
import { site } from "@/lib/site";
import { useLenis } from "@/hooks/useLenis";

const EASE = [0.76, 0, 0.24, 1] as const;

export function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lenis = useLenis();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    if (!lenis) document.body.style.overflow = "hidden";
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>("a");
    window.setTimeout(() => first?.focus(), 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>("a, button");
      const firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl?.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, lenis, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          id="site-menu"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-40 flex flex-col justify-between bg-fg pb-10 pt-28 text-bg"
          initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <ul className="container-x">
            {navLinks.map((l, i) => (
              <li key={l.href} className="mask-line">
                <m.div
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  exit={{ y: "110%" }}
                  transition={{ duration: 0.8, ease: EASE, delay: 0.15 + i * 0.06 }}
                >
                  <TransitionLink
                    href={l.href}
                    transitionTitle={l.label}
                    onClick={onClose}
                    className="group flex items-baseline gap-4 font-display text-[clamp(3rem,10vw,8rem)] font-bold leading-[0.95] tracking-[-0.05em]"
                  >
                    <span className="text-sm font-normal tracking-normal text-bg/50">0{i + 1}</span>
                    <span className="transition-transform duration-500 ease-cine group-hover:translate-x-4">
                      {l.label}
                    </span>
                  </TransitionLink>
                </m.div>
              </li>
            ))}
          </ul>
          <m.div
            className="container-x flex flex-wrap items-end justify-between gap-6 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <a href={`mailto:${site.email}`} className="underline-offset-4 hover:underline">
              {site.email}
            </a>
            <ul className="flex gap-6">
              {site.socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
