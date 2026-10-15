import localFont from "next/font/local";

/**
 * Self-hosted, latin-subset variable fonts.
 * To use Clash Display instead: add ClashDisplay-Variable.woff2 to app/fonts
 * and point `src` below at it.
 */
export const display = localFont({
  src: "../app/fonts/BricolageGrotesque-Variable.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "Arial"],
  adjustFontFallback: "Arial",
});

export const sans = localFont({
  src: "../app/fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "Arial"],
  adjustFontFallback: "Arial",
});
