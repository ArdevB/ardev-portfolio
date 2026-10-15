import { site } from "@/lib/site";
import { RevealText } from "@/components/animations/RevealText";
import { MagneticGroup } from "@/components/ui/MagneticGroup";
import { SkillsAnimator } from "./SkillsAnimator";

// Bento layout: how many of the 6 desktop columns each category spans, plus its look.
const LAYOUT: Record<string, { span: string; tone: "plain" | "accent" | "ink" }> = {
  Frontend: { span: "lg:col-span-4", tone: "accent" },
  Backend: { span: "lg:col-span-2", tone: "plain" },
  Languages: { span: "lg:col-span-2", tone: "plain" },
  "Data / ML": { span: "lg:col-span-2", tone: "plain" },
  Ship: { span: "lg:col-span-2", tone: "plain" },
  "AI tools": { span: "lg:col-span-3", tone: "ink" },
  Business: { span: "lg:col-span-3", tone: "plain" },
};

// Parallax depth per card (px travelled across the viewport); alternating signs = layered feel.
const SHIFTS = [-24, 36, 18, -18, 30, -22, 28];

/** Background motion layer: a scroll-rotated ring of tool names + floating shapes with depth. */
function StackDecor({ tools }: { tools: string[] }) {
  // keep the ring text to roughly one circumference so it closes neatly
  let ringText = "";
  for (const t of tools) {
    if ((ringText + t + " • ").length > 104) break;
    ringText += t + " • ";
  }
  const shapes: { cls: string; depth: number; el: React.ReactNode }[] = [
    { cls: "left-[4%] top-[14%] hidden md:block", depth: -1.4, el: <span className="block size-16 rounded-full border border-fg/25" /> },
    { cls: "right-[6%] top-[30%]", depth: 2.2, el: <span className="block size-5 rounded-full bg-accent" /> },
    {
      cls: "left-[46%] top-[6%] hidden md:block",
      depth: 1.2,
      el: (
        <svg viewBox="0 0 24 24" className="size-8 text-fg/40">
          <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    { cls: "right-[28%] bottom-[24%] hidden md:block", depth: -1.8, el: <span className="block size-10 rotate-12 rounded-lg border border-fg/25" /> },
    { cls: "left-[10%] bottom-[34%]", depth: 1.6, el: <span className="block size-3 rounded-full bg-fg/60" /> },
    { cls: "right-[3%] bottom-[10%] hidden md:block", depth: 2.6, el: <span className="block size-24 rounded-full border-2 border-accent/50" /> },
    { cls: "left-[30%] bottom-[8%] hidden lg:block", depth: -1, el: <span className="block h-px w-24 bg-fg/30" /> },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      <div data-ring className="absolute -right-[22rem] top-[10%] size-[44rem] opacity-60 md:-right-[14rem]">
        <svg viewBox="0 0 400 400" className="size-full">
          <defs>
            <path id="stack-ring" d="M200,200 m-170,0 a170,170 0 1,1 340,0 a170,170 0 1,1 -340,0" />
          </defs>
          <circle cx="200" cy="200" r="190" fill="none" className="stroke-border" strokeDasharray="2 6" />
          <circle cx="200" cy="200" r="150" fill="none" className="stroke-border" />
          <text className="fill-muted text-[11px] uppercase" style={{ letterSpacing: "0.28em" }}>
            <textPath href="#stack-ring">{ringText}</textPath>
          </text>
        </svg>
      </div>
      {shapes.map((s, i) => (
        <div key={i} data-shape data-depth={s.depth} className={`absolute ${s.cls}`}>
          <div data-shape-inner>{s.el}</div>
        </div>
      ))}
    </div>
  );
}

export function Skills() {
  const all = site.skills.flatMap((g) => g.items);
  const total = all.length;

  return (
    <section id="stack" aria-labelledby="stack-title" className="relative scroll-mt-24 overflow-x-clip py-[clamp(6rem,14vw,12rem)]">
      <SkillsAnimator>
      <StackDecor tools={all} />
      <div className="container-x relative z-10">
        <div className="mb-12 flex items-baseline justify-between gap-6 border-b border-border pb-6">
          <h2 id="stack-title" className="eyebrow">
            (05) Skills &amp; stack
          </h2>
          <span className="eyebrow">
            {total} tools · {site.skills.length} disciplines
          </span>
        </div>
        <RevealText as="p" className="text-headline mb-16 max-w-5xl">
          A full-stack toolkit, from pixels to production.
        </RevealText>

          <MagneticGroup className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-6">
            {site.skills.map((g, gi) => {
              const l = LAYOUT[g.group] ?? { span: "lg:col-span-2", tone: "plain" as const };
              const toneClass =
                l.tone === "ink"
                  ? "border-transparent bg-fg text-bg"
                  : l.tone === "accent"
                    ? "border-accent/40 bg-bg"
                    : "border-border bg-bg";
              return (
                <div
                  key={g.group}
                  data-parallax
                  data-shift={SHIFTS[gi % SHIFTS.length]}
                  className={`${l.span} ${gi === 0 ? "sm:col-span-2" : ""}`}
                >
                <article
                  data-skill-card
                  className={`group relative flex h-full min-h-64 flex-col justify-between overflow-clip rounded-3xl border p-6 md:p-8 ${toneClass}`}
                >
                  {/* cursor spotlight (moved with transform) */}
                  <span
                    aria-hidden="true"
                    data-glow
                    className="pointer-events-none absolute left-0 top-0 size-[420px] rounded-full opacity-0 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle, color-mix(in oklab, var(--accent) ${l.tone === "ink" ? 35 : 20}%, transparent), transparent 65%)`,
                    }}
                  />
                  {/* giant outlined index (outer: scroll drift, inner: hover tilt) */}
                  <span aria-hidden="true" data-ghost className="pointer-events-none absolute -bottom-10 -right-2">
                  <span
                    className={`block select-none font-display text-[10rem] font-bold leading-none tracking-[-0.06em] text-transparent transition-transform duration-[900ms] ease-expo group-hover:-translate-y-4 group-hover:-rotate-6 ${
                      l.tone === "ink" ? "[-webkit-text-stroke:1px_color-mix(in_oklab,var(--bg)_25%,transparent)]" : "[-webkit-text-stroke:1px_var(--border)]"
                    }`}
                  >
                    {String(gi + 1).padStart(2, "0")}
                  </span>
                  </span>
                  {l.tone === "accent" && (
                    <span aria-hidden="true" data-orb className="pointer-events-none absolute -right-16 -top-16">
                      <span className="block size-56 rounded-full bg-accent opacity-90 transition-transform duration-[1200ms] ease-expo group-hover:scale-125" />
                    </span>
                  )}

                  <header className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.18em] ${l.tone === "ink" ? "text-bg/60" : "text-muted"}`}>
                        {String(gi + 1).padStart(2, "0")} — {g.items.length} tools
                      </p>
                      <h3
                        data-scramble
                        aria-label={g.group}
                        className="mt-3 font-display text-[clamp(2rem,3.4vw,3.25rem)] font-bold leading-none tracking-[-0.045em]"
                      >
                        {g.group}
                      </h3>
                    </div>
                  </header>

                  <ul className="relative mt-10 flex flex-wrap gap-2">
                    {g.items.map((s) => (
                      <li key={s} data-skill-pill>
                        <span
                          data-magnetic
                          data-cursor="grow"
                          className={`inline-block rounded-full border px-4 py-2 text-sm backdrop-blur-sm transition-colors duration-300 ${
                            l.tone === "ink"
                              ? "border-bg/20 hover:border-accent hover:bg-accent hover:text-on-accent"
                              : "border-border bg-bg/60 hover:border-fg hover:bg-fg hover:text-bg"
                          }`}
                        >
                          {s}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
                </div>
              );
            })}
          </MagneticGroup>
      </div>

      {/* two counter-scrolling rows of every tool */}
      <div className="mt-20 flex flex-col gap-4 overflow-x-clip" aria-hidden="true">
        {[0, 1].map((row) => (
          <div key={row} data-row={row} className="skill-marquee-wrap">
            <div className={`skill-marquee ${row === 1 ? "skill-marquee-reverse" : ""}`}>
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0 items-center">
                  {(row === 0 ? all : [...all].reverse()).map((s, i) => (
                    <span key={`${copy}-${i}`} className="flex items-center">
                      <span
                        className={`whitespace-nowrap px-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-none tracking-[-0.045em] ${
                          (i + row) % 2 === 0 ? "text-fg" : "text-transparent [-webkit-text-stroke:1.5px_var(--fg)]"
                        }`}
                      >
                        {s}
                      </span>
                      <span className="size-3 shrink-0 rounded-full bg-accent" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      </SkillsAnimator>
    </section>
  );
}
