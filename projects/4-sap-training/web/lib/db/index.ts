import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var sapJpPgPool: Pool | undefined;
}

const pool =
  globalThis.sapJpPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.sapJpPgPool = pool;
}

export const db = drizzle(pool, { schema });
