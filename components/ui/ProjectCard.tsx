"use client";

import { useRef } from "react";
import { relativeTime } from "@/lib/utils";
import type { PublicProject } from "@/lib/projects/types";

/**
 * GitHub project card: 3D tilt + a spotlight that follows the cursor.
 * Both are transform/opacity only. Used on the site and in the admin preview.
 */
export function ProjectCard({ project: p, now }: { project: PublicProject; now?: number }) {
  const card = useRef<HTMLDivElement>(null);
  const light = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = card.current, l = light.current;
    if (!el || !l) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const rx = ((y / r.height) - 0.5) * -8;
      const ry = ((x / r.width) - 0.5) * 8;
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
      l.style.transform = `translate3d(${x - 200}px, ${y - 200}px, 0)`;
    });
  };
  const onEnter = () => {
    if (card.current) card.current.style.willChange = "transform";
    if (light.current) light.current.style.opacity = "1";
  };
  const onLeave = () => {
    cancelAnimationFrame(raf.current);
    if (card.current) {
      card.current.style.transform = "";
      card.current.style.willChange = "";
    }
    if (light.current) light.current.style.opacity = "0";
  };

  const updated = relativeTime(p.updatedAt, now);

  return (
    <div
      ref={card}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className="group relative flex h-full flex-col overflow-clip rounded-md border border-border bg-bg p-6 transition-[transform,border-color] duration-500 ease-expo hover:border-fg/30"
    >
      <div
        ref={light}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 size-[400px] rounded-full opacity-0 transition-opacity duration-500"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 22%, transparent), transparent 65%)" }}
      />
      <div className="relative">
        <h3 className="font-display text-2xl font-semibold leading-tight tracking-[-0.02em]">{p.title}</h3>
      </div>
      <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
        {p.description || "No description yet."}
      </p>

      {p.topics.length > 0 && (
        <ul className="relative mt-5 flex flex-wrap gap-1.5" aria-label="Topics">
          {p.topics.slice(0, 5).map((t) => (
            <li key={t} className="rounded-full bg-surface px-2.5 py-1 text-xs">
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="relative mt-auto pt-6">
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {p.language && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Language</dt>
              <span className="size-2.5 rounded-full" style={{ background: p.languageColor ?? "var(--muted)" }} aria-hidden="true" />
              <dd>{p.language}</dd>
            </div>
          )}
          {p.source === "github" && (
            <>
              <div className="flex items-center gap-1">
                <dt className="sr-only">Stars</dt>
                <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true"><path fill="currentColor" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" /></svg>
                <dd>{p.stars}</dd>
              </div>
              <div className="flex items-center gap-1">
                <dt className="sr-only">Forks</dt>
                <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true"><path fill="currentColor" d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" /></svg>
                <dd>{p.forks}</dd>
              </div>
            </>
          )}
          {updated && (
            <div>
              <dt className="sr-only">Last updated</dt>
              <dd>Updated {updated}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 flex gap-2">
          {p.repoUrl && (
            <a
              href={p.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-fg hover:bg-fg hover:text-bg"
            >
              Code<span className="sr-only"> for {p.title} on GitHub</span>
            </a>
          )}
          {p.homepage && (
            <a
              href={p.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-on-accent"
            >
              Live ↗<span className="sr-only"> demo of {p.title}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
