import { InView } from "@/components/animations/InView";
import type { ContributionDay } from "@/lib/github/types";

const CELL = 11;
const GAP = 3;

/** Only numbers go into this markup, so there is nothing to escape. */
function svgMarkup(weeks: ContributionDay[][]) {
  const rects: string[] = [];
  weeks.forEach((week, wi) => {
    const offset = wi === 0 ? 7 - week.length : 0;
    week.forEach((d, di) => {
      const x = wi * (CELL + GAP);
      const y = (di + offset) * (CELL + GAP);
      rects.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" class="hm${d.level}"/>`);
    });
  });
  const w = weeks.length * (CELL + GAP) - GAP;
  const h = 7 * (CELL + GAP) - GAP;
  return `<svg width="${w}" height="${h}" class="hm-svg" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">${rects.join("")}</svg>`;
}

/**
 * Contribution graph. Rendered as one static SVG string (no per-cell React
 * nodes to hydrate) and revealed left → right with a clip-path wipe.
 */
export function Heatmap({ weeks, total }: { weeks: ContributionDay[][]; total: number }) {
  return (
    <figure>
      <div className="overflow-x-auto pb-2" tabIndex={0} role="region" aria-label="Contribution graph (scrollable)">
        <InView className="heatmap w-max">
          <div dangerouslySetInnerHTML={{ __html: svgMarkup(weeks) }} />
        </InView>
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
        <span>{total.toLocaleString("en-US")} contributions in the last year</span>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <svg key={l} width="11" height="11" aria-hidden="true">
              <rect width="11" height="11" rx="2" className={`hm${l}`} />
            </svg>
          ))}
          More
        </span>
      </figcaption>
    </figure>
  );
}
