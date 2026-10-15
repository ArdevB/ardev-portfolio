import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug, getProjects } from "@/lib/projects";
import { site } from "@/lib/site";
import { ProjectCover } from "@/components/ui/ProjectCover";
import { RevealText } from "@/components/animations/RevealText";
import { FadeIn } from "@/components/animations/FadeIn";
import { TransitionLink } from "@/components/ui/TransitionLink";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { featured, grid } = await getProjects();
  return Array.from(new Set([...featured, ...grid].map((p) => p.slug))).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await getProjectBySlug(slug);
  if (!found) return { title: "Not found" };
  const { project: p } = found;
  const description = p.caseStudy.summary ?? p.description ?? `${p.title} — a project by ${site.name}.`;
  return {
    title: p.title,
    description,
    alternates: { canonical: `/work/${p.slug}` },
    openGraph: { type: "article", url: `${site.url}/work/${p.slug}`, title: `${p.title} — ${site.name}`, description },
    twitter: { card: "summary_large_image", title: `${p.title} — ${site.name}`, description },
  };
}

/** Plain-text body: blank line = paragraph, "## " = heading. No HTML is ever injected. */
function Body({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-6 text-lg leading-relaxed text-fg/85">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) {
          const [head, ...rest] = b.split("\n");
          return (
            <div key={i} className="space-y-4 pt-6">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-fg">{head!.slice(3)}</h2>
              {rest.length > 0 && <p>{rest.join(" ")}</p>}
            </div>
          );
        }
        return <p key={i}>{b.replace(/\n/g, " ")}</p>;
      })}
    </div>
  );
}

export default async function CaseStudy({ params }: Params) {
  const { slug } = await params;
  const found = await getProjectBySlug(slug);
  if (!found) notFound();
  const { project: p, next } = found;

  const meta = [
    { label: "Role", value: p.caseStudy.role ?? "Design & development" },
    { label: "Year", value: p.caseStudy.year ?? (p.updatedAt ? String(new Date(p.updatedAt).getFullYear()) : "—") },
    { label: "Stack", value: [p.language, ...p.topics].filter(Boolean).slice(0, 5).join(", ") || "—" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    description: p.caseStudy.summary ?? p.description ?? undefined,
    url: `${site.url}/work/${p.slug}`,
    author: { "@type": "Person", name: site.name, url: site.url },
    ...(p.repoUrl ? { codeRepository: p.repoUrl } : {}),
  };

  return (
    <article className="pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="container-x">
        <TransitionLink href="/#work" transitionTitle="Work" className="eyebrow group inline-flex items-center gap-2 hover:text-fg">
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> All work
        </TransitionLink>
        <RevealText
          as="h1"
          type="chars"
          className="mt-8 break-words font-display text-[clamp(3.25rem,11vw,11rem)] font-bold leading-[0.85] tracking-[-0.05em]"
        >
          {p.title}
        </RevealText>

        <dl className="mt-12 grid gap-6 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map((m) => (
            <div key={m.label}>
              <dt className="eyebrow mb-2">{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
          <div>
            <dt className="eyebrow mb-2">Links</dt>
            <dd className="flex flex-wrap gap-x-4 gap-y-1">
              {p.homepage && (
                <a href={p.homepage} target="_blank" rel="noopener noreferrer" className="underline decoration-accent underline-offset-4 hover:text-accent-ink">
                  Live site ↗
                </a>
              )}
              {p.repoUrl && (
                <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-4 hover:decoration-fg">
                  Source ↗
                </a>
              )}
              {!p.homepage && !p.repoUrl && "—"}
            </dd>
          </div>
        </dl>
      </header>

      <div className="container-x mt-12">
        <div className="relative aspect-[16/9] overflow-clip rounded-sm bg-surface" style={{ viewTransitionName: "project-hero" }}>
          <ProjectCover
            title={p.title}
            cover={p.cover}
            language={p.language}
            languageColor={p.languageColor}
            index={p.order}
            sizes="(min-width: 1600px) 1500px, 100vw"
            priority
          />
        </div>
      </div>

      <div className="container-x grid gap-12 py-[clamp(5rem,10vw,9rem)] lg:grid-cols-12">
        <FadeIn className="lg:col-span-5">
          <p className="font-display text-[clamp(1.6rem,2.8vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.02em]">
            {p.caseStudy.summary ?? p.description ?? "Details coming soon."}
          </p>
        </FadeIn>
        <div className="lg:col-span-6 lg:col-start-7">
          {p.caseStudy.body ? (
            <Body text={p.caseStudy.body} />
          ) : (
            <p className="text-lg text-muted">
              A full write-up is on the way. In the meantime, {p.homepage ? "try the live site or " : ""}browse the source on GitHub.
            </p>
          )}
        </div>
      </div>

      {next && (
        <TransitionLink
          href={`/work/${next.slug}`}
          transitionTitle={next.title}
          data-cursor="view"
          data-cursor-label="Next"
          className="group block border-t border-border"
        >
          <div className="container-x flex flex-col gap-4 py-16 md:flex-row md:items-end md:justify-between md:py-24">
            <span className="eyebrow">Next project</span>
            <span className="font-display text-[clamp(2.75rem,8vw,8rem)] font-bold leading-[0.9] tracking-[-0.05em] transition-transform duration-700 ease-cine group-hover:-translate-x-3">
              {next.title} <span className="inline-block text-accent-ink transition-transform duration-700 ease-cine group-hover:translate-x-6">→</span>
            </span>
          </div>
        </TransitionLink>
      )}
    </article>
  );
}
