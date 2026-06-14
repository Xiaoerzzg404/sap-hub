import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/options";
import { canAccessAnyRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { progressEvents } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ events: [] }, { status: 401 });
  if (!canAccessAnyRole(session, ["student"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const events = await db
    .select()
    .from(progressEvents)
    .where(eq(progressEvents.studentId, session.user.id))
    .orderBy(desc(progressEvents.createdAt))
    .limit(500);

  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canAccessAnyRole(session, ["student"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const [event] = await db
    .insert(progressEvents)
    .values({
      studentId: session.user.id,
      type: body.type,
      lessonId: body.lessonId ?? null,
      refId: body.refId ?? null,
      payload: body.payload ?? {},
    })
    .returning();

  return NextResponse.json({ event });
}
