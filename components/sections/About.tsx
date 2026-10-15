import Image from "next/image";
import { site } from "@/lib/site";
import { AboutAnimator } from "./AboutAnimator";
import { BLUR_DATA_URL } from "@/lib/images";

export function About() {
  const escape = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const wordsHtml = site.about
    .split(" ")
    .map((w) => `<span data-word class="inline-block">${escape(w)}</span>`)
    .join(" ");
  return (
    <section id="about" aria-labelledby="about-title" className="container-x scroll-mt-24 py-[clamp(6rem,14vw,12rem)]">
      <AboutAnimator>
        <div className="mb-12 flex items-baseline justify-between gap-6 border-b border-border pb-6">
          <h2 id="about-title" className="eyebrow">
            (01) About
          </h2>
          <span className="eyebrow">{site.location}</span>
        </div>

        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <div data-portrait className="relative aspect-[4/5] w-full max-w-sm overflow-clip rounded-sm bg-surface">
              <div data-portrait-inner className="absolute inset-0">
                <Image
                  src={site.portrait}
                  alt={`Portrait of ${site.name}`}
                  fill
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className="object-cover grayscale transition-[filter] duration-700 hover:grayscale-0"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-8">
            {/* Words are static markup (not hydrated one by one); the copy is our own and escaped. */}
            <p
              data-words
              className="font-display text-[clamp(1.6rem,3.3vw,3rem)] font-medium leading-[1.12] tracking-[-0.025em]"
              dangerouslySetInnerHTML={{ __html: wordsHtml }}
            />

          </div>
        </div>
      </AboutAnimator>
    </section>
  );
}
