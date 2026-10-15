import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// /admin is intentionally not listed: it is noindex via headers + metadata,
// and naming it here would only advertise it.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
