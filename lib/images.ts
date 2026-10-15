/** Neutral blur-up placeholder (tiny SVG, works in both themes). */
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4JyBoZWlnaHQ9JzEwJz48ZmlsdGVyIGlkPSdiJz48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPScxJy8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9JzgnIGhlaWdodD0nMTAnIGZpbGw9JyNkOWQ0Y2MnLz48Y2lyY2xlIGN4PSc1JyBjeT0nNCcgcj0nMycgZmlsbD0nI2M5YzJiOCcgZmlsdGVyPSd1cmwoI2IpJy8+PC9zdmc+";

/** Hosts next/image may optimise. Anything else renders unoptimised. */
const OPTIMIZABLE = [
  "avatars.githubusercontent.com",
  "raw.githubusercontent.com",
  "user-images.githubusercontent.com",
  "opengraph.githubassets.com",
  "images.unsplash.com",
  "res.cloudinary.com",
];

export function isOptimizable(src: string) {
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    return OPTIMIZABLE.includes(host) || host.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export const optimizableHosts = OPTIMIZABLE;
