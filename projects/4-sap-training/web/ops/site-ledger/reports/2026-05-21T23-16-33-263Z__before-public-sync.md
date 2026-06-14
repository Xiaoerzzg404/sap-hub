# sap-jp.training 站点 Ledger 快照

- schemaVersion: 1.0.0
- siteId: sap-jp.training-local
- generated_at: 2026-05-22T08:16:33+09:00
- label: before-public-sync
- branch: codex/sap-jp-content-audit-20260521
- commit: d0440b1
- restore_safe: false
- note: (无)

## 本快照记录什么

- `data/` 下内容数据的 hash 与数量。
- page、API、component、script、library、docs、Project 4 course-source 的文件 hash。
- 路由清单、预期访问边界和 middleware 覆盖情况。
- Package scripts 和 dependency names。
- Git 脏状态，让恢复风险保持显性。

## 数据摘要

- data/\_meta.json: schemaVersion=1.4.0, stats={"tracks":1,"lessons":24,"phrases":480,"shadowing":480,"roleplays":48,"glossaryTerms":583,"libraryItems":6,"totalAssets":240,"japaneseCoachEntries":24}
- data/assignments.json: array count=96
- data/glossary.json: array count=583
- data/japanese-coach.json: lessonEntries=24
- data/lessons.json: array count=24
- data/library.json: array count=6
- data/phrases.json: array count=480
- data/review-terms.json: array count=127
- data/roleplays.json: array count=48
- data/tracks.json: array count=1

## 架构数量

```json
{
  "fileCounts": {
    "course-output": 358,
    "course-prompt": 30,
    "course-source": 227,
    "page": 28,
    "api-route": 11,
    "app-support": 3,
    "layout": 1,
    "component": 60,
    "runtime-data": 11,
    "docs": 5,
    "config": 14,
    "library-code": 19,
    "db-migration": 9,
    "public-asset": 5,
    "script": 4,
    "type": 11
  },
  "routeCounts": {
    "layout": 1,
    "page": 28,
    "api": 11
  },
  "trackedRoots": [
    "app",
    "components",
    "data",
    "docs",
    "lib",
    "public",
    "scripts",
    "types",
    "../SAP日语培训/output",
    "../sap_jp_training_course/output",
    "../sap_jp_training_course/prompts_v4"
  ],
  "trackedRootFiles": [
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "middleware.ts",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.js",
    "eslint.config.mjs",
    "drizzle.config.ts",
    "vercel.json",
    "instrumentation.ts",
    "sentry.client.config.ts",
    "sentry.edge.config.ts",
    "sentry.server.config.ts"
  ]
}
```

## 健康状态

- WARNING protected_route_not_in_middleware: /admin 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- ERROR cron_route_not_in_middleware: /api/cron/cleanup-recordings 预期需要 CRON_SECRET，但未被 middleware 覆盖。
- WARNING protected_route_not_in_middleware: /assignments 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /courses 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /courses/lessons/[lessonId] 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /dashboard 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /glossary 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /library 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /me 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /phrasebook 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /review 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /roleplay 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /speaking 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /speaking/consultant-output 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /speaking/micro-training 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /speaking/recording 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /speaking/repeat-player 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /speaking/self-training 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /speaking/shadowing 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /teacher 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /teacher/recordings 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /teacher/recordings/[id] 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING protected_route_not_in_middleware: /teacher/review-terms 预期受保护，但未被 middleware 覆盖，也未检测到 server guard 标记。
- WARNING working_tree_dirty: 工作区有 44 个未提交路径；该 snapshot 只能用于观察，不能作为干净恢复锚点。

## 脏工作区

