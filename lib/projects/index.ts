import "server-only";
import { unstable_cache } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { ProjectRow } from "@/lib/db/schema";
import { fetchPublicGitHub } from "@/lib/github/client";
import type { GitHubSnapshot } from "@/lib/github/types";
import { languageColors } from "@/lib/github/colors";
import { fromManual, fromRepo } from "./merge";
import type { PublicProject } from "./types";

export const TAGS = { github: "github", projects: "projects" } as const;
const SNAPSHOT_KEY = "public";

async function saveSnapshot(s: GitHubSnapshot) {
  const db = getDb();
  if (!db) return;
  try {
    await db
      .insert(schema.githubSnapshots)
      .values({ key: SNAPSHOT_KEY, data: s, updatedAt: new Date() })
      .onConflictDoUpdate({ target: schema.githubSnapshots.key, set: { data: s, updatedAt: new Date() } });
  } catch (e) {
    console.warn("[github] could not persist snapshot", e);
  }
}

async function loadSnapshot(): Promise<GitHubSnapshot | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const [row] = await db.select().from(schema.githubSnapshots).where(eq(schema.githubSnapshots.key, SNAPSHOT_KEY));
    return (row?.data as GitHubSnapshot | undefined) ?? null;
  } catch {
    return null;
  }
}

/**
 * Cached for an hour (tag "github"). The inner function throws on failure,
 * so Next keeps serving the previous cache entry; on a cold cache we fall
 * back to the snapshot persisted in Postgres. Never throws.
 */
const cachedGitHub = unstable_cache(
  async () => {
    const snap = await fetchPublicGitHub();
    await saveSnapshot(snap);
    return snap;
  },
  ["github-public-v1"],
  { revalidate: 3600, tags: [TAGS.github] },
);

export async function getGitHub(): Promise<GitHubSnapshot | null> {
  try {
    return await cachedGitHub();
  } catch (e) {
    console.warn("[github] live fetch failed, serving last snapshot", e instanceof Error ? e.message : e);
    return loadSnapshot();
  }
}

const cachedRows = unstable_cache(
  async (): Promise<ProjectRow[] | null> => {
    const db = getDb();
    if (!db) return null;
    return db.select().from(schema.projects).orderBy(asc(schema.projects.sortOrder), asc(schema.projects.id));
  },
  ["project-rows-v1"],
  { revalidate: 3600, tags: [TAGS.projects] },
);

async function getRows(): Promise<ProjectRow[] | null> {
  try {
    return await cachedRows();
  } catch (e) {
    console.warn("[db] could not load project settings", e instanceof Error ? e.message : e);
    return null;
  }
}

export type ProjectsData = {
  /** Shown in the GitHub Projects grid (visible). */
  grid: PublicProject[];
  /** Shown in Featured Work + case studies. */
  featured: PublicProject[];
  snapshot: GitHubSnapshot | null;
  curated: boolean;
};

/**
 * Merge live GitHub data with admin curation.
 * - With curation in the DB: only rows marked visible / featured are shown,
 *   in the admin's order. Private repos never appear: they are absent from
 *   the public GitHub data, so they can't be matched.
 * - Without a DB (or before the first sync): show public, non-fork,
 *   non-archived repos so the section is never empty.
 */
export async function getProjects(): Promise<ProjectsData> {
  const [snapshot, rows] = await Promise.all([getGitHub(), getRows()]);
  const repos = snapshot?.repos ?? [];
  const byName = new Map(repos.map((r) => [r.name, r]));

  if (rows && rows.length > 0) {
    const merged: (PublicProject & { visible: boolean })[] = [];
    rows.forEach((row, i) => {
      if (row.source === "manual") {
        merged.push({ ...fromManual(row, i), visible: row.visible });
        return;
      }
      if (row.isPrivate || !row.repoName) return;
      const repo = byName.get(row.repoName);
      if (!repo) return;
      merged.push({ ...fromRepo(repo, i, row), visible: row.visible });
    });
    return {
      grid: merged.filter((p) => p.visible),
      featured: merged.filter((p) => p.featured),
      snapshot,
      curated: true,
    };
  }

  const auto = repos
    .filter((r) => !r.isFork && !r.isArchived && !r.isPrivate)
    .map((r, i) => fromRepo(r, i));
  const featured = [...auto]
    .sort((a, b) => Number(!!b.homepage) - Number(!!a.homepage) || b.stars - a.stars)
    .slice(0, 3)
    .map((p) => ({ ...p, featured: true }));
  return { grid: auto, featured, snapshot, curated: false };
}

export async function getProjectBySlug(slug: string) {
  const { featured, grid } = await getProjects();
  const list = [...featured, ...grid.filter((g) => !featured.some((f) => f.slug === g.slug))];
  const index = list.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  return { project: list[index]!, next: list.length > 1 ? list[(index + 1) % list.length]! : null };
}

/** Aggregated stats for the Activity section. */
export function getStats(snapshot: GitHubSnapshot | null) {
  if (!snapshot) return null;
  const own = snapshot.repos.filter((r) => !r.isFork);
  const stars = own.reduce((n, r) => n + r.stars, 0);
  const bytes = new Map<string, { size: number; color: string | null }>();
  for (const r of own) {
    if (r.languages?.length) {
      for (const l of r.languages) {
        const prev = bytes.get(l.name);
        bytes.set(l.name, { size: (prev?.size ?? 0) + l.size, color: l.color });
      }
    } else if (r.language) {
      const prev = bytes.get(r.language);
      bytes.set(r.language, { size: (prev?.size ?? 0) + 1, color: r.languageColor });
    }
  }
  const total = Array.from(bytes.values()).reduce((n, v) => n + v.size, 0) || 1;
  const languages = Array.from(bytes.entries())
    .map(([name, v]) => ({ name, color: v.color ?? languageColors[name] ?? null, share: v.size / total }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 5);
  return {
    repos: own.length,
    stars,
    contributions: snapshot.contributions?.total ?? null,
    languageCount: bytes.size,
    languages,
  };
}
