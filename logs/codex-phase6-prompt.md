# Codex 任务包 · Phase 6「录音上传 R2 + 讲师反馈端到端」

> 由 codex-phase6-execute.md 引用。Codex 在执行第 4 章时 Read 本文。

---

## 任务开始

### 这一 Phase 干什么

Phase 5 把录音 metadata 落 DB 了，但 blob 还在学生浏览器 IndexedDB——讲师看不到。
Phase 6 接 Cloudflare R2，blob 真上云；同时把讲师反馈写入闭环（评分 / 纠错 / 留言 / 邮件通知学生）。

跑完后**讲师在 /teacher/recordings 能听学生真录音 + 打分 + 留言**，**学生在 /review 能看到讲师反馈**。

10 个子任务：

| # | 子任务 | 类型 |
|---|---|---|
| 1 | 装 @aws-sdk/client-s3 + s3-request-presigner | npm install |
| 2 | R2 client lib + presigned URL helpers | 新文件 lib/storage/r2.ts |
| 3 | teacher_feedback 表 migration | DB schema |
| 4 | 录音 sign + upload + storage_key 写回 | 改 RecordingPanel + 新 API |
| 5 | 学生自己录音列表 API（含 presigned GET URL）| 改 GET /api/recordings |
| 6 | 讲师侧录音列表 API（含权限校验 / 筛选）| 新 GET /api/teacher/recordings |
| 7 | 讲师反馈 API + Resend 邮件通知 | 新 PATCH /api/teacher/recordings/[id]/feedback |
| 8 | 讲师 UI：录音列表 + 详情评分表单 | 新页面 /teacher/recordings, /teacher/recordings/[id] |
| 9 | 学生侧 review 页显示 teacher_feedback | 改页面 |
| 10 | _meta.json 1.3.0 + 终检 + handoff | 收尾 |

预估 **1.5-2 周**。每个子任务一个独立 commit。

### 工作目录

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
```

---

## 子任务 1 · 装依赖 + 凭据 sanity check

### 1.1 装依赖

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm install --save @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**版本预期**：

- @aws-sdk/client-s3@3.x
- @aws-sdk/s3-request-presigner@3.x

### 1.2 确认 R2 凭据在 .env.local

```bash
grep -c '^R2_ACCOUNT_ID=' .env.local
grep -c '^R2_ACCESS_KEY_ID=' .env.local
grep -c '^R2_SECRET_ACCESS_KEY=' .env.local
grep -c '^R2_BUCKET_NAME=' .env.local
```

全部应输出 `1`。任一为 0 → 在 `inbox/need-input-phase6-r2-{YYYYMMDD}.md` 写 ask 停手。

### 1.3 commit

```bash
git add -A
git commit -m "build(deps): add aws-sdk client-s3 and presigner for R2 uploads"
```

---

## 子任务 2 · R2 client lib + presigned URL helpers

### 2.1 文件 `web/lib/storage/r2.ts`

```ts
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET_NAME;

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY || !BUCKET) {
  console.warn("R2 credentials missing in .env.local; uploads will fail at runtime");
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY ?? "",
    secretAccessKey: SECRET_KEY ?? "",
  },
});

export function recordingKey(userId: string, lessonId: string, recordingId: string, ext: string = "webm") {
  return `audio/${userId}/${lessonId}/${recordingId}.${ext}`;
}

export async function getPresignedPutUrl(key: string, contentType: string, expiresIn = 300) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, cmd, { expiresIn });
}

export async function getPresignedGetUrl(key: string, expiresIn = 600) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2Client, cmd, { expiresIn });
}

