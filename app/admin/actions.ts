"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { eq, inArray, max } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin, UnauthorizedError } from "@/lib/auth/guard";
import { signOut } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { fetchAllOwnedRepos } from "@/lib/github/client";
import { TAGS } from "@/lib/projects";
import { manualCreateSchema, saveAllSchema, type ManualCreate, type ProjectUpdate } from "@/lib/projects/validation";
import { slugify } from "@/lib/utils";

/*
 * Every action re-checks the admin session first — middleware is not enough on
 * its own. Next.js Server Actions only accept same-origin POSTs (Origin/Host
 * check), and the Auth.js session cookie is SameSite=Lax + HttpOnly, which
 * together provide CSRF protection.
 */

export type ActionResult<T = undefined> = { ok: true; data: T; message?: string } | { ok: false; error: string };

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof UnauthorizedError) return { ok: false, error: "Not authorised." };
  if (e instanceof z.ZodError) return { ok: false, error: e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  console.error("[admin]", e);
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
}

function db() {
  const d = getDb();
  if (!d) throw new Error("DATABASE_URL is not configured.");
  return d;
}

function refreshPublicSite() {
  revalidateTag(TAGS.projects);
  revalidateTag(TAGS.github);
  revalidatePath("/", "layout");
}

async function uniqueSlug(base: string, takenBy?: number) {
  const d = db();
  const root = slugify(base) || "project";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const [hit] = await d.select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.slug, candidate));
    if (!hit || hit.id === takenBy) return candidate;
  }
  return `${root}-${Date.now()}`;
}

/** Pull every owned repo (incl. private) and create rows for new ones. */
export async function syncFromGitHub(): Promise<ActionResult<{ added: number; total: number }>> {
  try {
    await requireAdmin();
    const d = db();
    const repos = await fetchAllOwnedRepos();
    const existing = await d.select().from(schema.projects);
    const byName = new Map(existing.filter((r) => r.repoName).map((r) => [r.repoName!, r]));
    const [{ value: maxOrder } = { value: 0 }] = await d.select({ value: max(schema.projects.sortOrder) }).from(schema.projects);
    let order = (maxOrder ?? 0) + 1;
    let added = 0;

    for (const repo of repos) {
      const row = byName.get(repo.name);
      if (row) {
        if (row.isPrivate !== repo.isPrivate) {
          await d
            .update(schema.projects)
            .set({
              isPrivate: repo.isPrivate,
              // a repo that went private is pulled from the public site immediately
              ...(repo.isPrivate ? { visible: false, featured: false } : {}),
              updatedAt: new Date(),
            })
            .where(eq(schema.projects.id, row.id));
        }
        continue;
      }
      await d.insert(schema.projects).values({
        source: "github",
        repoName: repo.name,
        slug: await uniqueSlug(repo.name),
        isPrivate: repo.isPrivate,
        visible: !repo.isPrivate && !repo.isFork && !repo.isArchived,
        featured: false,
        sortOrder: order++,
        tags: [],
      });
      added++;
    }
    refreshPublicSite();
    return { ok: true, data: { added, total: repos.length }, message: `Synced ${repos.length} repos (${added} new).` };
  } catch (e) {
    return fail(e);
  }
}

/** Save visibility, featured flags, order (array position) and overrides for all rows. */
export async function saveProjects(input: ProjectUpdate[]): Promise<ActionResult> {
  try {
    await requireAdmin();
    const d = db();
    const rows = saveAllSchema.parse(input);

    const slugs = rows.map((r) => r.slug);
    const dupe = slugs.find((s, i) => slugs.indexOf(s) !== i);
    if (dupe) return { ok: false, error: `Duplicate slug "${dupe}".` };

    const ids = rows.map((r) => r.id);
    const current = ids.length ? await d.select().from(schema.projects).where(inArray(schema.projects.id, ids)) : [];
    const byId = new Map(current.map((r) => [r.id, r]));

    await d.transaction(async (tx) => {
      // Clear slugs first so swaps between rows don't hit the unique index.
      for (const r of rows) {
        await tx.update(schema.projects).set({ slug: `tmp-${r.id}-${Date.now()}` }).where(eq(schema.projects.id, r.id));
      }
      for (const [i, r] of rows.entries()) {
        const existing = byId.get(r.id);
        if (!existing) continue;
        const isPrivate = existing.isPrivate;
        const manual = existing.source === "manual";
        await tx
          .update(schema.projects)
          .set({
            sortOrder: i,
            // private repos can never be published, whatever the client sends
            visible: isPrivate ? false : r.visible,
            featured: isPrivate ? false : r.featured,
            title: r.title,
            description: r.description,
            coverImage: r.coverImage,
            liveUrl: r.liveUrl,
            tags: r.tags,
            role: r.role,
            year: r.year,
            summary: r.summary,
            body: r.body,
            slug: r.slug,
            repoUrl: manual ? r.repoUrl : null,
            language: manual ? r.language : null,
            updatedAt: new Date(),
          })
          .where(eq(schema.projects.id, r.id));
      }
    });
    refreshPublicSite();
    return { ok: true, data: undefined, message: "Saved — the public site is updated." };
  } catch (e) {
    return fail(e);
  }
}

export async function createManualProject(input: ManualCreate): Promise<ActionResult<{ id: number }>> {
  try {
    await requireAdmin();
    const d = db();
    const data = manualCreateSchema.parse(input);
    const [{ value: maxOrder } = { value: 0 }] = await d.select({ value: max(schema.projects.sortOrder) }).from(schema.projects);
    const [row] = await d
      .insert(schema.projects)
      .values({
        ...data,
        source: "manual",
        repoName: null,
        isPrivate: false,
        slug: await uniqueSlug(data.slug || data.title),
        sortOrder: (maxOrder ?? 0) + 1,
      })
      .returning({ id: schema.projects.id });
    refreshPublicSite();
    return { ok: true, data: { id: row!.id }, message: "Project added." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProject(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = z.number().int().positive().parse(id);
    await db().delete(schema.projects).where(eq(schema.projects.id, parsed));
    refreshPublicSite();
    return { ok: true, data: undefined, message: "Deleted." };
  } catch (e) {
    return fail(e);
  }
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/** Upload a cover to Vercel Blob (needs BLOB_READ_WRITE_TOKEN). */
export async function uploadCover(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await requireAdmin();
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return { ok: false, error: "Uploads need BLOB_READ_WRITE_TOKEN (Vercel Blob). Paste an image URL instead." };
    }
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "No file received." };
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { ok: false, error: "Use a JPG, PNG, WebP, AVIF or GIF." };
    if (file.size > 4 * 1024 * 1024) return { ok: false, error: "Max 4 MB." };
    const { put } = await import("@vercel/blob");
    const ext = file.type.split("/")[1];
    const blob = await put(`covers/${crypto.randomUUID()}.${ext}`, file, { access: "public", contentType: file.type });
    return { ok: true, data: { url: blob.url } };
  } catch (e) {
    return fail(e);
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
