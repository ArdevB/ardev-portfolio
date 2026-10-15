import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/*
 * Row-level security is enabled on every table (with no policies), so
 * Supabase's public Data API can't read or write them. The app connects as
 * the database owner, which bypasses RLS.
 */

/**
 * Only overrides + curation live here. Live repo data (stars, language,
 * updated date…) always comes from GitHub.
 */
export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    source: text("source", { enum: ["github", "manual"] }).notNull().default("github"),
    /** GitHub repo name (null for manual projects). */
    repoName: text("repo_name"),
    slug: text("slug").notNull(),
    isPrivate: boolean("is_private").notNull().default(false),
    visible: boolean("visible").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    // overrides
    title: text("title"),
    description: text("description"),
    coverImage: text("cover_image"),
    liveUrl: text("live_url"),
    tags: text("tags").array().notNull().default([]),
    // manual projects only
    repoUrl: text("repo_url"),
    language: text("language"),
    // case study
    role: text("role"),
    year: text("year"),
    summary: text("summary"),
    body: text("body"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("projects_repo_name_idx").on(t.repoName), uniqueIndex("projects_slug_idx").on(t.slug)],
).enableRLS();

/** Last good GitHub response — served if the API fails or rate-limits. */
export const githubSnapshots = pgTable("github_snapshots", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
