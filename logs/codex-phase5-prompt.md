# Codex 任务包 · Phase 5「Auth + Postgres + 服务端基座」

> 由 codex-phase5-execute.md 引用。Codex 在执行第 4 章「任务包正文」时 Read 本文。

---

## 任务开始

### 这一 Phase 干什么

把网站从「纯前端 alpha + localStorage」升级为「Auth + Postgres 后端，多学生数据隔离」。
跨过这道坎，10 个测试学生 + 1-2 个讲师就能用真实账号上来跑了。

10 个子任务：

| # | 子任务 | 类型 |
|---|---|---|
| 1 | 装依赖 + scripts | npm install |
| 2 | Drizzle schema 10 张表 + migrate | DB schema |
| 3 | Seed 脚本 + 灌 24 课内容到 DB | 数据迁移 |
| 4 | Auth.js v5 + Resend magic link 配置 | 后端 |
| 5 | 登录/验证页 + middleware 守卫 | 前端 + 路由 |
| 6 | progress events API + progress-storage 改 fetch | API + 改前端 |
| 7 | 录音 metadata API + RecordingPanel 接入 | API + 改前端 |
| 8 | content-loader 改 DB-backed | 改前端 |
| 9 | 数据按需拆分修 First Load JS 工程债 | 性能 |
| 10 | _meta.json + 终检 + handoff | 收尾 |

预估 **1.5-2 周**。每个子任务一个独立 commit。

### 工作目录

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
```

### Ryan 已选凭据路径 A

Ryan 已经确认会准备：

- **Neon Postgres**：`DATABASE_URL=postgres://user:pass@host/db?sslmode=require`
- **Resend 邮件**：`RESEND_API_KEY=re_...`
- **Auth.js Secret**：`AUTH_SECRET=<openssl rand -base64 32 生成>`
- **NEXTAUTH_URL=http://localhost:3000`（本地开发；上线后改 Vercel/Render URL）

凭据全写到 `web/.env.local`（已 .gitignore，永不入 git）。

起手 sanity check（子任务 1 之前）：

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
ls .env.local                                       # 必须存在
grep -E '^(DATABASE_URL|RESEND_API_KEY|AUTH_SECRET)=' .env.local | wc -l
# 必须 ≥ 3（DATABASE_URL / RESEND_API_KEY / AUTH_SECRET 都在）
git ls-files .env.local                              # 必须输出空（不在 git 里）
```

任一不满足 → 在 `projects/4-sap-training/inbox/need-input-phase5-creds-{YYYYMMDD}.md`
写 ask 列出缺失凭据，停手等 Ryan 配好。

---

## 子任务 1 · 装依赖 + scripts

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm install --save next-auth@beta @auth/drizzle-adapter drizzle-orm drizzle-kit pg resend
npm install --save-dev @types/pg
```

**版本预期**（写入 handoff 给 Claude 验收）：

- next-auth@5.x（beta）
- @auth/drizzle-adapter@1.x
- drizzle-orm@0.x
- drizzle-kit@0.x
- pg@8.x
- resend@3.x

`package.json` 加 scripts：

```json
{
  "scripts": {
    "drizzle:generate": "drizzle-kit generate",
    "drizzle:migrate": "drizzle-kit migrate",
    "drizzle:push": "drizzle-kit push",
    "drizzle:studio": "drizzle-kit studio",
    "seed-db": "node scripts/seed-db.mjs"
  }
}
```

### Commit

```bash
git add -A
git commit -m "build(deps): add auth.js v5 drizzle pg resend for Phase 5"
```

---

## 子任务 2 · Drizzle schema 10 张表 + migrate

### 2.1 文件 `web/drizzle.config.ts`

```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### 2.2 文件 `web/lib/db/schema.ts`

10 张表完整定义（**字段名用 snake_case，TS 引用名用 camelCase**）：

```ts
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, pgEnum, primaryKey, unique } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "admin"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["active", "paused", "completed", "dropped"]);
export const assetVisibilityEnum = pgEnum("asset_visibility", ["student", "teacher", "both"]);
export const submissionStatusEnum = pgEnum("submission_status", ["draft", "submitted", "pending-review", "reviewed"]);
export const recordingStatusEnum = pgEnum("recording_status", ["uploading", "ready", "flagged", "deleted"]);
export const practiceTypeEnum = pgEnum("practice_type", ["shadowing", "micro-training", "consultant-output", "role-play"]);
export const progressEventTypeEnum = pgEnum("progress_event_type", [
  "shadowing_done", "recording_saved", "term_favorited", "phrase_favorited",
  "shadowing_favorited", "self_assessment_saved", "lesson_started",
  "lesson_completed", "assignment_submitted", "lesson_step_advanced"
]);
export const favoriteKindEnum = pgEnum("favorite_kind", ["term", "phrase", "shadowing"]);

