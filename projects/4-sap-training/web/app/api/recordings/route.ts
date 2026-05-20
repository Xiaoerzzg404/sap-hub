import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { recordings, teacherFeedback } from "@/lib/db/schema";
import { getPresignedGetUrl, MAX_RECORDING_BYTES } from "@/lib/storage/r2";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ recordings: [] }, { status: 401 });

  const rows = await db
    .select({ recording: recordings, feedback: teacherFeedback })
    .from(recordings)
    .leftJoin(teacherFeedback, eq(teacherFeedback.recordingId, recordings.id))
    .where(eq(recordings.studentId, session.user.id))
    .orderBy(desc(recordings.createdAt))
    .limit(200);

  const enriched = await Promise.all(
    rows.map(async ({ recording, feedback }) => ({
      ...recording,
      feedback,
      audioGetUrl: recording.storageKey ? await getPresignedGetUrl(recording.storageKey) : null
    }))
  );

  return NextResponse.json({ recordings: enriched });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const sizeBytes = Number(body.sizeBytes) || 0;
  if (sizeBytes < 0 || sizeBytes > MAX_RECORDING_BYTES) {
    return NextResponse.json({ error: "size out of range (max 10MB)" }, { status: 400 });
  }

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
      sizeBytes,
      selfAssessment: body.selfAssessment ?? null,
      status: "ready"
    })
    .returning();

  return NextResponse.json({ recording });
}
