import { signIn } from "@/lib/auth";

const ERRORS: Record<string, string> = {
  AccessDenied: "That GitHub account isn't allowed in here.",
  Configuration: "Auth isn't configured yet — check AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET and ADMIN_GITHUB_ID.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? "Sign-in failed. Try again.") : null;

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-sm">
        <p className="eyebrow">Private</p>
        <h1 className="mt-3 font-display text-5xl font-bold tracking-[-0.04em]">Admin</h1>
        <p className="mt-3 text-muted">Sign in with the owner&apos;s GitHub account to manage projects.</p>
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
            <svg viewBox="0 0 16 16" className="size-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
            Continue with GitHub
          </button>
        </form>
      </div>
    </main>
  );
}
