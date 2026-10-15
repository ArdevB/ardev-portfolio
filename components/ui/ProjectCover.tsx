import Image from "next/image";
import { BLUR_DATA_URL, isOptimizable } from "@/lib/images";

type Props = {
  title: string;
  cover: string | null;
  language?: string | null;
  languageColor?: string | null;
  index?: number;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Project cover: the admin-set image when present, otherwise a generated
 * typographic cover so a card never looks empty.
 */
export function ProjectCover({ title, cover, language, languageColor, index = 0, sizes, priority, className = "" }: Props) {
  if (cover) {
    return (
      <Image
        src={cover}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={!isOptimizable(cover)}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        className={`object-cover ${className}`}
      />
    );
  }
  const variants = [
    "bg-fg text-bg",
    "bg-accent text-on-accent",
    "bg-surface text-fg",
  ] as const;
  // colour derives from the title so a project looks the same everywhere (card → case study)
  const hash = Array.from(title).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const v = variants[hash % variants.length];
  return (
    <div className={`absolute inset-0 flex flex-col justify-between overflow-clip p-[6%] ${v} ${className}`} aria-hidden="true">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] opacity-70">
        <span className="flex items-center gap-2">
          {languageColor && <span className="size-2 rounded-full" style={{ background: languageColor }} />}
          {language ?? "Project"}
        </span>
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <span className="break-words font-display text-[clamp(2.25rem,6vw,6rem)] font-bold leading-[0.85] tracking-[-0.05em]">
        {title}
      </span>
      <span className="pointer-events-none absolute -right-[12%] -top-[20%] aspect-square w-[55%] rounded-full border border-current opacity-15" />
    </div>
  );
}