export async function deleteObject(key: string) {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
```

### 2.2 安全限制（写进文件顶部注释）

- 单录音 ≤ 10 MB（presigned PUT URL 的 ContentLength 校验 + 服务端 metadata 校验）
- presigned PUT 5 min TTL
- presigned GET 10 min TTL
- bucket 私有，无 anonymous read

### 2.3 commit

```bash
git add -A
git commit -m "feat(storage): R2 S3-compatible client + presigned URL helpers"
```

---

## 子任务 3 · teacher_feedback 表 migration

### 3.1 改 `web/lib/db/schema.ts`，加 teacher_feedback 表

```ts
export const teacherFeedback = pgTable("teacher_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordingId: uuid("recording_id").notNull().references(() => recordings.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id").notNull().references(() => users.id),
  scoreOverall: integer("score_overall"),    // 1-5
  scoreDim: jsonb("score_dim").$type<{
    pronunciation: number;
    fluency: number;
    naturalness: number;
    sapAccuracy: number;
    consultantLike: number;
  } | null>(),
  comment: text("comment"),
  correctedJapanese: text("corrected_japanese"),
  modelRecordingId: uuid("model_recording_id").references(() => recordings.id),  // 讲师示范音频
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  uniqRec: unique().on(t.recordingId),  // 一条录音只能有一份反馈
}));
```

### 3.2 跑 migration

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run drizzle:generate
npm run drizzle:migrate
```

期望生成 `lib/db/migrations/0001_*.sql`，含 `CREATE TABLE teacher_feedback`。

### 3.3 commit

```bash
git add -A
git commit -m "feat(db): teacher_feedback table + 0001 migration applied"
```

---

## 子任务 4 · 录音 sign + upload + storage_key 写回

### 4.1 新建 `web/app/api/recordings/sign/route.ts`

```ts
import { auth } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { recordings } from "@/lib/db/schema";
import { getPresignedPutUrl, recordingKey } from "@/lib/storage/r2";
import { NextResponse } from "next/server";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { lessonId, practiceType, promptText, targetJapanese, mimeType, sizeBytes, durationSec } = body;

  if (typeof sizeBytes !== "number" || sizeBytes <= 0 || sizeBytes > MAX_BYTES) {
    return NextResponse.json({ error: "size out of range (max 10MB)" }, { status: 400 });
  }

  // 1. 先在 DB 占位创建 recording metadata（status=uploading, storageKey 暂空）
  const [rec] = await db.insert(recordings).values({
    studentId: session.user.id,
    lessonId,
    practiceType,
    promptText,
    targetJapanese,
    mimeType: mimeType ?? "audio/webm",
    durationSec: durationSec ?? 0,
    sizeBytes,
    status: "uploading",
  }).returning();

  // 2. 生成 R2 storageKey + presigned PUT URL
  const ext = mimeType?.includes("mp4") ? "mp4" : mimeType?.includes("wav") ? "wav" : "webm";
  const key = recordingKey(session.user.id, lessonId, rec.id, ext);
  const uploadUrl = await getPresignedPutUrl(key, rec.mimeType ?? "audio/webm");

  return NextResponse.json({
    recordingId: rec.id,
    storageKey: key,
    uploadUrl,
    expiresInSec: 300,
  });
}
```

### 4.2 改 `web/app/api/recordings/[id]/route.ts`（新建 PATCH 用于上传完成回调）

```ts
import { auth } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { recordings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // 学生只能改自己的 recording
  const [rec] = await db
    .update(recordings)
    .set({
      storageKey: body.storageKey,
      status: body.status ?? "ready",
    })
    .where(and(eq(recordings.id, id), eq(recordings.studentId, session.user.id)))
    .returning();

  if (!rec) return NextResponse.json({ error: "not found or forbidden" }, { status: 404 });
  return NextResponse.json({ recording: rec });
}
```

### 4.3 改 `components/audio/RecordingPanel.tsx:saveCurrentRecording`

