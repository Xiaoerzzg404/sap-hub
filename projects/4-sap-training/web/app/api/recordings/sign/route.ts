import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { recordings } from "@/lib/db/schema";
import { checkRateLimit, limits } from "@/lib/rate-limit";
import { getPresignedPutUrl, MAX_RECORDING_BYTES, recordingKey } from "@/lib/storage/r2";

function extensionForMimeType(mimeType: string) {
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(limits.upload, session.user.id);
  if (!success) return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });

  const body = await req.json();
  const sizeBytes = Number(body.sizeBytes);
  const mimeType = typeof body.mimeType === "string" && body.mimeType ? body.mimeType : "audio/webm";

  if (!body.lessonId || !body.practiceType) {
    return NextResponse.json({ error: "lessonId and practiceType are required" }, { status: 400 });
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_RECORDING_BYTES) {
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
      mimeType,
      durationSec: Number(body.durationSec) || 0,
      sizeBytes,
      selfAssessment: body.selfAssessment ?? null,
      status: "uploading"
    })
    .returning();

  const storageKey = recordingKey(session.user.id, body.lessonId, recording.id, extensionForMimeType(mimeType));
  const uploadUrl = await getPresignedPutUrl(storageKey, mimeType, sizeBytes);

  return NextResponse.json({
    recordingId: recording.id,
    storageKey,
    uploadUrl,
    expiresInSec: 300
  });
}
