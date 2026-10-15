"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";

type NavigateOptions = { title?: string; sharedElement?: HTMLElement | null };
type Ctx = { navigate: (href: string, opts?: NavigateOptions) => void };

const TransitionContext = createContext<Ctx>({ navigate: () => {} });
export const usePageTransition = () => useContext(TransitionContext);

const EASE = [0.76, 0, 0.24, 1] as const;

type DocVT = Document & {
  startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void> };
};

/**
 * Route transitions:
 *  - default: a full-screen panel wipes up with the destination title, the
 *    route changes underneath, then the panel wipes away.
 *  - project cards: a shared-element morph (View Transitions API) from the
 *    card image into the case-study hero; falls back to the panel.
 */
export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "cover" | "covered" | "reveal">("idle");
  const [title, setTitle] = useState("");
  const pendingHref = useRef<string | null>(null);
  const resolveVT = useRef<(() => void) | null>(null);
  const lastPath = useRef(pathname);

  const navigate = useCallback(
    (href: string, opts: NavigateOptions = {}) => {
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) {
        router.push(href, { scroll: false });
        return;
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        router.push(href);
        return;
      }
      const doc = document as DocVT;
      if (opts.sharedElement && doc.startViewTransition) {
        const el = opts.sharedElement;
        el.style.viewTransitionName = "project-hero";
        const vt = doc.startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              const timeout = window.setTimeout(resolve, 2500);
              resolveVT.current = () => {
                window.clearTimeout(timeout);
                resolve();
              };
              el.style.viewTransitionName = "";
              router.push(href);
            }),
        );
        // Old snapshot is captured before the callback runs, so the name is
        // read from the card; the new page's hero carries the same name.
        vt.finished.finally(() => {
          resolveVT.current = null;
        });
        return;
      }
      pendingHref.current = href;
      setTitle(opts.title ?? "");
      setPhase("cover");
    },
    [router],
  );

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (resolveVT.current) {
      const r = resolveVT.current;
      requestAnimationFrame(() => requestAnimationFrame(r));
    }
    if (phase === "covered") setPhase("reveal");
  }, [pathname, phase]);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <AnimatePresence>
        {phase !== "idle" && (
          <m.div
            key="route-panel"
            aria-hidden="true"
            className="fixed inset-0 z-[70] grid place-items-center bg-fg text-bg"
            initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
            animate={
              phase === "reveal" ? { clipPath: "inset(0% 0% 100% 0%)" } : { clipPath: "inset(0% 0% 0% 0%)" }
            }
            transition={{ duration: 0.75, ease: EASE }}
            onAnimationComplete={() => {
              if (phase === "cover" && pendingHref.current) {
                const href = pendingHref.current;
                pendingHref.current = null;
                setPhase("covered");
                router.push(href);
              } else if (phase === "reveal") {
                setPhase("idle");
              }
            }}
          >
            <m.span
              className="text-headline px-6 text-center"
              initial={{ y: "60%", opacity: 0 }}
              animate={phase === "reveal" ? { y: "-60%", opacity: 0 } : { y: "0%", opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE, delay: phase === "reveal" ? 0 : 0.2 }}
            >
              {title}
            </m.span>
          </m.div>
        )}
      </AnimatePresence>
    </TransitionContext.Provider>
  );
}