```ts
async function saveCurrentRecording(blobOverride, urlOverride) {
  const activeBlob = blobOverride ?? blob;
  if (!activeBlob) { setError("还没有可保存的录音。"); return; }

  // === 步骤 1：POST sign 拿 presigned URL + recordingId ===
  const signRes = await fetch("/api/recordings/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lessonId,
      practiceType,
      promptText,
      targetJapanese,
      mimeType: activeBlob.type,
      sizeBytes: activeBlob.size,
      durationSec,
    }),
  });

  if (!signRes.ok) {
    setError("准备上传失败，录音仍保存在本地。");
    // 仍写 IndexedDB 作 offline fallback
    return await saveLocalOnly(activeBlob);
  }

  const { recordingId, storageKey, uploadUrl } = await signRes.json();

  // === 步骤 2：客户端直接 PUT blob 到 R2 ===
  try {
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": activeBlob.type },
      body: activeBlob,
    });
    if (!putRes.ok) throw new Error(`upload failed: ${putRes.status}`);
  } catch (e) {
    setError("上传到云端失败，录音仍保存在本地。");
    return await saveLocalOnly(activeBlob, recordingId);
  }

  // === 步骤 3：PATCH 通知服务端上传完成 ===
  await fetch(`/api/recordings/${recordingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storageKey, status: "ready" }),
  });

  // === 步骤 4：本地 IndexedDB 仍存 blob（用于离线回放 + cache）===
  const recording: RecordingAttempt = {
    id: recordingId,
    userId: session?.user?.id ?? "anonymous",
    lessonId,
    practiceType,
    promptText,
    targetJapanese,
    audioUrl: "",
    blob: activeBlob,
    durationSec,
    createdAt: new Date().toISOString(),
    selfAssessment: fallbackAssessment,
  };
  await saveRecording(recording);
  markProgress("completedRecordings", recordingId);
  if (markAsAssignment) markProgress("completedAssignments", `${lessonId}-${practiceType}`);
  onSaved?.(recording);
}
```

### 4.4 commit

```bash
git add -A
git commit -m "feat(recordings): direct-to-R2 upload via presigned URL + storage_key writeback"
```

---

## 子任务 5 · 学生自己录音列表 API（含 presigned GET URL）

### 5.1 改 `web/app/api/recordings/route.ts:GET`

```ts
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ recordings: [] }, { status: 401 });

  const recs = await db
    .select()
    .from(recordings)
    .where(eq(recordings.studentId, session.user.id))
    .orderBy(desc(recordings.createdAt))
    .limit(200);

  // 为每条 recording 生成 presigned GET URL（10 min TTL）
  const enriched = await Promise.all(
    recs.map(async (r) => ({
      ...r,
      audioGetUrl: r.storageKey ? await getPresignedGetUrl(r.storageKey) : null,
    }))
  );

  return NextResponse.json({ recordings: enriched });
}
```

### 5.2 改 `components/audio/RecordingHistory.tsx` 用 audioGetUrl

```ts
async function refresh() {
  const res = await fetch("/api/recordings");
  if (!res.ok) { setError("拉取失败"); return; }
  const { recordings } = await res.json();
  setItems(lessonId ? recordings.filter(r => r.lessonId === lessonId) : recordings);
}

