import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\/[^\s]+$/i.test(v) || /^\/[^\s]*$/.test(v), {
    message: "Must be an https:// URL (or a /path in /public)",
  });

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only");

const tags = z
  .array(z.string().trim().min(1).max(40))
  .max(12)
  .transform((t) => Array.from(new Set(t.map((x) => x.toLowerCase()))));

/** Editable fields shared by GitHub-backed and manual projects. */
export const projectFieldsSchema = z.object({
  title: optionalText(120),
  description: optionalText(600),
  coverImage: optionalUrl,
  liveUrl: optionalUrl,
  tags,
  role: optionalText(120),
  year: optionalText(20),
  summary: optionalText(600),
  body: optionalText(20_000),
  slug: slugSchema,
  // manual only (ignored for GitHub rows)
  repoUrl: optionalUrl,
  language: optionalText(40),
});

export const projectUpdateSchema = projectFieldsSchema.extend({
  id: z.number().int().positive(),
  visible: z.boolean(),
  featured: z.boolean(),
});

export const saveAllSchema = z.array(projectUpdateSchema).max(500);

export const manualCreateSchema = projectFieldsSchema.extend({
  title: z.string().trim().min(1, "Title is required").max(120),
  visible: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export type ProjectUpdate = z.input<typeof projectUpdateSchema>;
export type ManualCreate = z.input<typeof manualCreateSchema>;
