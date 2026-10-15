import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Ardev",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F5F3EF",
    theme_color: "#F5F3EF",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
