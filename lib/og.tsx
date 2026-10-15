import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

/** Shared Open Graph card: big title on the light theme with the accent disc. */
// Satori can't read woff2, so OG cards use .woff copies of the display font.
const fontDir = join(process.cwd(), "app/fonts");
const fonts = Promise.all([readFile(join(fontDir, "og-display-700.woff")), readFile(join(fontDir, "og-display-500.woff"))]);

export async function ogImage({ eyebrow, title, footer }: { eyebrow: string; title: string; footer: string }) {
  const [bold, medium] = await fonts;
  const size = title.length > 28 ? 92 : title.length > 16 ? 120 : 168;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F5F3EF",
          fontFamily: "Display",
          color: "#111111",
          padding: 72,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", right: -80, top: -80, width: 420, height: 420, borderRadius: 9999, background: "#FF4F1A" }} />
        <div style={{ display: "flex", fontSize: 26, fontWeight: 500, letterSpacing: 6, textTransform: "uppercase", color: "#6B6B6B" }}>{eyebrow}</div>
        <div style={{ display: "flex", fontSize: size, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 0.88, maxWidth: 1000 }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 500 }}>
          <span>{footer}</span>
          <span>ardevbajracharya.com.np</span>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Display", data: bold, weight: 700, style: "normal" },
        { name: "Display", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