// 1. users (Auth.js v5 需要的字段 + 自定义 role/locale)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  name: text("name"),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("student"),
  locale: text("locale").default("zh-CN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. accounts (Auth.js)
export const accounts = pgTable("accounts", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) }));

// 3. sessions (Auth.js)
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

// 4. verificationTokens (Auth.js magic link)
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) }));

// 5. classes
export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  teacherId: uuid("teacher_id").references(() => users.id),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. enrollments
export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: enrollmentStatusEnum("status").notNull().default("active"),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
}, (t) => ({ uniq: unique().on(t.classId, t.studentId) }));

// 7. lessons（seed 自动灌；字段名跟现有 data/lessons.json 对齐）
export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),  // lesson_01
  trackId: text("track_id").notNull(),
  level: text("level").notNull(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  sapModules: jsonb("sap_modules").$type<string[]>().default([]),
  projectPhase: jsonb("project_phase").$type<string[]>().default([]),
  japaneseSkillTargets: jsonb("japanese_skill_targets").$type<string[]>().default([]),
  consultantSkillTargets: jsonb("consultant_skill_targets").$type<string[]>().default([]),
  finalOutputTask: text("final_output_task"),
  scenarioMap: jsonb("scenario_map").default([]),
  transcriptMarkdown: text("transcript_markdown"),
  courseDesignMarkdown: text("course_design_markdown"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 8. lesson_assets（Lesson.assets[] 拆出）
export const lessonAssets = pgTable("lesson_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  path: text("path").notNull(),
  markdown: text("markdown").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  visibility: assetVisibilityEnum("visibility").notNull().default("both"),
});

// 9. phrases
export const phrases = pgTable("phrases", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  category: text("category"),
  japanese: text("japanese").notNull(),
  chinese: text("chinese").default(""),
  usage: text("usage"),
  replaceableParts: jsonb("replaceable_parts").$type<string[]>().default([]),
  audioUrl: text("audio_url"),
});

// 10. glossary_terms
export const glossaryTerms = pgTable("glossary_terms", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  chinese: text("chinese"),
  englishOrSap: text("english_or_sap"),
  japanese: text("japanese"),
  reading: text("reading"),
  module: text("module"),
  projectPhase: text("project_phase"),
  scenario: text("scenario"),
  exampleSentence: text("example_sentence"),
  note: text("note"),
  needsReview: boolean("needs_review").default(false),
});

// 11. shadowing_items
export const shadowingItems = pgTable("shadowing_items", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  japanese: text("japanese").notNull(),
  chinese: text("chinese").default(""),
  scenario: text("scenario"),
  audioUrl: text("audio_url"),
  requiredRepeats: integer("required_repeats").default(3),
});

// 12. roleplays
export const roleplays = pgTable("roleplays", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  scenario: text("scenario"),
  roleA: text("role_a"),
  roleB: text("role_b"),
  requiredPhrases: jsonb("required_phrases").$type<string[]>().default([]),
  dialogue: jsonb("dialogue").$type<{role: "A" | "B"; text: string}[]>().notNull(),
});

// 13. assignments
export const assignments = pgTable("assignments", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  prompt: text("prompt"),
  targetDurationSec: integer("target_duration_sec"),
});

// 14. assignment_submissions
export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: text("assignment_id").notNull().references(() => assignments.id),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recordingId: uuid("recording_id"),
  textContent: text("text_content"),
  selfAssessment: jsonb("self_assessment"),
  status: submissionStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 15. recordings（metadata only；blob 仍在 IndexedDB；Phase 6 上 S3）
