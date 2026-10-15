"use client";

import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { ProjectCover } from "@/components/ui/ProjectCover";
import type { PublicProject } from "@/lib/projects/types";

/**
 * Pinned horizontal scroll on desktop; plain vertical stack on mobile and with
 * reduced motion (gsap.matchMedia reverts the pin automatically).
 */
export function FeaturedWork({ projects }: { projects: PublicProject[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGsap(
    section,
    ({ gsap }) => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const t = track.current!;
        const distance = () => t.scrollWidth - window.innerWidth;
        const tween = gsap.to(t, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            // measured before other triggers so the ones below include the pin's length
            refreshPriority: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        // inner image drift tied to the horizontal movement
        t.querySelectorAll<HTMLElement>("[data-drift]").forEach((img) => {
          gsap.fromTo(
            img,
            { xPercent: -6 },
            {
              xPercent: 6,
              ease: "none",
              scrollTrigger: { trigger: img, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
            },
          );
        });
      });
      mm.add("(max-width: 767px), (prefers-reduced-motion: reduce)", () => {
        gsap.utils.toArray<HTMLElement>("[data-card]").forEach((card) => {
          gsap.from(card, { opacity: 0, y: 40, duration: 0.9, scrollTrigger: { trigger: card, start: "top 88%", once: true } });
        });
      });
      return () => mm.revert();
    },
    [projects.length],
  );

  if (projects.length === 0) return null;

  // The wrapper is owned by React; GSAP inserts its pin-spacer *inside* it, so
  // unmounting on route change never trips over the moved node.
  return (
    <div>
    <section id="work" ref={section} aria-labelledby="work-title" className="relative scroll-mt-0 overflow-clip md:h-[100svh]">
      <div
        ref={track}
        className="flex flex-col gap-16 px-[var(--gutter)] py-24 md:h-full md:w-max md:flex-row md:items-center md:gap-[4vw] md:py-0"
      >
        <header className="flex shrink-0 flex-col justify-between md:h-[70svh] md:w-[34vw]">
          <h2 id="work-title" className="eyebrow">
            (02) Selected work
          </h2>
          <p className="mt-6 font-display text-[clamp(3rem,8vw,9rem)] font-bold leading-[0.85] tracking-[-0.055em]">
            Featured
            <br />
            <span className="text-accent-ink">projects</span>
          </p>
          <p className="mt-6 max-w-sm text-muted">
            A few things I&apos;ve designed and built end to end.<span className="hidden md:inline"> Keep scrolling — </span><span className="md:hidden"> </span>Each one opens a case study.
          </p>
        </header>

        {projects.map((p, i) => (
          <FeaturedCard key={p.id} project={p} index={i} total={projects.length} />
        ))}
      </div>
    </section>
    </div>
  );
}

function FeaturedCard({ project: p, index, total }: { project: PublicProject; index: number; total: number }) {
  const media = useRef<HTMLDivElement>(null);
  return (
    <article data-card className="w-full shrink-0 md:w-[min(62vw,68rem)]">
      <TransitionLink
        href={`/work/${p.slug}`}
        sharedRef={media}
        transitionTitle={p.title}
        data-cursor="view"
        data-cursor-label="View"
        className="group block"
        aria-label={`${p.title} — case study`}
      >
        <div ref={media} className="relative aspect-[16/10] overflow-clip rounded-sm bg-surface">
          {/* real images drift horizontally inside the frame; generated covers stay put so text never clips */}
          <div {...(p.cover ? { "data-drift": "" } : {})} className={`absolute inset-y-0 ${p.cover ? "-inset-x-[8%]" : "inset-x-0"}`}>
            <div className="absolute inset-0 transition-transform duration-[900ms] ease-cine group-hover:scale-[1.06]">
              <ProjectCover
                title={p.title}
                cover={p.cover}
                language={p.language}
                languageColor={p.languageColor}
                index={index}
                sizes="(min-width: 768px) 70vw, 100vw"
              />
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-start justify-between gap-6">
          <div>
            <h3 className="font-display text-[clamp(1.5rem,2.6vw,2.5rem)] font-semibold leading-none tracking-[-0.03em]">
              {p.title}
            </h3>
            {p.description && <p className="mt-2 line-clamp-2 max-w-xl text-muted">{p.description}</p>}
          </div>
          <span className="eyebrow shrink-0 tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
      </TransitionLink>
    </article>
  );
}
