import { getProjects } from "@/lib/projects";
import { site } from "@/lib/site";
import { ProjectsGrid } from "./ProjectsGrid";
import { RevealText } from "@/components/animations/RevealText";

export function GitHubProjectsShell({ children }: { children: React.ReactNode }) {
  return (
    <section id="projects" aria-labelledby="projects-title" className="container-x scroll-mt-24 py-[clamp(6rem,14vw,12rem)]">
      <div className="mb-12 flex items-baseline justify-between gap-6 border-b border-border pb-6">
        <h2 id="projects-title" className="eyebrow">
          (03) Open source
        </h2>
        <a
          href={`https://github.com/${site.githubUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="eyebrow hover:text-fg"
        >
          github.com/{site.githubUsername} ↗
        </a>
      </div>
      <RevealText as="p" className="text-headline mb-12 max-w-5xl">
        Live from GitHub — code I&apos;ve shipped in the open.
      </RevealText>
      {children}
    </section>
  );
}

export async function GitHubProjects() {
  const { grid } = await getProjects();
  const now = Date.now();
  if (grid.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-10 text-center">
        <p className="text-lg">Projects are taking a short break from loading.</p>
        <p className="mt-2 text-muted">
          Browse them directly on{" "}
          <a className="underline underline-offset-4" href={`https://github.com/${site.githubUsername}`} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          .
        </p>
      </div>
    );
  }
  return <ProjectsGrid projects={grid} now={now} />;
}

export function ProjectsGridSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-10 flex gap-2">
        {[64, 96, 80, 72].map((w, i) => (
          <div key={i} className="skeleton h-9 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex h-72 flex-col rounded-md border border-border p-6">
            <div className="skeleton h-7 w-2/3 rounded" />
            <div className="skeleton mt-4 h-4 w-full rounded" />
            <div className="skeleton mt-2 h-4 w-4/5 rounded" />
            <div className="mt-auto flex gap-3">
              <div className="skeleton h-4 w-16 rounded" />
              <div className="skeleton h-4 w-10 rounded" />
            </div>
            <div className="mt-5 flex gap-2">
              <div className="skeleton h-9 w-20 rounded-full" />
              <div className="skeleton h-9 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