// 在渲染时优先用 audioGetUrl（云端 presigned URL），fallback 用 IndexedDB blob
<audio controls src={item.audioGetUrl ?? recordingToObjectUrl(item)} />
```

### 5.3 commit

```bash
git add -A
git commit -m "feat(recordings): student GET list returns presigned audio URLs"
```

---

## 子任务 6 · 讲师侧录音列表 API

### 6.1 新建 `web/app/api/teacher/recordings/route.ts`

```ts
import { auth } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { recordings, users, enrollments, classes, teacherFeedback } from "@/lib/db/schema";
import { eq, and, desc, inArray, isNull, isNotNull } from "drizzle-orm";
import { getPresignedGetUrl } from "@/lib/storage/r2";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 讲师只能看自己班的学生（admin 看全部）
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");
  const lessonId = url.searchParams.get("lessonId");
  const status = url.searchParams.get("status");
  const hasFeedback = url.searchParams.get("hasFeedback");  // "yes" | "no" | null

  let studentIds: string[] = [];
  if (session.user.role === "admin") {
    // admin 可以看所有学生（不限制 enrollment）
    studentIds = []; // 空数组 = 不限制
  } else {
    const myClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.teacherId, session.user.id));
    const classIds = myClasses.map(c => c.id);
    if (classIds.length === 0) {
      return NextResponse.json({ recordings: [] });
    }
    const enrolled = await db
      .select({ studentId: enrollments.studentId })
      .from(enrollments)
      .where(and(inArray(enrollments.classId, classIds), eq(enrollments.status, "active")));
    studentIds = enrolled.map(e => e.studentId);
    if (studentIds.length === 0) return NextResponse.json({ recordings: [] });
  }

  // 构造 query
  const conditions = [];
  if (studentIds.length > 0) conditions.push(inArray(recordings.studentId, studentIds));
  if (studentId) conditions.push(eq(recordings.studentId, studentId));
  if (lessonId) conditions.push(eq(recordings.lessonId, lessonId));
  if (status) conditions.push(eq(recordings.status, status as any));

  const recs = await db
    .select({
      r: recordings,
      studentEmail: users.email,
      studentName: users.name,
      feedback: teacherFeedback,
    })
    .from(recordings)
    .leftJoin(users, eq(users.id, recordings.studentId))
    .leftJoin(teacherFeedback, eq(teacherFeedback.recordingId, recordings.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(recordings.createdAt))
    .limit(200);

  // hasFeedback 筛选
  const filtered = recs.filter(row => {
    if (hasFeedback === "yes") return !!row.feedback;
    if (hasFeedback === "no") return !row.feedback;
    return true;
  });

  // presigned GET URL
  const enriched = await Promise.all(
    filtered.map(async (row) => ({
      ...row.r,
      studentEmail: row.studentEmail,
      studentName: row.studentName,
      feedback: row.feedback,
      audioGetUrl: row.r.storageKey ? await getPresignedGetUrl(row.r.storageKey) : null,
    }))
  );

  return NextResponse.json({ recordings: enriched });
}
```

### 6.2 commit

```bash
git add -A
git commit -m "feat(teacher): recordings list API with enrollment-scoped access + filters"
```

---

## 子任务 7 · 讲师反馈 API + Resend 邮件通知

### 7.1 新建 `web/app/api/teacher/recordings/[id]/feedback/route.ts`

```ts
import { auth } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { recordings, users, teacherFeedback } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id: recordingId } = await params;
  const body = await req.json();
  const { scoreOverall, scoreDim, comment, correctedJapanese } = body;

  // 1. upsert teacher_feedback
  const [feedback] = await db
    .insert(teacherFeedback)
    .values({
      recordingId,
      teacherId: session.user.id,
      scoreOverall,
      scoreDim,
      comment,
      correctedJapanese,
    })
    .onConflictDoUpdate({
      target: teacherFeedback.recordingId,
      set: { scoreOverall, scoreDim, comment, correctedJapanese, updatedAt: new Date() },
    })
    .returning();

  // 2. 拉学生邮箱
  const [rec] = await db
    .select({ studentId: recordings.studentId, lessonId: recordings.lessonId })
    .from(recordings)
    .where(eq(recordings.id, recordingId));
  if (rec) {
    const [student] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, rec.studentId));

    // 3. 发邮件通知
    if (student?.email) {
      try {
        await resend.emails.send({
          from: process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev",
          to: student.email,
          subject: `SAP 日语口语训练 · 你的录音收到讲师反馈`,
          html: `
            <p>${student.name ?? "同学"}你好：</p>
            <p>讲师对你 ${rec.lessonId} 的录音作出了反馈。</p>
            ${scoreOverall ? `<p>总分：${scoreOverall} / 5</p>` : ""}
            ${comment ? `<p>留言：${comment}</p>` : ""}
            ${correctedJapanese ? `<p>纠正后表达：<br>${correctedJapanese}</p>` : ""}
            <p><a href="${process.env.NEXTAUTH_URL}/review">登录查看完整反馈</a></p>
            <p>—— SAP 日语口语训练平台</p>
          `,
        });
      } catch (e) {
        console.warn("email notification failed:", e);
      }
    }
  }

  return NextResponse.json({ feedback });
}
```

### 7.2 commit

```bash
git add -A
git commit -m "feat(teacher): feedback API upsert + resend notification email"
```

---

## 子任务 8 · 讲师 UI（录音列表 + 详情评分表单）

### 8.1 新建 `web/app/teacher/recordings/page.tsx`

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function TeacherRecordingsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filters, setFilters] = useState({ lessonId: "", studentId: "", hasFeedback: "" });

  async function refresh() {
    const url = new URL("/api/teacher/recordings", window.location.origin);
    if (filters.lessonId) url.searchParams.set("lessonId", filters.lessonId);
    if (filters.studentId) url.searchParams.set("studentId", filters.studentId);
    if (filters.hasFeedback) url.searchParams.set("hasFeedback", filters.hasFeedback);
    const res = await fetch(url);
    const data = await res.json();
    setItems(data.recordings ?? []);
  }

  useEffect(() => { refresh(); }, [filters]);

  return (
    <div className="page-shell space-y-6">
      <h1 className="text-2xl font-bold text-ink">学生录音作业</h1>
      <div className="panel grid gap-3 p-4 md:grid-cols-3">
        <select className="input" value={filters.lessonId} onChange={(e) => setFilters({ ...filters, lessonId: e.target.value })}>
          <option value="">全部课次</option>
          {Array.from({length: 24}, (_, i) => i + 1).map(n => (
            <option key={n} value={`lesson_${String(n).padStart(2, "0")}`}>{`第 ${String(n).padStart(2, "0")} 课`}</option>
          ))}
        </select>
        <select className="input" value={filters.hasFeedback} onChange={(e) => setFilters({ ...filters, hasFeedback: e.target.value })}>
          <option value="">全部状态</option>
          <option value="no">未点评</option>
          <option value="yes">已点评</option>
        </select>
        <button className="btn-secondary" onClick={refresh}>刷新</button>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-500">暂无录音。</p> : null}
        {items.map((r) => (
          <Link key={r.id} href={`/teacher/recordings/${r.id}`} className="panel block p-4 hover:bg-mist">
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{r.studentName ?? r.studentEmail} · {r.lessonId} · {r.practiceType}</p>
                <p className="mt-1 text-sm text-slate-600">{r.promptText}</p>
              </div>
              <span className={r.feedback ? "rounded-md bg-green-50 px-2 py-1 text-xs text-green-700" : "rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700"}>
                {r.feedback ? "已点评" : "待点评"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()} · {r.durationSec}s</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### 8.2 新建 `web/app/teacher/recordings/[id]/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";

