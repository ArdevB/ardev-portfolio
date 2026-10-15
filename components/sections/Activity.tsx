import { getGitHub, getStats } from "@/lib/projects";
import { site } from "@/lib/site";
import { Counter } from "@/components/ui/Counter";
import { Heatmap } from "./Heatmap";

export function ActivityShell({ children }: { children: React.ReactNode }) {
  return (
    <section id="activity" aria-labelledby="activity-title" className="container-x scroll-mt-24 pb-[clamp(6rem,14vw,12rem)]">
      <div className="mb-12 flex items-baseline justify-between gap-6 border-b border-border pb-6">
        <h2 id="activity-title" className="eyebrow">
          (04) GitHub activity
        </h2>
        <span className="eyebrow">Last 12 months</span>
      </div>
      {children}
    </section>
  );
}

export async function Activity() {
  const snapshot = await getGitHub();
  const stats = getStats(snapshot);
  if (!stats) {
    return (
      <p className="text-muted">
        Activity is unavailable right now — see{" "}
        <a className="underline underline-offset-4" href={`https://github.com/${site.githubUsername}`}>
          my GitHub profile
        </a>
        .
      </p>
    );
  }

  const items = [
    { label: "Public repositories", value: stats.repos },
    stats.stars > 0
      ? { label: "Stars earned", value: stats.stars }
      : { label: "Languages used", value: stats.languageCount },
    ...(stats.contributions !== null ? [{ label: "Contributions this year", value: stats.contributions }] : []),
  ];

  return (
    <div className="grid gap-16 lg:grid-cols-12">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:col-span-5 lg:grid-cols-1">
        {items.map((it) => (
          <div key={it.label}>
            <dt className="eyebrow mb-2">{it.label}</dt>
            <dd className="font-display text-[clamp(3rem,7vw,6rem)] font-bold leading-none tracking-[-0.05em]">
              <Counter value={it.value} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-12 lg:col-span-7">
        {snapshot?.contributions && <Heatmap weeks={snapshot.contributions.weeks} total={snapshot.contributions.total} />}

        {stats.languages.length > 0 && (
          <div>
            <h3 className="eyebrow mb-4">Top languages</h3>
            <div className="flex h-2.5 w-full overflow-clip rounded-full" aria-hidden="true">
              {stats.languages.map((l) => (
                <span key={l.name} style={{ width: `${l.share * 100}%`, background: l.color ?? "var(--muted)" }} />
              ))}
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {stats.languages.map((l) => (
                <li key={l.name} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: l.color ?? "var(--muted)" }} aria-hidden="true" />
                  {l.name}
                  <span className="text-muted tabular-nums">{(l.share * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="grid gap-16 lg:grid-cols-12" aria-hidden="true">
      <div className="grid grid-cols-2 gap-10 lg:col-span-5 lg:grid-cols-1">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="skeleton mb-3 h-3 w-32 rounded" />
            <div className="skeleton h-16 w-40 rounded" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-7">
        <div className="skeleton h-[95px] w-full rounded" />
        <div className="skeleton mt-12 h-2.5 w-full rounded-full" />
      </div>
    </div>
  );
}
