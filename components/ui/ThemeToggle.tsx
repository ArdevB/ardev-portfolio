"use client";

import { useId } from "react";
import { useTheme } from "@/hooks/useTheme";

/** Sun ↔ moon morph: the mask circle slides over the core, rays scale away. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const maskId = `moon-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      data-cursor="grow"
      className={`relative grid size-11 place-items-center rounded-full border border-current/20 transition-colors hover:border-current ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-5 overflow-visible" aria-hidden="true">
        <mask id={maskId}>
          <rect x="-4" y="-4" width="32" height="32" fill="white" />
          <circle
            cx="24"
            cy="4"
            r="7"
            fill="black"
            style={{
              transform: dark ? "translate(-6px, 3px)" : "translate(0, 0)",
              transition: "transform 0.6s cubic-bezier(0.76,0,0.24,1)",
            }}
          />
        </mask>
        <circle
          cx="12"
          cy="12"
          r="5"
          fill="currentColor"
          mask={`url(#${maskId})`}
          style={{
            transformOrigin: "12px 12px",
            transform: dark ? "scale(1.7)" : "scale(1)",
            transition: "transform 0.6s cubic-bezier(0.76,0,0.24,1)",
          }}
        />
        <g
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transformOrigin: "12px 12px",
            transform: dark ? "rotate(45deg) scale(0)" : "rotate(0) scale(1)",
            opacity: dark ? 0 : 1,
            transition: "transform 0.5s cubic-bezier(0.76,0,0.24,1), opacity 0.3s",
          }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="12" y1="1.5" x2="12" y2="3.5" transform={`rotate(${a} 12 12)`} />
          ))}
        </g>
      </svg>
    </button>
  );
}
