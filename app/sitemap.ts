import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/projects";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { featured, grid } = await getProjects();
  const projects = Array.from(new Map([...featured, ...grid].map((p) => [p.slug, p])).values());
  return [
    { url: site.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    ...projects.map((p) => ({
      url: `${site.url}/work/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: p.featured ? 0.8 : 0.5,
    })),
  ];
}
