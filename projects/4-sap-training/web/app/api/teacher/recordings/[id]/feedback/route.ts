import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { auth } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { classes, enrollments, recordings, teacherFeedback, users } from "@/lib/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

function score(value: unknown) {
  const next = Number(value);
  return Number.isInteger(next) && next >= 1 && next <= 5 ? next : 3;
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function teacherCanAccessStudent(teacherId: string, studentId: string) {
  const rows = await db
    .select({ enrollmentId: enrollments.id })
    .from(enrollments)
    .innerJoin(classes, eq(classes.id, enrollments.classId))
    .where(and(eq(classes.teacherId, teacherId), eq(enrollments.studentId, studentId), eq(enrollments.status, "active")))
    .limit(1);

  return rows.length > 0;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id: recordingId } = await params;
  const body = await req.json();
  const scoreOverall = score(body.scoreOverall);
  const scoreDim = {
    pronunciation: score(body.scoreDim?.pronunciation),
    fluency: score(body.scoreDim?.fluency),
    naturalness: score(body.scoreDim?.naturalness),
    sapAccuracy: score(body.scoreDim?.sapAccuracy),
    consultantLike: score(body.scoreDim?.consultantLike)
  };
  const comment = optionalText(body.comment);
  const correctedJapanese = optionalText(body.correctedJapanese);

  const [recording] = await db
    .select({
      id: recordings.id,
      studentId: recordings.studentId,
      lessonId: recordings.lessonId,
      studentEmail: users.email,
      studentName: users.name
    })
    .from(recordings)
    .innerJoin(users, eq(users.id, recordings.studentId))
    .where(eq(recordings.id, recordingId))
    .limit(1);

  if (!recording) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (session.user.role === "teacher") {
    const allowed = await teacherCanAccessStudent(session.user.id, recording.studentId);
    if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [feedback] = await db
    .insert(teacherFeedback)
    .values({
      recordingId,
      teacherId: session.user.id,
      scoreOverall,
      scoreDim,
      comment,
      correctedJapanese
    })
    .onConflictDoUpdate({
      target: teacherFeedback.recordingId,
      set: {
        teacherId: session.user.id,
        scoreOverall,
        scoreDim,
        comment,
        correctedJapanese,
        updatedAt: new Date()
      }
    })
    .returning();

  try {
    await resend.emails.send({
      from: process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev",
      to: recording.studentEmail,
      subject: "SAP 日语口语训练 · 你的录音收到讲师反馈",
      html: `
        <p>${escapeHtml(recording.studentName ?? "同学")}你好：</p>
        <p>讲师对你 ${escapeHtml(recording.lessonId)} 的录音作出了反馈。</p>
        <p>总分：${scoreOverall} / 5</p>
        ${comment ? `<p>留言：${escapeHtml(comment)}</p>` : ""}
        ${correctedJapanese ? `<p>纠正后表达：<br>${escapeHtml(correctedJapanese)}</p>` : ""}
        <p><a href="${process.env.NEXTAUTH_URL}/review">登录查看完整反馈</a></p>
        <p>-- SAP 日语口语训练平台</p>
      `
    });
  } catch {
    return NextResponse.json({ error: "email_notification_failed", feedback }, { status: 502 });
  }

  return NextResponse.json({ feedback, emailStatus: "sent" });
}
