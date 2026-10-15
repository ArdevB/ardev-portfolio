import { ogImage, ogSize } from "@/lib/og";
import { getProjectBySlug } from "@/lib/projects";
import { site } from "@/lib/site";

export const alt = `Case study — ${site.name}`;
export const size = ogSize;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await getProjectBySlug(slug);
  return ogImage({ eyebrow: "Case study", title: found?.project.title ?? "Project", footer: site.name });
}
