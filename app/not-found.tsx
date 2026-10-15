import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x flex min-h-dvh flex-col justify-center gap-8 py-24">
      <p className="eyebrow">Error 404</p>
      <h1 className="text-display">Lost?</h1>
      <p className="max-w-md text-lg text-muted">This page doesn&apos;t exist — or it moved somewhere better.</p>
      <Link href="/" className="btn-primary w-fit">
        ← Back home
      </Link>
    </main>
  );
}
