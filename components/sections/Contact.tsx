import { site } from "@/lib/site";
import { RevealText } from "@/components/animations/RevealText";
import { Magnetic } from "@/components/ui/Magnetic";
import { CopyEmail } from "@/components/ui/CopyEmail";
import { TextRoll } from "@/components/ui/TextRoll";
import { LocalTime } from "@/components/ui/LocalTime";

export function Contact() {
  return (
    <footer id="contact" aria-labelledby="contact-title" className="relative scroll-mt-0 overflow-clip bg-fg pt-[clamp(6rem,12vw,10rem)] text-bg">
      <div className="container-x">
        <p className="eyebrow !text-bg/60">(06) Contact</p>
        <h2 id="contact-title" className="sr-only">
          Let&apos;s talk
        </h2>
        <RevealText
          as="p"
          type="chars"
          className="mt-8 font-display text-[clamp(4rem,17vw,16rem)] font-bold uppercase leading-[0.82] tracking-[-0.04em]"
        >
          Let&apos;s talk
        </RevealText>

        <div className="mt-14 flex flex-col items-start gap-10 md:flex-row md:items-center md:justify-between">
          <p className="max-w-md text-lg text-bg/70">
            Have a product, a role, or an idea that needs building? I&apos;m open to freelance work, internships and
            collaborations.
          </p>
          <Magnetic strength={0.45}>
            <a
              href={`mailto:${site.email}`}
              data-cursor="grow"
              className="group relative grid size-40 place-items-center overflow-clip rounded-full bg-accent text-center font-medium text-on-accent md:size-48"
            >
              <span className="absolute inset-0 translate-y-full rounded-full bg-bg transition-transform duration-500 ease-cine group-hover:translate-y-0" />
              <span className="relative transition-colors duration-500 group-hover:text-fg">
                Get in
                <br />
                touch →
              </span>
            </a>
          </Magnetic>
        </div>

        <div className="mt-16 border-t border-bg/15 pt-10">
          <CopyEmail email={site.email} />
        </div>

        <div className="mt-16 grid gap-10 pb-10 md:grid-cols-3">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 md:col-span-2">
            {site.socials.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="group text-lg" data-cursor="grow">
                  <TextRoll>{s.label}</TextRoll>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="flex justify-between gap-6 text-sm text-bg/60 md:justify-end md:gap-10">
            <span>{site.location}</span>
            <LocalTime />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-bg/15 py-6 text-xs text-bg/50 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
          <a href="#main" className="hover:text-bg">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
