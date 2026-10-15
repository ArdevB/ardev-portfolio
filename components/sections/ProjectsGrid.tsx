"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { ProjectCard } from "@/components/ui/ProjectCard";
import type { PublicProject } from "@/lib/projects/types";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ProjectsGrid({ projects, now }: { projects: PublicProject[]; now: number }) {
  const [filter, setFilter] = useState<string>("All");

  const filters = useMemo(() => {
    const count = new Map<string, number>();
    for (const p of projects) {
      const keys = new Set([p.language, ...p.topics].filter(Boolean) as string[]);
      keys.forEach((k) => count.set(k, (count.get(k) ?? 0) + 1));
    }
    return ["All", ...Array.from(count.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k)];
  }, [projects]);

  const shown = filter === "All" ? projects : projects.filter((p) => p.language === filter || p.topics.includes(filter));

  return (
    <>
      <div role="group" aria-label="Filter projects" className="mb-10 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = f === filter;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f)}
              className={`relative rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
                active ? "border-fg text-bg" : "border-border hover:border-fg"
              }`}
            >
              {active && (
                <m.span
                  layoutId="filter-pill"
                  className="absolute inset-0 -z-0 rounded-full bg-fg"
                  transition={{ duration: 0.5, ease: EASE }}
                />
              )}
              <span className="relative">{f}</span>
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {shown.length} project{shown.length === 1 ? "" : "s"}
      </p>

      <m.ul layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((p, i) => (
            <m.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.8, ease: EASE, delay: (i % 3) * 0.08 }}
            >
              <ProjectCard project={p} now={now} />
            </m.li>
          ))}
        </AnimatePresence>
      </m.ul>
    </>
  );
}