export default function TeacherRecordingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [rec, setRec] = useState<any>(null);
  const [form, setForm] = useState({ scoreOverall: 3, pronunciation: 3, fluency: 3, naturalness: 3, sapAccuracy: 3, consultantLike: 3, comment: "", correctedJapanese: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetch("/api/teacher/recordings").then(r => r.json()).then(data => {
        const found = data.recordings.find((x: any) => x.id === p.id);
        if (found) {
          setRec(found);
          if (found.feedback) {
            setForm({
              scoreOverall: found.feedback.scoreOverall ?? 3,
              pronunciation: found.feedback.scoreDim?.pronunciation ?? 3,
              fluency: found.feedback.scoreDim?.fluency ?? 3,
              naturalness: found.feedback.scoreDim?.naturalness ?? 3,
              sapAccuracy: found.feedback.scoreDim?.sapAccuracy ?? 3,
              consultantLike: found.feedback.scoreDim?.consultantLike ?? 3,
              comment: found.feedback.comment ?? "",
              correctedJapanese: found.feedback.correctedJapanese ?? "",
            });
          }
        }
      });
    });
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/teacher/recordings/${id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scoreOverall: form.scoreOverall,
        scoreDim: {
          pronunciation: form.pronunciation,
          fluency: form.fluency,
          naturalness: form.naturalness,
          sapAccuracy: form.sapAccuracy,
          consultantLike: form.consultantLike,
        },
        comment: form.comment,
        correctedJapanese: form.correctedJapanese,
      }),
    });
    if (res.ok) setSaved(true);
  }

  if (!rec) return <div className="page-shell"><p className="text-sm text-slate-500">加载中...</p></div>;

  return (
    <div className="page-shell space-y-6">
      <h1 className="text-2xl font-bold text-ink">录音详情 · 评分</h1>
      <div className="panel space-y-3 p-4">
        <p><b>学生：</b>{rec.studentName ?? rec.studentEmail}</p>
        <p><b>课次：</b>{rec.lessonId}</p>
        <p><b>类型：</b>{rec.practiceType}</p>
        <p><b>提示：</b>{rec.promptText}</p>
        {rec.targetJapanese ? <p><b>目标日语：</b><span lang="ja">{rec.targetJapanese}</span></p> : null}
        {rec.audioGetUrl ? <audio controls src={rec.audioGetUrl} className="w-full" /> : <p className="text-sm text-amber-700">录音文件不可用（学生未上传或已删除）。</p>}
      </div>
      <form onSubmit={onSubmit} className="panel space-y-4 p-4">
        <h2 className="font-semibold text-ink">评分</h2>
        {(["pronunciation", "fluency", "naturalness", "sapAccuracy", "consultantLike"] as const).map(key => {
          const label = { pronunciation: "发音", fluency: "流利度", naturalness: "自然度", sapAccuracy: "SAP 术语准确度", consultantLike: "顾问表达感" }[key];
          return (
            <label key={key} className="grid grid-cols-[160px_1fr_32px] items-center gap-2 text-sm">
              <span>{label}</span>
              <input type="range" min={1} max={5} value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />
              <span className="text-right font-semibold text-sap">{form[key]}</span>
            </label>
          );
        })}
        <label className="grid grid-cols-[160px_1fr_32px] items-center gap-2 text-sm">
          <span className="font-semibold">总分</span>
          <input type="range" min={1} max={5} value={form.scoreOverall} onChange={(e) => setForm({ ...form, scoreOverall: Number(e.target.value) })} />
          <span className="text-right font-bold text-sap">{form.scoreOverall}</span>
        </label>
        <div>
          <label className="text-sm font-semibold">纠正后日语表达</label>
          <textarea className="input mt-1 min-h-20 w-full" lang="ja" value={form.correctedJapanese} onChange={(e) => setForm({ ...form, correctedJapanese: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-semibold">留言</label>
          <textarea className="input mt-1 min-h-24 w-full" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="给学生的反馈、改进建议..." />
        </div>
        <button type="submit" className="btn-primary">提交反馈（学生会收到邮件）</button>
        {saved ? <p className="text-sm text-green-700">已保存 ✓ 邮件已发送给学生</p> : null}
      </form>
    </div>
  );
}
```

### 8.3 加 sidebar 入口 `/teacher/recordings`

改 `app/teacher/page.tsx` 顶部加按钮：

```tsx
<Link href="/teacher/recordings" className="btn-primary">查看学生录音作业</Link>
```

替换 Phase 5 的 StudentRecordingReview 占位卡（保留警告卡作为 Phase 5/6 切换的过渡说明，把它改成"现在可用"绿色卡）。

### 8.4 commit

```bash
git add -A
git commit -m "feat(teacher): recordings list page + detail page with feedback form"
```

---

## 子任务 9 · 学生侧 review 页显示 teacher_feedback

### 9.1 改 `app/review/page.tsx`

新增「讲师反馈」section，从 `/api/recordings` 拉的数据已经有 feedback 字段（如果讲师评过）。

```tsx
const recordingsWithFeedback = items.filter((r) => r.feedback);

<section className="panel p-4">
  <h2 className="font-semibold text-ink">讲师反馈</h2>
  {recordingsWithFeedback.length === 0 ? (
    <p className="mt-2 text-sm text-slate-500">还没有讲师反馈。讲师评分后这里会显示。</p>
  ) : (
    <div className="mt-3 space-y-3">
      {recordingsWithFeedback.map((r) => (
        <div key={r.id} className="rounded-lg border border-line p-3">
          <p className="text-sm font-semibold text-ink">{r.lessonId} · {r.practiceType} · 总分 {r.feedback.scoreOverall}/5</p>
          {r.feedback.comment ? <p className="mt-1 text-sm text-slate-600">{r.feedback.comment}</p> : null}
          {r.feedback.correctedJapanese ? (
            <p className="mt-1 text-sm">
              <span className="text-xs text-slate-500">纠正：</span>
              <span lang="ja">{r.feedback.correctedJapanese}</span>
            </p>
          ) : null}
          {r.audioGetUrl ? <audio controls src={r.audioGetUrl} className="mt-2 w-full" /> : null}
        </div>
      ))}
    </div>
  )}
</section>
```

### 9.2 改 `/api/recordings` GET 返回的 recording 项加 feedback join

让 5.1 节那个 GET 也 join `teacherFeedback`：

```ts
const recs = await db
  .select({ r: recordings, feedback: teacherFeedback })
  .from(recordings)
  .leftJoin(teacherFeedback, eq(teacherFeedback.recordingId, recordings.id))
  .where(eq(recordings.studentId, session.user.id))
  ...
```

返回时把 `feedback` 字段一起暴露给学生。

### 9.3 commit

```bash
git add -A
git commit -m "feat(review): student review page displays teacher feedback"
```

---

## 子任务 10 · _meta.json + 终检 + handoff

### 10.1 升级 `_meta.json` 到 1.3.0

```json
{
  "schemaVersion": "1.3.0",
  "backend": {
    "auth": "next-auth@5",
    "database": "neon postgres",
    "email": "resend",
    "storage": "cloudflare r2",
    "tables": 20
  }
}
```

### 10.2 终检（重要 · 端到端验证）

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run typecheck
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000

# 浏览器手测：
#   1. 学生 A 登录 → 录音保存 → 看 R2 bucket 出现新文件
#   2. /api/recordings 返回的 recordings 都有 audioGetUrl
#   3. 学生 A 在 /review 页能听自己的录音
#   4. 讲师登录 → /teacher/recordings → 看到学生 A 的录音 → 点开详情 → 听 → 评分提交
#   5. 学生 A 邮箱收到反馈通知邮件
#   6. 学生 A 刷新 /review 看到讲师反馈 + 纠正
#   7. 学生 B 登录 → 看不到学生 A 的录音（隔离）
#   8. 学生 A 用浏览器直接访问 R2 直链 → 403（私有 bucket 保护）
#   9. presigned URL 过期 10 min 后访问 → 403
```

### 10.3 handoff

`projects/4-sap-training/inbox/handoff-phase-6-{今日 YYYYMMDD}.md`：

```markdown
# Phase 6 Handoff · YYYY-MM-DD

## Commits（10 个）
- <h1> build(deps): aws-sdk client-s3 + presigner
- <h2> feat(storage): R2 client + presigned URL helpers
- <h3> feat(db): teacher_feedback table + 0001 migration
- <h4> feat(recordings): direct-to-R2 upload + storage_key writeback
- <h5> feat(recordings): student GET list with presigned audio URLs
- <h6> feat(teacher): recordings list API with enrollment-scoped access
- <h7> feat(teacher): feedback API + resend notification
- <h8> feat(teacher): recordings list + detail page with feedback form
- <h9> feat(review): student review page displays teacher feedback
- <h10> chore(state): record Phase 6 completion + meta 1.3.0

## Verification 数据
- R2 bucket 文件数: <X>（学生录音 webm）
- DB recordings 行数: <X>（含 storageKey 的）
- DB teacher_feedback 行数: <X>（讲师评的）
- 端到端流程（注册 A → 录音 → 讲师评 → A 收邮件 → A 看 feedback）: PASS
- 学生 A vs B 隔离: PASS
- R2 直链 403（私有保护）: PASS
- presigned URL 过期 403: PASS

## First Load JS
- /teacher/recordings: <X kB>
- /teacher/recordings/[id]: <X kB>
- /review: <X kB>

## 遗留 / 风险
- substitutionDrills 仍为 0
- mp3 还没 TTS 生成（Phase 3.5）
- 单录音 10 MB 限制
- bucket lifecycle 还没配（90 天归档），留 Phase 7

## 下一步
等 Claude 验收。Phase 7 上线合规收尾（RBAC / rate limit / Sentry / 备份 / 同意书）。
```

### 10.4 commit

```bash
git add -A
git commit -m "chore(state): record Phase 6 completion + meta schema 1.3.0"
```

---

## 严禁

1. 不许把 R2 凭据写进任何 git tracked 文件
2. 不许把 mp3/webm/wav 二进制 commit 进 git
3. 不许在 client bundle 里暴露 R2 secret access key（只能在 server lib/storage/r2.ts 用）
4. 不许 GET /api/recordings 漏 session 检查 / 漏 where studentId
5. 不许 PATCH /api/recordings/[id] 漏校验 studentId（学生不能改别人的录音）
6. 不许 GET /api/teacher/recordings 漏 role check
7. 不许直接返回 R2 原始 URL 给 client（必须 presigned）
8. 不许 presigned PUT URL TTL > 10 min
9. 不许 presigned GET URL TTL > 30 min
10. 不许跳过单录音 10 MB 上限校验
11. 不许自动接 Phase 7

## 阻塞时停手

- R2 凭据缺
- AWS SDK install 失败
- presigned URL 上传 403/404（凭据错 / bucket 不存在）
- 学生 A 能看到学生 B 的录音
- 任何 API 漏 session 检查
- Resend 邮件通知发不出
- typecheck / build 失败原因看不出

inbox/need-input-phase6-{YYYYMMDD}-{topic}.md 写 ask 停手。

---

## 任务结束

完成 10 个子任务、跑通端到端验证、写交接、停手等 Claude 验收。
