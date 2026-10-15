import { PreloaderCounter } from "./PreloaderCounter";

/**
 * First visit only (decided by the <head> script). Timing is pure CSS so the
 * page is revealed even if JavaScript is slow; JS only drives the counter.
 */
export function Preloader() {
  return (
    <div
      className="preloader fixed inset-0 z-[90] flex-col justify-between bg-fg p-[var(--gutter)] text-bg"
      aria-hidden="true"
    >
      <div className="flex justify-between text-xs uppercase tracking-[0.2em] opacity-60">
        <span>Ardev Bajracharya</span>
        <span>Portfolio ©2026</span>
      </div>
      <div>
        <PreloaderCounter />
        <div className="mt-6 h-px w-full bg-bg/20">
          <div className="preloader-line h-px origin-left scale-x-0 bg-accent" />
        </div>
      </div>
    </div>
  );
}
