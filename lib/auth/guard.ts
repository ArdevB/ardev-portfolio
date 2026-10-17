import "server-only";
import { notFound } from "next/navigation";
import { auth, isAdminSession } from "./index";

/** For admin pages: anyone who isn't the admin gets a 404 (the admin area stays hidden). */
export async function requireAdminPage() {
  const session = await auth();
  if (!isAdminSession(session)) notFound();
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
