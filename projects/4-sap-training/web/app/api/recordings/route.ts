import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { recordings } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ recordings: [] }, { status: 401 });

  const recs = await db
    .select()
    .from(recordings)
    .where(eq(recordings.studentId, session.user.id))
    .orderBy(desc(recordings.createdAt))
    .limit(200);

  return NextResponse.json({ recordings: recs });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const [recording] = await db
    .insert(recordings)
    .values({
      studentId: session.user.id,
      lessonId: body.lessonId,
      practiceType: body.practiceType,
      promptText: body.promptText ?? null,
      targetJapanese: body.targetJapanese ?? null,
      mimeType: body.mimeType ?? "audio/webm",
      durationSec: body.durationSec ?? 0,
      sizeBytes: body.sizeBytes ?? 0,
      selfAssessment: body.selfAssessment ?? null,
      status: "ready"
    })
    .returning();

  return NextResponse.json({ recording });
}
