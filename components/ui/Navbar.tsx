"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TransitionLink } from "./TransitionLink";
import { ThemeToggle } from "./ThemeToggle";
import { TextRoll } from "./TextRoll";
import { MenuOverlay } from "./MenuOverlay";
import { navLinks } from "@/lib/nav";

export function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (Math.abs(delta) > 4) {
          setHidden(delta > 0 && y > 120);
          lastY.current = y;
        }
        setScrolled(y > 24);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-cine ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 -z-10 bg-bg/80 backdrop-blur-md transition-opacity duration-500 ${
            scrolled && !open ? "opacity-100" : "opacity-0"
          }`}
        />
        <nav
          aria-label="Primary"
          className={`container-x flex h-20 items-center justify-between transition-colors duration-500 ${open ? "text-bg" : "text-fg"}`}
        >
          <TransitionLink
            href="/"
            transitionTitle="Home"
            className="group font-display text-xl font-bold tracking-tight"
          >
            <TextRoll>ARDEV©</TextRoll>
          </TransitionLink>

          <ul className={`hidden items-center gap-8 text-sm transition-opacity md:flex ${open ? "pointer-events-none opacity-0" : ""}`}>
            {navLinks.map((l) => (
              <li key={l.href}>
                <TransitionLink href={l.href} transitionTitle={l.label} className="group">
                  <TextRoll>{l.label}</TextRoll>
                </TransitionLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              data-cursor="grow"
              className={`relative grid size-11 place-items-center rounded-full transition-colors duration-500 ${
                open ? "bg-bg text-fg" : "bg-fg text-bg"
              }`}
            >
              <span className="sr-only">Menu</span>
              <span
                aria-hidden="true"
                className={`absolute h-px w-4 bg-current transition-transform duration-500 ease-cine ${
                  open ? "rotate-45" : "-translate-y-[3px]"
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute h-px w-4 bg-current transition-transform duration-500 ease-cine ${
                  open ? "-rotate-45" : "translate-y-[3px]"
                }`}
              />
            </button>
          </div>
        </nav>
      </header>
      <MenuOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
