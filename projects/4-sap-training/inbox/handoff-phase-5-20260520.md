# Phase 5 Handoff · 2026-05-20

## Scope

执行 Phase 5「Auth + Postgres + 服务端基座」。

分支：`codex/phase-5-backend`

说明：Phase5 起手 grep 曾因 `phase-4 UX completion` 与实际 commit `Phase 4 UX completion` 大小写/连字符不一致误判阻塞；Ryan 已明确授权把 `0086a6d chore(state): record Phase 4 UX completion` 视为 Phase 4 完成证明后继续。

## Commits（10 个）

- `34b53a8` build(deps): add auth.js v5 drizzle pg resend for Phase 5
- `5388d56` feat(db): drizzle schema 19 tables + first migration applied to neon
- `edb1980` feat(db): seed script + initial 24 lessons content loaded into postgres
- `eadc850` feat(auth): nextauth v5 magic link via resend + drizzle adapter
- `b6bc70b` feat(auth): login + verify pages + middleware guards /teacher /api/*
- `3a5a224` feat(progress): events API + dual storage (DB + localStorage offline cache)
- `ea138e3` feat(recordings): metadata API + RecordingPanel POSTs to DB on save
- `e179c09` feat(content): db-backed content loader for server components
- `6fa8fbf` perf(data): lazy-load lesson assets and library items to slim first-load JS
- `77fd2cb` chore(state): record Phase 5 completion + meta schema 1.2.0

Additional record before Ryan authorization:

- `3de0f38` codex: 写入 phase-5 ask（git self-check 未命中）

## DB 灌入数据

- lessons: 24
- phrases: 480
- shadowing_items: 480
- roleplays: 48
- lesson_assets: 240
- glossary_terms: 528
- library_items: 6
- assignments: 96
- review_terms: 127

收尾复核时临时测试 users / recordings / progress_events 已清理，当前三者均为 0。

## First Load JS（before vs after）

- `/library`: 1.15 MB → 199 kB
- `/dashboard`: 1.06 MB → 110 kB
- `/glossary`: 1.05 MB → 104 kB
- `/phrasebook`: 1.06 MB → 110 kB
- `/roleplay`: 1.06 MB → 109 kB
- `/speaking/shadowing`: 1.06 MB → 111 kB
- `/courses/lessons/[lessonId]`: 214 kB → 215 kB
- 全部页面：< 500 kB

## Verification

Commands run from `projects/4-sap-training/web`:

```bash
npm run drizzle:generate
npm run drizzle:migrate
npm run seed-db
npm run typecheck
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Results:

- `drizzle:generate`: PASS, generated 19-table migration.
- `drizzle:migrate`: PASS, applied to Neon.
- `seed-db`: PASS, counts matched expected Phase 5 numbers.
- `typecheck`: PASS.
- `build`: PASS; only warnings were optional `pg-native` resolution and pg sslmode warning.

## Browser / API 手测

- 未登录访问 `/dashboard` → `/login?callbackUrl=%2Fdashboard`: PASS.
- 登录页提交 magic-link form → `/login/verify?provider=email&type=email`: PASS; `POST /api/auth/signin/email` returned 200 and Resend did not error.
- 未登录访问 `/api/progress/events`, `/api/recordings`, `/api/lessons/lesson_01/assets/course-design`: all 401.
- 临时 student session 访问 lazy content APIs:
  - lesson asset API: 200, markdown returned.
  - library item API: 200, markdown returned.
- 临时 Student A 写 progress event + recording metadata:
  - A GET progress_events: 1
  - B GET progress_events: 0
  - A GET recordings: 1
  - B GET recordings: 0
  - PASS: A/B 隔离成立。
- Student role 访问 `/teacher`: 307 → `/`, PASS.

## 遗留 / 风险

- Codex 无 Ryan 邮箱收件权限，因此未点击真实 magic link 完成最终 browser session 登录；已验证 Resend 发送请求成功并进入 verify page。
- 未自动创建或 promote teacher/admin；teacher 正向访问需要 Ryan 手动 SQL promote 后复测。
- 录音 blob 仍存 IndexedDB，DB 只保存 metadata；Phase 6 再接 R2/S3。
- 讲师查看学生录音 UI 仍是占位。
- `substitutionDrills` 仍为 0，沿用 Phase 4 之后的内容边界。

## 下一步

停手等 Ryan / Claude 验收。Phase 6 再接对象存储和讲师反馈端到端；本次不自动接 Phase 6、不合 main、不删分支。
