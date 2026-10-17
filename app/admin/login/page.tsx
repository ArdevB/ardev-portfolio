import { notFound } from "next/navigation";
import { signIn } from "@/lib/auth";

const ERRORS: Record<string, string> = {
  AccessDenied: "That GitHub account isn't allowed in here.",
  Configuration: "Sign-in isn't configured yet.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; k?: string }> }) {
  const { error, k } = await searchParams;
  // Defence in depth: middleware already 404s without the key.
  const key = process.env.ADMIN_LOGIN_KEY;
  if (!key || k !== key) notFound();
  const message = error ? (ERRORS[error] ?? "Sign-in failed. Try again.") : null;

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-sm">
        <p className="eyebrow">Private</p>
        <h1 className="mt-3 font-display text-5xl font-bold tracking-[-0.04em]">Admin</h1>
        <p className="mt-3 text-muted">Owner sign-in.</p>
        {message && (
          <p role="alert" className="mt-6 rounded-md border border-accent-ink/40 bg-accent/10 p-3 text-sm">
            {message}
          </p>
        )}
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/admin" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-full bg-fg px-6 py-3.5 font-medium text-bg transition-colors hover:bg-accent hover:text-on-accent"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
