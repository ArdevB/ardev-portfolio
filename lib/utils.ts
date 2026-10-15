export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** "Plant-Health---Disease-Detector" → "Plant Health — Disease Detector" */
export function prettifyRepoName(name: string) {
  return name
    .replace(/-{2,}/g, " — ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b([a-z])/g, (m, c: string, i: number) => (i === 0 ? c.toUpperCase() : m));
}

export function relativeTime(iso: string | null, now = Date.now()) {
  if (!iso) return null;
  const diff = (new Date(iso).getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs || unit === "minute") return rtf.format(Math.round(diff / secs), unit);
  }
  return null;
}
