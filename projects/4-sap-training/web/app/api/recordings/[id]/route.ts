import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/options";
import { canAccessAnyRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { recordings } from "@/lib/db/schema";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canAccessAnyRole(session, ["student"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await _req.json();
  const storageKey = typeof body.storageKey === "string" ? body.storageKey : "";

  if (
    /[\r\n]/.test(storageKey) ||
    !storageKey.startsWith(`audio/${session.user.id}/`) ||
    !storageKey.includes(`/${id}.`)
  ) {
    return NextResponse.json({ error: "invalid storage key" }, { status: 400 });
  }

  const [recording] = await db
    .update(recordings)
    .set({
      storageKey,
      status: body.status === "ready" ? "ready" : "uploading",
    })
    .where(
      and(
        eq(recordings.id, id),
        eq(recordings.studentId, session.user.id),
        isNull(recordings.deletedAt)
      )
    )
    .returning();

  if (!recording) return NextResponse.json({ error: "not found or forbidden" }, { status: 404 });
  return NextResponse.json({ recording });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canAccessAnyRole(session, ["student"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [recording] = await db
    .update(recordings)
    .set({
      status: "deleted",
      deletedAt: new Date(),
    })
    .where(
      and(
        eq(recordings.id, id),
        eq(recordings.studentId, session.user.id),
        isNull(recordings.deletedAt)
      )
    )
    .returning();

  if (!recording) return NextResponse.json({ error: "not found or forbidden" }, { status: 404 });
  return NextResponse.json({ recording });
}
