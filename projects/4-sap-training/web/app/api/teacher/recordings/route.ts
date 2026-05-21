import { and, desc, eq, inArray, isNotNull, isNull, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { classes, enrollments, recordings, teacherFeedback, users } from "@/lib/db/schema";
import { getPresignedGetUrl } from "@/lib/storage/r2";

type RecordingStatus = typeof recordings.$inferSelect.status;
const RECORDING_STATUSES: RecordingStatus[] = ["uploading", "ready", "flagged", "deleted"];

async function getTeacherStudentIds(teacherId: string) {
  const myClasses = await db.select({ id: classes.id }).from(classes).where(eq(classes.teacherId, teacherId));
  const classIds = myClasses.map((item) => item.id);
  if (classIds.length === 0) return [];

  const rows = await db
    .select({ studentId: enrollments.studentId })
    .from(enrollments)
    .where(and(inArray(enrollments.classId, classIds), eq(enrollments.status, "active")));

  return rows.map((item) => item.studentId);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");
  const recordingId = url.searchParams.get("recordingId");
  const lessonId = url.searchParams.get("lessonId");
  const status = url.searchParams.get("status");
  const hasFeedback = url.searchParams.get("hasFeedback");

  const conditions: SQL[] = [isNull(recordings.deletedAt)];
  if (session.user.role === "teacher") {
    const studentIds = await getTeacherStudentIds(session.user.id);
    if (studentIds.length === 0) return NextResponse.json({ recordings: [] });
    conditions.push(inArray(recordings.studentId, studentIds));
  }
  if (recordingId) conditions.push(eq(recordings.id, recordingId));
  if (studentId) conditions.push(eq(recordings.studentId, studentId));
  if (lessonId) conditions.push(eq(recordings.lessonId, lessonId));
  if (status && RECORDING_STATUSES.includes(status as RecordingStatus)) {
    conditions.push(eq(recordings.status, status as RecordingStatus));
  }
  if (hasFeedback === "yes") conditions.push(isNotNull(teacherFeedback.id));
  if (hasFeedback === "no") conditions.push(isNull(teacherFeedback.id));

  const rows = await db
    .select({
      recording: recordings,
      studentEmail: users.email,
      studentName: users.name,
      feedback: teacherFeedback
    })
    .from(recordings)
    .leftJoin(users, eq(users.id, recordings.studentId))
    .leftJoin(teacherFeedback, eq(teacherFeedback.recordingId, recordings.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(recordings.createdAt))
    .limit(200);

  const enriched = await Promise.all(
    rows.map(async (row) => ({
      ...row.recording,
      studentEmail: row.studentEmail,
      studentName: row.studentName,
      feedback: row.feedback,
      audioGetUrl: row.recording.storageKey ? await getPresignedGetUrl(row.recording.storageKey) : null
    }))
  );

  return NextResponse.json({ recordings: enriched });
}
