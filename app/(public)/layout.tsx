import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { TransitionProvider } from "@/components/providers/TransitionProvider";
import { Navbar } from "@/components/ui/Navbar";
import { Cursor } from "@/components/ui/Cursor";
import { Grain } from "@/components/ui/Grain";
import { Preloader } from "@/components/sections/Preloader";
import { Contact } from "@/components/sections/Contact";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
    <SmoothScroll>
      <TransitionProvider>
        <a
          href="#main"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-fg px-4 py-2 text-sm text-bg focus:translate-y-0"
        >
          Skip to content
        </a>
        <Preloader />
        <Navbar />
        <main id="main">{children}</main>
        <Contact />
        <Cursor />
        <Grain />
      </TransitionProvider>
    </SmoothScroll>
    </MotionProvider>
  );
}
