import { and, eq, isNotNull, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordings } from "@/lib/db/schema";
import { deleteObject } from "@/lib/storage/r2";

const HARD_DELETE_AFTER_DAYS = 30;

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "cron secret not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const threshold = new Date(Date.now() - HARD_DELETE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const toHardDelete = await db
    .select()
    .from(recordings)
    .where(and(isNotNull(recordings.deletedAt), lt(recordings.deletedAt, threshold)));

  let r2Deleted = 0;
  let dbDeleted = 0;
  const r2Errors: string[] = [];

  for (const rec of toHardDelete) {
    if (rec.storageKey) {
      try {
        await deleteObject(rec.storageKey);
        r2Deleted += 1;
      } catch {
        r2Errors.push(rec.id);
        continue;
      }
    }

    await db.delete(recordings).where(eq(recordings.id, rec.id));
    dbDeleted += 1;
  }

  return NextResponse.json({
    scanned: toHardDelete.length,
    r2Deleted,
    dbDeleted,
    r2Errors
  });
}
