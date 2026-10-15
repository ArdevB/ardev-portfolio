import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __db?: DB };

/**
 * Lazily-created Drizzle client, or null when DATABASE_URL isn't set (the
 * public site then falls back to showing public repos straight from GitHub).
 * Works with Neon or Supabase — use the pooled connection string.
 */
export function getDb(): DB | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!globalForDb.__db) {
    const client = postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10 });
    globalForDb.__db = drizzle(client, { schema });
  }
  return globalForDb.__db;
}

export { schema };
