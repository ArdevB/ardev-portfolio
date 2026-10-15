/**
 * Pure helpers that merge GitHub repo data with admin overrides. Shared by the
 * public site (server) and the admin live preview (client) so both render the
 * exact same card.
 */
import type { ProjectRow } from "@/lib/db/schema";
import type { GhRepo } from "@/lib/github/types";
import { languageColors } from "@/lib/github/colors";
import { prettifyRepoName, slugify } from "@/lib/utils";
import type { PublicProject } from "./types";

/** Row shape after crossing a serialisation boundary (dates become strings). */
export type SerializedRow = Omit<ProjectRow, "createdAt" | "updatedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function fromRepo(repo: GhRepo, order: number, row?: SerializedRow): PublicProject {
  return {
    id: row ? String(row.id) : `gh-${repo.name}`,
    slug: row?.slug ?? slugify(repo.name),
    source: "github",
    title: row?.title || prettifyRepoName(repo.name),
    description: row?.description || repo.description,
    repoName: repo.name,
    repoUrl: repo.url,
    homepage: row?.liveUrl || repo.homepage,
    language: repo.language,
    languageColor: repo.languageColor ?? (repo.language ? (languageColors[repo.language] ?? null) : null),
    stars: repo.stars,
    forks: repo.forks,
    updatedAt: repo.pushedAt,
    topics: Array.from(new Set([...(row?.tags ?? []), ...repo.topics])),
    cover: row?.coverImage || null,
    featured: row?.featured ?? false,
    order,
    caseStudy: { role: row?.role ?? null, year: row?.year ?? null, summary: row?.summary ?? null, body: row?.body ?? null },
  };
}

export function fromManual(row: SerializedRow, order: number): PublicProject {
  return {
    id: String(row.id),
    slug: row.slug,
    source: "manual",
    title: row.title || row.slug,
    description: row.description,
    repoName: null,
    repoUrl: row.repoUrl,
    homepage: row.liveUrl,
    language: row.language,
    languageColor: row.language ? (languageColors[row.language] ?? null) : null,
    stars: 0,
    forks: 0,
    updatedAt: new Date(row.updatedAt).toISOString(),
    topics: row.tags,
    cover: row.coverImage,
    featured: row.featured,
    order,
    caseStudy: { role: row.role, year: row.year, summary: row.summary, body: row.body },
  };
}
