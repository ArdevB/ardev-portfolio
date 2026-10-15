"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = email;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        data-cursor="grow"
        className="group inline-flex items-center gap-3 border-b border-current pb-1 text-[clamp(1.1rem,2.2vw,1.75rem)] font-medium"
        aria-label={`Copy email address ${email}`}
      >
        {email}
        <svg viewBox="0 0 24 24" className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true">
          <rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[75] -translate-x-1/2">
        <AnimatePresence>
          {copied && (
            <m.div
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 rounded-full bg-fg px-5 py-3 text-sm text-bg shadow-lg"
              role="status"
            >
              <span className="grid size-5 place-items-center rounded-full bg-accent text-on-accent">
                <svg viewBox="0 0 24 24" className="size-3" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Email copied to clipboard
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
