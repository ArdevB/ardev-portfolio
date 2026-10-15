import { site } from "@/lib/site";
import { HeroVisual } from "./HeroVisual";

const NAME = site.shortName.split("");

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col justify-between overflow-clip pb-[var(--gutter)] pt-28"
    >
      <div className="container-x relative z-10 flex items-start justify-between gap-6 text-sm">
        <p className="hero-fade max-w-[22ch] text-muted" style={{ "--d": "0.5s" } as React.CSSProperties}>
          Portfolio ©{new Date().getFullYear()} — {site.location}
        </p>
        <p className="hero-fade flex items-center gap-2 whitespace-nowrap" style={{ "--d": "0.6s" } as React.CSSProperties}>
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          Available for work
        </p>
      </div>

      <HeroVisual />

      <div className="container-x relative z-10">
        <div className="mb-6 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:gap-[5vw]">
          <p
            className="hero-fade max-w-[22ch] font-display text-[clamp(1.75rem,3.6vw,3.25rem)] font-medium leading-[1] tracking-[-0.03em]"
            style={{ "--d": "0.55s" } as React.CSSProperties}
          >
            {site.role}
          </p>
          <div
            className="hero-fade flex items-center gap-4 text-sm text-muted"
            style={{ "--d": "0.75s" } as React.CSSProperties}
          >
            <span className="relative block h-12 w-px overflow-clip bg-border" aria-hidden="true">
              <span className="scroll-indicator-dot absolute left-0 top-0 block h-1/3 w-px bg-fg" />
            </span>
            <span>Scroll to explore</span>
          </div>
        </div>

        <h1 id="hero-title" aria-label={`${site.name} — ${site.role}`} className="@container select-none">
          <span
            aria-hidden="true"
            className="mask-line -ml-[0.04em] w-fit whitespace-nowrap pr-[0.1em] font-display text-[clamp(3.5rem,31.5cqw,38rem)] font-bold leading-[0.78] tracking-[-0.06em]"
          >
            {NAME.map((c, i) => (
              <span key={i} className="hero-char" style={{ "--i": i } as React.CSSProperties}>
                {c}
              </span>
            ))}
          </span>
        </h1>
      </div>
    </section>
  );
}