- M AGENTS.md
- M logs/content-source-report.md
- M logs/phase7-rbac-audit.md
- M projects/4-sap-training/AGENT_GUARDRAILS.md
- M projects/4-sap-training/inbox/handoff-admin-ops-dashboard-20260521.md
- M projects/4-sap-training/inbox/handoff-agent-guardrails-20260521.md
- M projects/4-sap-training/inbox/handoff-auth-credentials-roles-20260522.md
- M projects/4-sap-training/inbox/handoff-phase-7-20260521.md
- M projects/4-sap-training/inbox/handoff-sap-project-japanese-content-audit-20260521.md
- M projects/4-sap-training/inbox/handoff-site-audit-20260521.md
- M projects/4-sap-training/inbox/handoff-site-ledger-20260521.md
- M projects/4-sap-training/inbox/handoff-student-japanese-self-training-20260521.md
- M projects/4-sap-training/inbox/handoff-student-learning-home-20260521.md
- M projects/4-sap-training/inbox/need-input-site-audit-20260521.md
- M projects/4-sap-training/logs/site-audit-20260521.md
- M projects/4-sap-training/sap_jp_training_course/output/lesson_02_v4_teacher_focused/01_teacher_core/01_teacher_full_script_slide_by_slide.md
- M projects/4-sap-training/sap_jp_training_course/output/lesson_03_v4_teacher_focused/01_teacher_core/01_teacher_full_script_slide_by_slide.md
- M projects/4-sap-training/sap_jp_training_course/output/lesson_21_v4_teacher_focused/01_teacher_core/01_teacher_full_script_slide_by_slide.md
- M projects/4-sap-training/state/sap_jp_training_course.json
- M projects/4-sap-training/web/components/lesson/TermCard.tsx
- M projects/4-sap-training/web/data/\_meta.json
- M projects/4-sap-training/web/data/lessons.json
- M projects/4-sap-training/web/data/phrases.json
- M projects/4-sap-training/web/docs/ADMIN_OPS.md
- M projects/4-sap-training/web/docs/SITE_ARCHITECTURE.md
- M projects/4-sap-training/web/docs/SITE_CHANGE_LEDGER.md
- M projects/4-sap-training/web/ops/site-ledger/CHANGELOG.md
- M projects/4-sap-training/web/ops/site-ledger/README.md
- M projects/4-sap-training/web/ops/site-ledger/REBUILD_PLAN.md
- M projects/4-sap-training/web/ops/site-ledger/latest.json
- M projects/4-sap-training/web/ops/site-ledger/reports/2026-05-21T14-54-05-690Z\_\_initial-site-ledger.md
- M projects/4-sap-training/web/ops/site-ledger/reports/2026-05-21T14-58-19-480Z\_\_diff.md
- M projects/4-sap-training/web/ops/site-ledger/reports/2026-05-21T14-58-19-480Z\_\_post-verification-site-ledger.md
- M projects/4-sap-training/web/scripts/convert-content.mjs
- M projects/4-sap-training/web/scripts/generate-tts.mjs
- M projects/4-sap-training/web/scripts/site-ledger.mjs
- ?? projects/4-sap-training/inbox/handoff-doc-language-policy-20260522.md
- ?? projects/4-sap-training/inbox/handoff-tts-audio-recordings-20260521.md
- ?? projects/4-sap-training/inbox/need-input-tts-public-deploy-20260521.md
- ?? projects/4-sap-training/logs/tts-recording-report-20260521.md

## 相比上一个快照的变化

## 文件

- added: 11
- removed: 0
- changed: 51

### 新增

- projects/4-sap-training/web/app/api/auth/register/route.ts (api-route)
- projects/4-sap-training/web/app/login/LoginClient.tsx (app-support)
- projects/4-sap-training/web/app/post-login/page.tsx (page)
- projects/4-sap-training/web/components/auth/SignOutButton.tsx (component)
- projects/4-sap-training/web/lib/auth/guards.ts (library-code)
- projects/4-sap-training/web/lib/auth/identity.ts (library-code)
- projects/4-sap-training/web/lib/auth/password.ts (library-code)
- projects/4-sap-training/web/lib/auth/roles.ts (library-code)
- projects/4-sap-training/web/lib/db/migrations/0003_auth_credentials_multi_role.sql (db-migration)
- projects/4-sap-training/web/lib/db/migrations/meta/0003_snapshot.json (db-migration)
- projects/4-sap-training/web/types/auth.ts (type)

### 移除

- 无。

### 变更

