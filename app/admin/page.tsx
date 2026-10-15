import dynamic from "next/dynamic";
import { asc } from "drizzle-orm";
import { requireAdminPage } from "@/lib/auth/guard";
import { getDb, schema } from "@/lib/db";
import { fetchAllOwnedRepos } from "@/lib/github/client";
import { getGitHub } from "@/lib/projects";
import type { GhRepo } from "@/lib/github/types";
import type { SerializedRow } from "@/lib/projects/merge";

// Code-split: the dashboard bundle only ever loads on /admin.
const Dashboard = dynamic(() => import("@/components/admin/Dashboard"));

// Reads the session cookie, so this route is always rendered per request.

export default async function AdminPage() {
  const session = await requireAdminPage();
  const db = getDb();

  if (!db) {
    return (
      <main className="mx-auto max-w-2xl p-10">
        <h1 className="font-display text-4xl font-bold tracking-tight">Almost there</h1>
        <p className="mt-4 text-muted">
          You&apos;re signed in, but <code className="rounded bg-surface px-1.5 py-0.5">DATABASE_URL</code> isn&apos;t
          set, so there&apos;s nowhere to store project settings. Add it (see the README → Database), run{" "}
          <code className="rounded bg-surface px-1.5 py-0.5">npm run db:push</code>, then reload.
        </p>
      </main>
    );
  }

  const rows = await db.select().from(schema.projects).orderBy(asc(schema.projects.sortOrder), asc(schema.projects.id));

  let repos: GhRepo[] = [];
  let repoError: string | null = null;
  try {
    repos = await fetchAllOwnedRepos();
  } catch (e) {
    repoError = e instanceof Error ? e.message : "GitHub unavailable";
    repos = (await getGitHub())?.repos ?? [];
  }

  const serialized: SerializedRow[] = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <Dashboard
      initialRows={serialized}
      repos={repos}
      repoError={repoError}
      user={{ name: session.user.name ?? "Admin", image: session.user.image ?? null }}
      blobEnabled={!!process.env.BLOB_READ_WRITE_TOKEN}
      now={Date.now()}
    />
  );
}
