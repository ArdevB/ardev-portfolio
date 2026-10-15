import "server-only";
import { redirect } from "next/navigation";
import { auth, isAdminSession } from "./index";

/** For admin pages: redirect anyone who isn't the admin. */
export async function requireAdminPage() {
  const session = await auth();
  if (!isAdminSession(session)) redirect("/admin/login");
  return session!;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

/** For Server Actions / route handlers: throw (never trust the UI or middleware alone). */
export async function requireAdmin() {
  const session = await auth();
  if (!isAdminSession(session)) throw new UnauthorizedError();
  return session!;
}