export const recordings = pgTable("recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull().references(() => lessons.id),
  practiceType: practiceTypeEnum("practice_type").notNull(),
  promptText: text("prompt_text"),
  targetJapanese: text("target_japanese"),
  storageKey: text("storage_key"),     // Phase 6 才填 R2 key
  mimeType: text("mime_type"),
  durationSec: integer("duration_sec"),
  sizeBytes: integer("size_bytes"),
  selfAssessment: jsonb("self_assessment"),
  status: recordingStatusEnum("status").notNull().default("ready"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 16. progress_events
export const progressEvents = pgTable("progress_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: progressEventTypeEnum("type").notNull(),
  lessonId: text("lesson_id").references(() => lessons.id),
  refId: text("ref_id"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 17. favorites
export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: favoriteKindEnum("kind").notNull(),
  refId: text("ref_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({ uniq: unique().on(t.studentId, t.kind, t.refId) }));

// 18. library_items
export const libraryItems = pgTable("library_items", {
  id: text("id").primaryKey(),         // glossary-master / phrasebook-master 等
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  path: text("path").notNull(),
  markdown: text("markdown").notNull(),
  wordCount: integer("word_count").default(0),
  visibility: assetVisibilityEnum("visibility").notNull().default("both"),
});

// 19. review_terms（评审报告里术语 / ASR 待复核）
export const reviewTerms = pgTable("review_terms", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").references(() => lessons.id),
  rawText: text("raw_text"),
  suggestion: text("suggestion"),
  adoptedJapanese: text("adopted_japanese"),
  reason: text("reason"),
  mustReview: boolean("must_review").default(false),
  status: text("status").default("pending"),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  reviewMemo: text("review_memo"),
  reviewedAt: timestamp("reviewed_at"),
});
```

> 实际数 19 张表（Auth.js 自带的 accounts/sessions/verificationTokens 算进去；
> 业务表 15 张）。

### 2.3 文件 `web/lib/db/index.ts`

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool);
```

### 2.4 跑 migration

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run drizzle:generate              # 生成 lib/db/migrations/*.sql
npm run drizzle:migrate                # 推到 Neon
```

如果 generate / migrate 任一报错（连不上 / DDL 冲突）→ 在 inbox 写 ask 停手。

### 2.5 commit

```bash
git add -A
git commit -m "feat(db): drizzle schema 19 tables + first migration applied to neon"
```

---

## 子任务 3 · Seed 脚本 + 灌内容

### 3.1 `scripts/seed-db.mjs`

```js
#!/usr/bin/env node
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "../lib/db/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// 读 .env.local（同 generate-tts.mjs）
function loadEnv() {
  const p = path.join(root, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL missing in web/.env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool, { schema });

const data = (name) => JSON.parse(fs.readFileSync(path.join(root, `data/${name}.json`), "utf8"));

async function main() {
  console.log("Seeding lessons...");
  const lessons = data("lessons");
  // 1. lessons 主表
  for (const l of lessons) {
    await db.insert(schema.lessons).values({
      id: l.id,
      trackId: l.trackId,
      level: l.level,
      order: l.order,
      title: l.title,
      summary: l.summary ?? "",
      sapModules: l.sapModules ?? [],
      projectPhase: l.projectPhase ?? [],
      japaneseSkillTargets: l.japaneseSkillTargets ?? [],
      consultantSkillTargets: l.consultantSkillTargets ?? [],
      finalOutputTask: l.finalOutputTask ?? "",
      scenarioMap: l.scenarioMap ?? [],
      transcriptMarkdown: l.transcriptMarkdown ?? "",
      courseDesignMarkdown: l.courseDesignMarkdown ?? "",
    }).onConflictDoNothing();
  }

  // 2. lesson_assets
  for (const l of lessons) {
    for (const a of l.assets ?? []) {
      await db.insert(schema.lessonAssets).values({
        lessonId: l.id,
        kind: a.kind,
        title: a.title,
        path: a.path,
        markdown: a.markdown,
        wordCount: a.wordCount,
        visibility: a.visibility,
      });
    }
  }

  // 3. phrases / shadowing / roleplays / assignments
  for (const l of lessons) {
    for (const p of l.phrases ?? []) {
      await db.insert(schema.phrases).values({
        id: p.id,
        lessonId: l.id,
        category: p.category,
        japanese: p.japanese,
        chinese: p.chinese ?? "",
        usage: p.usage,
        replaceableParts: p.replaceableParts ?? [],
        audioUrl: p.audioSrc,
      }).onConflictDoNothing();
    }
    for (const s of l.shadowingItems ?? []) {
      await db.insert(schema.shadowingItems).values({
        id: s.id,
        lessonId: l.id,
        japanese: s.japanese,
        chinese: s.chinese ?? "",
        scenario: s.scenario,
        audioUrl: s.audioSrc,
        requiredRepeats: s.requiredRepeats ?? 3,
      }).onConflictDoNothing();
    }
    for (const r of l.rolePlays ?? []) {
      await db.insert(schema.roleplays).values({
        id: r.id,
        lessonId: l.id,
        title: r.title,
        scenario: r.scenario,
        roleA: r.roleA,
        roleB: r.roleB,
        requiredPhrases: r.requiredPhrases ?? [],
        dialogue: r.dialogue,
      }).onConflictDoNothing();
    }
    for (const a of l.assignments ?? []) {
      await db.insert(schema.assignments).values({
        id: a.id,
        lessonId: l.id,
        type: a.type,
        title: a.title,
        prompt: a.prompt,
        targetDurationSec: a.targetDurationSec,
      }).onConflictDoNothing();
    }
  }

  // 4. glossary_terms（顶层 data/glossary.json）
  const glossary = data("glossary");
  for (const t of glossary) {
    await db.insert(schema.glossaryTerms).values({
      id: t.id,
      lessonId: t.lessonId ?? null,
      chinese: t.chinese,
      englishOrSap: t.englishOrSap,
      japanese: t.japanese,
      reading: t.reading,
      module: t.module,
      projectPhase: t.projectPhase,
      scenario: t.scenario,
      exampleSentence: t.exampleSentence,
      note: t.note,
      needsReview: !!t.needsReview,
    }).onConflictDoNothing();
  }

  // 5. library_items
  const library = data("library");
  for (const li of library) {
    await db.insert(schema.libraryItems).values({
      id: li.kind,    // glossary-master 等
      kind: li.kind,
      title: li.title,
      path: li.path,
      markdown: li.markdown,
      wordCount: li.wordCount,
      visibility: li.visibility,
    }).onConflictDoNothing();
  }

  // 6. review_terms
  const reviewTerms = data("review-terms");
  for (const rt of reviewTerms) {
    await db.insert(schema.reviewTerms).values({
      id: rt.id,
      lessonId: rt.lessonId,
      rawText: rt.rawText,
      suggestion: rt.suggestion,
      adoptedJapanese: rt.adoptedJapanese,
      reason: rt.reason,
      mustReview: !!rt.mustReview,
      status: rt.status ?? "pending",
    }).onConflictDoNothing();
  }

  // 统计
  const counts = await Promise.all([
    db.execute("SELECT COUNT(*) as c FROM lessons"),
    db.execute("SELECT COUNT(*) as c FROM phrases"),
    db.execute("SELECT COUNT(*) as c FROM shadowing_items"),
    db.execute("SELECT COUNT(*) as c FROM roleplays"),
    db.execute("SELECT COUNT(*) as c FROM lesson_assets"),
    db.execute("SELECT COUNT(*) as c FROM glossary_terms"),
    db.execute("SELECT COUNT(*) as c FROM library_items"),
  ]);
  console.log("Done. Counts:", counts.map(r => r.rows[0].c));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
```

### 3.2 跑 seed

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run seed-db
```

**期望输出**（counts）：

- lessons: 24
- phrases: 480
- shadowing_items: 480
- roleplays: 48
- lesson_assets: 240
- glossary_terms: 528
- library_items: 6

不达预期 → 在 inbox 写 ask 停手。

### 3.3 commit

```bash
git add -A
git commit -m "feat(db): seed script + initial 24 lessons content loaded into postgres"
```

---

## 子任务 4 · Auth.js v5 + Resend magic link

### 4.1 `web/lib/auth/options.ts`

```ts
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    EmailProvider({
      from: process.env.AUTH_EMAIL_FROM ?? "no-reply@sap-jp.local",
      sendVerificationRequest: async ({ identifier, url }) => {
        await resend.emails.send({
          from: process.env.AUTH_EMAIL_FROM ?? "no-reply@sap-jp.local",
          to: identifier,
          subject: "SAP 日语口语训练平台 · 登录链接",
          html: `
            <p>你好，</p>
            <p>点击下方链接登录 SAP 日语口语训练平台（15 分钟内有效）：</p>
            <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#0f6fbd;color:#fff;text-decoration:none;border-radius:4px">点击登录</a></p>
            <p>或复制链接到浏览器：<br>${url}</p>
            <p>如果你没有请求过此邮件，请直接忽略。</p>
            <p>—— SAP 日语口语训练平台</p>
          `,
        });
      },
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
        // @ts-ignore
        session.user.role = user.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  session: { strategy: "database" },
});
```

### 4.2 `web/app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/lib/auth/options";
export const { GET, POST } = handlers;
```

### 4.3 commit

```bash
git add -A
git commit -m "feat(auth): nextauth v5 magic link via resend + drizzle adapter"
```

---

## 子任务 5 · 登录/验证页 + middleware 守卫

### 5.1 `web/app/login/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await signIn("email", { email, callbackUrl: "/dashboard" });
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md panel p-6">
        <h1 className="text-2xl font-bold text-ink">登录</h1>
        <p className="mt-2 text-sm text-slate-600">输入你的邮箱，我们会发送一个登录链接（15 分钟内有效）。</p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full"
          />
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "发送中…" : "发送登录链接"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 5.2 `web/app/login/verify/page.tsx`

```tsx
export default function VerifyPage() {
  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md panel p-6 text-center">
        <h1 className="text-2xl font-bold text-ink">查看你的邮箱</h1>
        <p className="mt-3 text-sm text-slate-600">
          我们已经发送了一封带登录链接的邮件。点击邮件里的按钮即可登录。
        </p>
        <p className="mt-2 text-xs text-slate-500">链接 15 分钟内有效。如果没收到，请检查垃圾邮件文件夹。</p>
      </div>
    </div>
  );
}
```

### 5.3 `web/middleware.ts`

```ts
import { auth } from "@/lib/auth/options";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/login/verify", "/api/auth"];
const TEACHER_PATHS = ["/teacher"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (TEACHER_PATHS.some((p) => pathname.startsWith(p))) {
    // @ts-ignore
    if (req.auth.user?.role !== "teacher" && req.auth.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|audio).*)"],
};
```

### 5.4 commit

```bash
git add -A
git commit -m "feat(auth): login + verify pages + middleware guards /teacher /api/*"
```

---

## 子任务 6 · progress events API + progress-storage 改 fetch

### 6.1 `web/app/api/progress/events/route.ts`

```ts
import { auth } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { progressEvents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ events: [] }, { status: 401 });

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

  const body = await req.json();
  const event = await db
    .insert(progressEvents)
    .values({
      studentId: session.user.id,
      type: body.type,
      lessonId: body.lessonId ?? null,
      refId: body.refId ?? null,
      payload: body.payload ?? {},
    })
    .returning();
  return NextResponse.json({ event: event[0] });
}
```

### 6.2 `web/lib/progress-storage.ts` 改双层（API + localStorage offline 缓存）

把现有 markProgress / toggleProgressList / setSelfAssessment 改成：

1. **立即** 调 `fetch("/api/progress/events", { method: "POST", body: {...} })`
2. **同时** 写 localStorage（offline cache）
3. **加载** loadProgress 时：优先 fetch `/api/progress/events`，network 失败 fallback localStorage

> 注意：`progress-storage.ts` 之前是同步 API，改成 async 后所有 caller 都要 `await` 或处理 Promise。
> 用 grep 找出所有 `markProgress(...)` / `toggleProgressList(...)` / `setSelfAssessment(...)` 调用点（约 8-10 处），逐个加 async/await。

### 6.3 commit

```bash
git add -A
git commit -m "feat(progress): events API + dual storage (DB + localStorage offline cache)"
```

---

## 子任务 7 · 录音 metadata API + RecordingPanel 接入

### 7.1 `web/app/api/recordings/route.ts`

```ts
import { auth } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { recordings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

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
  const rec = await db
    .insert(recordings)
    .values({
      studentId: session.user.id,
      lessonId: body.lessonId,
      practiceType: body.practiceType,
      promptText: body.promptText,
      targetJapanese: body.targetJapanese,
      mimeType: body.mimeType ?? "audio/webm",
      durationSec: body.durationSec ?? 0,
      sizeBytes: body.sizeBytes ?? 0,
      selfAssessment: body.selfAssessment ?? null,
      status: "ready",
      // storageKey 字段 Phase 6 才填
    })
    .returning();
  return NextResponse.json({ recording: rec[0] });
}
```

### 7.2 `components/audio/RecordingPanel.tsx` saveCurrentRecording 改

录音保存时**同步**：

1. 写 IndexedDB（保留作为本地播放）
2. POST `/api/recordings` 落 metadata 到 DB
3. metadata response 里的 `recording.id`（UUID）跟 IndexedDB 里的 id 关联（IndexedDB 的 id 改用 UUID）

```ts
async function saveCurrentRecording(blobOverride, urlOverride) {
  const activeBlob = blobOverride ?? blob;
  if (!activeBlob) { setError("还没有可保存的录音。"); return; }

  // 1. POST metadata 到 DB 拿 UUID
  const res = await fetch("/api/recordings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lessonId,
      practiceType,
      promptText,
      targetJapanese,
      mimeType: activeBlob.type,
      durationSec,
      sizeBytes: activeBlob.size,
      selfAssessment: fallbackAssessment,
    }),
  });
  if (!res.ok) {
    setError("录音保存到服务器失败。本地仍有备份。");
  }
  const { recording: serverRec } = await res.json().catch(() => ({}));
  const id = serverRec?.id ?? `local-${Date.now()}`;

  // 2. 写 IndexedDB（用 server id）
  const recording: RecordingAttempt = {
    id,
    userId: "current-student",  // 留 Phase 5 之后再清；其实 IndexedDB 不再需要 userId
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
  markProgress("completedRecordings", id);
  if (markAsAssignment) markProgress("completedAssignments", `${lessonId}-${practiceType}`);
  onSaved?.(recording);
}
```

### 7.3 commit

```bash
git add -A
git commit -m "feat(recordings): metadata API + RecordingPanel POSTs to DB on save"
```

---

## 子任务 8 · content-loader 改 DB-backed

把 `lib/content-loader.ts` 从 `import lessons from "@/data/lessons.json"` 改成
server-side 异步 DB 查询。

### 8.1 新文件 `web/lib/content/lessons.ts`

```ts
import { db } from "@/lib/db";
import { lessons, lessonAssets, phrases, shadowingItems, roleplays, assignments } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getAllLessons() {
  return db.select().from(lessons).orderBy(asc(lessons.order));
}

export async function getLessonById(id: string) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
  if (!lesson) return null;
  const [assets, ph, shadow, rp, ass] = await Promise.all([
    db.select().from(lessonAssets).where(eq(lessonAssets.lessonId, id)),
    db.select().from(phrases).where(eq(phrases.lessonId, id)),
    db.select().from(shadowingItems).where(eq(shadowingItems.lessonId, id)),
    db.select().from(roleplays).where(eq(roleplays.lessonId, id)),
    db.select().from(assignments).where(eq(assignments.lessonId, id)),
  ]);
  return { ...lesson, assets, phrases: ph, shadowingItems: shadow, rolePlays: rp, assignments: ass };
}
```

### 8.2 改 `lib/content-loader.ts`

保留 `allLessons` / `allGlossary` 等同步 export（基于 JSON 当 fallback），但**新代码** 鼓励用
`getAllLessons() / getLessonById()` 异步 API。Server component 用 async 调它。

### 8.3 改 server pages 用 DB API

- `app/page.tsx`（server）
- `app/courses/page.tsx`（server）
- `app/courses/lessons/[lessonId]/page.tsx`（server）
- `app/teacher/page.tsx`（server）
- `app/library/page.tsx`（client，可以保留 JSON 作 fallback；或改为 server fetch + 传 props）

### 8.4 commit

```bash
git add -A
git commit -m "feat(content): db-backed content loader for server components"
```

---

## 子任务 9 · 数据按需拆分修 First Load JS 工程债

Phase 4 留下：`/library` First Load JS 1.15 MB / 多数据页 1.05 MB。

### 9.1 改 `/library` 为 server-side fetch

`app/library/page.tsx` 改成 server component（不用 client 状态），server 端 fetch
`getLibraryItems()`，把 markdown 仅在用户点击时通过新 API endpoint
`/api/library/[kind]` 拿单条。

### 9.2 改 lesson 详情页 markdown 按需 load

`LessonAssetsTabs.tsx` 改成 click tab 时才 fetch `/api/lessons/[id]/assets/[kind]`
取该 asset 的 markdown，不再 client bundle 全量 markdown。

### 9.3 验收：next build 后 First Load JS 应 < 500 KB / 页

```bash
npm run build
# 看 build output 的 First Load JS 列
```

### 9.4 commit

```bash
git add -A
git commit -m "perf(data): lazy-load lesson assets and library items to slim first-load JS"
```

---

## 子任务 10 · _meta.json + 终检 + handoff

### 10.1 `data/_meta.json` 升级到 1.2.0

```json
{
  "schemaVersion": "1.2.0",
  "generatedAt": "...",
  "sourceCommit": "...",
  "stats": { ... },
  "audio": { ... },
  "backend": {
    "auth": "next-auth@5",
    "database": "neon postgres",
    "email": "resend",
    "tables": 19
  },
  "notes": [...]
}
```

### 10.2 终检

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run typecheck
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000 &
sleep 5
# 手测：
#   未登录访问 /dashboard → 跳 /login
#   邮箱注册 → 收 magic link → 点击 → 跳 /dashboard
#   做 1 条 shadowing → DB 里 progress_events 有事件
#   做 1 条录音 → DB 里 recordings 有 metadata 行（status=ready, storageKey=null）
#   讲师 role 访问 /teacher 通过；学生 role 访问 /teacher 跳 /
#   First Load JS < 500 KB（next build 报）
kill %1
```

### 10.3 handoff

`projects/4-sap-training/inbox/handoff-phase-5-{YYYYMMDD}.md`：

```markdown
# Phase 5 Handoff · YYYY-MM-DD

## Commits（10 个）
- <h1> build(deps): add auth.js v5 drizzle pg resend
- <h2> feat(db): drizzle schema 19 tables + first migration
- <h3> feat(db): seed script + initial 24 lessons
- <h4> feat(auth): nextauth v5 magic link via resend
- <h5> feat(auth): login + verify + middleware guards
- <h6> feat(progress): events API + dual storage
- <h7> feat(recordings): metadata API + RecordingPanel
- <h8> feat(content): db-backed content loader
- <h9> perf(data): lazy-load lesson assets and library
- <h10> chore(state): record Phase 5 completion + meta 1.2.0

## DB 灌入数据
- lessons: 24 / phrases: 480 / shadowing: 480 / roleplays: 48
- lesson_assets: 240 / glossary_terms: 528 / library_items: 6

## First Load JS（before vs after）
- /library: 1.15 MB → <X KB>
- /dashboard: 1.05 MB → <X KB>
- /courses/lessons/[id]: 214 KB → <X KB>
- 全部页 < 500 KB

## 浏览器手测
- 注册-登录-看 dashboard：PASS
- 学生 A 录音 → 学生 B 看不到：PASS
- /teacher 路由守卫：PASS

## 遗留
- 录音 blob 仍存 IndexedDB，等 Phase 6 上 S3
- 讲师查看学生录音 UI 仍占位，Phase 6 真实接入
- substitutionDrills 仍 0

## 下一步
等 Claude 验收。Phase 6 接 R2 + 讲师反馈端到端。
```

### 10.4 commit

```bash
git add -A
git commit -m "chore(state): record Phase 5 completion + meta schema 1.2.0"
```

---

## 严禁

1. 不许把 .env.local 提交进 git
2. 不许编造任何日语句子
3. 不许改 Phase 1-4 的数据 schema（types/lesson.ts 字段不动）
4. 不许接 S3 / R2（Phase 6）
5. 不许跳过任何 API 的 `auth()` session 检查
6. 不许在 API 的 SQL 里漏 `where studentId = $session.userId`（学生隔离硬底线）
7. 不许把 Drizzle migrations 文件夹删掉重建（每次 generate 是增量）
8. 不许自动 promote 用户 role 为 teacher / admin（Ryan 用 SQL 手工 promote）
9. 不许自动接 Phase 6

## 阻塞时停手

- .env.local 缺凭据
- drizzle:migrate 失败
- seed 跑出来 counts 不达预期
- typecheck / build 失败原因看不出
- middleware 守卫不生效（未登录访问 /dashboard 没跳 /login）
- 学生 A 能看到学生 B 的录音 / progress events（违反隔离）

inbox/need-input-phase5-{YYYYMMDD}-{topic}.md 写 ask 停手。

---

## 任务结束

完成 10 个子任务、跑通验证、写交接、停手等 Claude 验收。
