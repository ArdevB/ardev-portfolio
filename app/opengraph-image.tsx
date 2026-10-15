import { ogImage, ogSize } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.role}`;
export const size = ogSize;
export const contentType = "image/png";

export default async function Image() {
  return ogImage({ eyebrow: "Portfolio", title: "ARDEV", footer: site.role });
}
