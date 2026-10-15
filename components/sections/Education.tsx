import { site } from "@/lib/site";
import { RevealText } from "@/components/animations/RevealText";
import { EducationAnimator } from "./EducationAnimator";

/**
 * Scroll-driven timeline: the accent line grows as you scroll, each milestone
 * pops its node, slides its card in from alternating sides, and a giant ghost
 * label drifts behind it. The current stage shows a segmented semester ring.
 */
export function Education() {
  const steps = site.education;
  return (
    <section id="education" aria-labelledby="education-title" className="container-x scroll-mt-24 pb-[clamp(6rem,14vw,12rem)]">
      <div className="mb-12 flex items-baseline justify-between gap-6 border-b border-border pb-6">
        <h2 id="education-title" className="eyebrow">
          Education
        </h2>
        <span className="eyebrow">{steps.length} milestones</span>
      </div>
      <RevealText as="p" className="text-headline mb-20 max-w-4xl">
        The journey so far — from Dharan classrooms to computer science.
      </RevealText>

      <EducationAnimator>
        <ol className="relative">
          {/* track + scrubbed progress line */}
          <span aria-hidden="true" className="absolute bottom-0 left-[19px] top-0 w-px bg-border md:left-1/2" />
          <span
            aria-hidden="true"
            data-edu-line
            className="absolute bottom-0 left-[19px] top-0 w-px origin-top bg-accent md:left-1/2"
          />

          {steps.map((s, i) => {
            const right = i % 2 === 1;
            const now = !!s.progress;
            return (
              <li key={s.mark} data-edu-step data-side={right ? "right" : "left"} className="relative grid pb-20 last:pb-0 md:grid-cols-2 md:gap-24">
                {/* node */}
                <span aria-hidden="true" data-edu-dot className="absolute left-[19px] top-8 z-10 -translate-x-1/2 md:left-1/2">
                  <span className="relative grid size-10 place-items-center rounded-full border border-border bg-bg">
                    {now && <span className="absolute inset-0 animate-ping rounded-full bg-accent/30 motion-reduce:hidden" />}
                    <span className={`relative size-3 rounded-full ${now ? "bg-accent" : "bg-fg"}`} />
                  </span>
                </span>

                {/* giant ghost label — sits in the empty half, opposite its card */}
                <span
                  aria-hidden="true"
                  data-edu-ghost
                  className={`pointer-events-none absolute top-6 hidden select-none font-display text-[clamp(7rem,15vw,14rem)] font-bold leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_var(--border)] md:block ${
                    right ? "right-[calc(50%+4rem)]" : "left-[calc(50%+4rem)]"
                  } ${now ? "[-webkit-text-stroke:1.5px_color-mix(in_oklab,var(--accent)_55%,transparent)]" : ""}`}
                >
                  {s.mark}
                </span>

                <div className={`relative pl-16 md:pl-0 ${right ? "md:col-start-2" : "md:col-start-1 md:text-right"}`}>


                  {/* GSAP slides this wrapper; the article's own hover lift stays in CSS */}
                  <div data-edu-card>
                  <article
                    className={`group relative overflow-clip rounded-3xl border bg-bg/80 p-7 backdrop-blur-sm transition-[border-color,transform,box-shadow] duration-500 ease-expo hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3)] md:p-9 ${
                      now ? "border-accent/50" : "border-border hover:border-fg/25"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute -top-16 size-40 rounded-full bg-accent opacity-[0.07] blur-2xl transition-transform duration-700 ease-expo group-hover:scale-[1.8] ${
                        right ? "-right-16" : "-right-16 md:-left-16 md:right-auto"
                      }`}
                    />
                    <div className={`relative flex flex-wrap items-center gap-3 ${right ? "" : "md:justify-end"}`}>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] ${
                          now ? "bg-accent text-on-accent" : "bg-surface text-muted"
                        }`}
                      >
                        {s.period}
                      </span>
                      <span className="font-display text-sm text-muted tabular-nums">0{i + 1}</span>
                    </div>

                    <h3 className="relative mt-6 font-display text-[clamp(1.6rem,2.6vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
                      {s.title}
                    </h3>
                    <p className="relative mt-3 text-muted">{s.place}</p>

                    <ul className={`relative mt-6 flex flex-wrap gap-2 ${right ? "" : "md:justify-end"}`}>
                      {s.chips.map((c) => (
                        <li key={c} data-edu-chip className="rounded-full border border-border px-3 py-1.5 text-xs">
                          {c}
                        </li>
                      ))}
                    </ul>

                    {s.progress && <SemesterRing {...s.progress} alignEnd={!right} />}
                  </article>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </EducationAnimator>
    </section>
  );
}

/** Segmented ring: one arc per semester; completed ones fill with the accent. */
function SemesterRing({ label, current, total, alignEnd }: { label: string; current: number; total: number; alignEnd: boolean }) {
  const r = 34;
  const gap = 0.06; // radians between segments
  const seg = (Math.PI * 2) / total;
  const arc = (k: number) => {
    const a0 = -Math.PI / 2 + k * seg + gap / 2;
    const a1 = a0 + seg - gap;
    const p = (a: number) => `${(40 + r * Math.cos(a)).toFixed(2)} ${(40 + r * Math.sin(a)).toFixed(2)}`;
    return `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`;
  };
  return (
    <div className={`relative mt-8 flex items-center gap-5 border-t border-border pt-6 ${alignEnd ? "md:flex-row-reverse md:text-right" : ""}`}>
      <svg viewBox="0 0 80 80" className="size-20 shrink-0" role="img" aria-label={`${label} ${current} of ${total}`}>
        {Array.from({ length: total }).map((_, k) => (
          <path
            key={k}
            d={arc(k)}
            data-edu-seg
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={k < current - 1 ? "stroke-accent" : k === current - 1 ? "animate-pulse stroke-accent/60" : "stroke-border"}
            style={{ transformOrigin: "40px 40px" }}
          />
        ))}
        <text x="40" y="46" textAnchor="middle" className="fill-fg font-display text-[18px] font-bold">
          {current}/{total}
        </text>
      </svg>
      <div>
        <p className="eyebrow">
          {label} {current} of {total} · in progress
        </p>
        <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
          {Math.round(((current - 1) / total) * 100)}%<span className="text-muted"> of the degree done</span>
        </p>
      </div>
    </div>
  );
}
