import NextAuth, { type Session } from "next-auth";
import GitHub from "next-auth/providers/github";

declare module "next-auth" {
  interface Session {
    user: { githubId?: string; name?: string | null; email?: string | null; image?: string | null };
  }
}

/**
 * Admin auth: GitHub OAuth, single allowed account.
 * Sign-in is rejected unless the GitHub numeric user ID equals ADMIN_GITHUB_ID,
 * and every protected request re-checks the ID (so rotating the env var
 * invalidates old sessions immediately).
 */
export function isAdminSession(session: Session | null | undefined): boolean {
  const adminId = process.env.ADMIN_GITHUB_ID;
  return !!adminId && !!session?.user?.githubId && session.user.githubId === adminId;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login", error: "/admin/login" },
  trustHost: true,
  callbacks: {
    signIn({ account, profile }) {
      const adminId = process.env.ADMIN_GITHUB_ID;
      if (!adminId || account?.provider !== "github") return false;
      return String(profile?.id ?? "") === adminId;
    },
    jwt({ token, profile }) {
      if (profile?.id !== undefined) token.githubId = String(profile.id);
      return token;
    },
    session({ session, token }) {
      session.user.githubId = typeof token.githubId === "string" ? token.githubId : undefined;
      return session;
    },
  },
});