- projects/4-sap-training/web/app/admin/page.tsx (page)
- projects/4-sap-training/web/app/api/lessons/[lessonId]/assets/[kind]/route.ts (api-route)
- projects/4-sap-training/web/app/api/library/[kind]/route.ts (api-route)
- projects/4-sap-training/web/app/api/progress/events/route.ts (api-route)
- projects/4-sap-training/web/app/api/recordings/[id]/route.ts (api-route)
- projects/4-sap-training/web/app/api/recordings/route.ts (api-route)
- projects/4-sap-training/web/app/api/recordings/sign/route.ts (api-route)
- projects/4-sap-training/web/app/api/teacher/recordings/[id]/feedback/route.ts (api-route)
- projects/4-sap-training/web/app/api/teacher/recordings/route.ts (api-route)
- projects/4-sap-training/web/app/assignments/page.tsx (page)
- projects/4-sap-training/web/app/courses/lessons/[lessonId]/page.tsx (page)
- projects/4-sap-training/web/app/courses/page.tsx (page)
- projects/4-sap-training/web/app/dashboard/page.tsx (page)
- projects/4-sap-training/web/app/glossary/page.tsx (page)
- projects/4-sap-training/web/app/layout.tsx (layout)
- projects/4-sap-training/web/app/library/page.tsx (page)
- projects/4-sap-training/web/app/login/confirm/page.tsx (page)
- projects/4-sap-training/web/app/login/page.tsx (page)
- projects/4-sap-training/web/app/login/verify/page.tsx (page)
- projects/4-sap-training/web/app/me/page.tsx (page)
- projects/4-sap-training/web/app/page.tsx (page)
- projects/4-sap-training/web/app/phrasebook/page.tsx (page)
- projects/4-sap-training/web/app/privacy/page.tsx (page)
- projects/4-sap-training/web/app/review/page.tsx (page)
- projects/4-sap-training/web/app/roleplay/page.tsx (page)
- projects/4-sap-training/web/app/speaking/consultant-output/page.tsx (page)
- projects/4-sap-training/web/app/speaking/micro-training/page.tsx (page)
- projects/4-sap-training/web/app/speaking/page.tsx (page)
- projects/4-sap-training/web/app/speaking/recording/page.tsx (page)
- projects/4-sap-training/web/app/speaking/repeat-player/page.tsx (page)
- projects/4-sap-training/web/app/speaking/self-training/page.tsx (page)
- projects/4-sap-training/web/app/speaking/shadowing/page.tsx (page)
- projects/4-sap-training/web/app/teacher/page.tsx (page)
- projects/4-sap-training/web/app/teacher/recordings/[id]/page.tsx (page)
- projects/4-sap-training/web/app/teacher/recordings/page.tsx (page)
- projects/4-sap-training/web/app/teacher/review-terms/page.tsx (page)
- projects/4-sap-training/web/components/layout/Header.tsx (component)
- projects/4-sap-training/web/components/layout/MobileNav.tsx (component)
- projects/4-sap-training/web/components/layout/Sidebar.tsx (component)
- projects/4-sap-training/web/docs/ADMIN_OPS.md (docs)
- projects/4-sap-training/web/docs/SITE_ARCHITECTURE.md (docs)
- projects/4-sap-training/web/docs/SITE_CHANGE_LEDGER.md (docs)
- projects/4-sap-training/web/docs/STUDENT_GUIDE.md (docs)
- projects/4-sap-training/web/docs/TEACHER_GUIDE.md (docs)
- projects/4-sap-training/web/lib/admin/ops-dashboard.ts (library-code)
- projects/4-sap-training/web/lib/auth/options.ts (library-code)
- projects/4-sap-training/web/lib/db/migrations/meta/\_journal.json (db-migration)
- projects/4-sap-training/web/lib/db/schema.ts (library-code)
- projects/4-sap-training/web/middleware.ts (config)
- projects/4-sap-training/web/scripts/site-ledger.mjs (script)
- projects/4-sap-training/web/types/next-auth.d.ts (type)

## 路由

- 新增 /api/auth/register -> projects/4-sap-training/web/app/api/auth/register/route.ts
- 新增 /post-login -> projects/4-sap-training/web/app/post-login/page.tsx
- 变更 / -> public
- 变更 /admin -> uncovered_expected_protected
- 变更 /api/cron/cleanup-recordings -> cron_uncovered
- 变更 /api/lessons/[lessonId]/assets/[kind] -> server_guarded
- 变更 /api/library/[kind] -> server_guarded
- 变更 /api/progress/events -> server_guarded
- 变更 /api/recordings -> server_guarded
- 变更 /api/recordings/[id] -> server_guarded
- 变更 /api/recordings/sign -> server_guarded
- 变更 /api/teacher/recordings -> server_guarded
- 变更 /api/teacher/recordings/[id]/feedback -> server_guarded
- 变更 /assignments -> uncovered_expected_protected
- 变更 /courses -> uncovered_expected_protected
- 变更 /courses/lessons/[lessonId] -> uncovered_expected_protected
- 变更 /dashboard -> uncovered_expected_protected
- 变更 /glossary -> uncovered_expected_protected
- 变更 /library -> uncovered_expected_protected
- 变更 /login -> public
- 变更 /login/confirm -> public
- 变更 /login/verify -> public
- 变更 /me -> uncovered_expected_protected
- 变更 /phrasebook -> uncovered_expected_protected
- 变更 /privacy -> public
- 变更 /review -> uncovered_expected_protected
- 变更 /roleplay -> uncovered_expected_protected
- 变更 /speaking -> uncovered_expected_protected
- 变更 /speaking/consultant-output -> uncovered_expected_protected
- 变更 /speaking/micro-training -> uncovered_expected_protected
- 变更 /speaking/recording -> uncovered_expected_protected
- 变更 /speaking/repeat-player -> uncovered_expected_protected
- 变更 /speaking/self-training -> uncovered_expected_protected
- 变更 /speaking/shadowing -> uncovered_expected_protected
- 变更 /teacher -> uncovered_expected_protected
- 变更 /teacher/recordings -> uncovered_expected_protected
- 变更 /teacher/recordings/[id] -> uncovered_expected_protected
- 变更 /teacher/review-terms -> uncovered_expected_protected

## 数据数量

- 数据数量无变化。

## AI 快速上下文

- 最新机器可读 snapshot：`projects/4-sap-training/web/ops/site-ledger/latest.json`
- 历史 snapshots：`projects/4-sap-training/web/ops/site-ledger/snapshots/`
- 人类可读报告：`projects/4-sap-training/web/ops/site-ledger/reports/`
- 恢复指南：运行 `npm run ledger:rebuild-plan`
