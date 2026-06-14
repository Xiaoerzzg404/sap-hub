# sap-jp.training 站点 Ledger 快照

- schemaVersion: 1.0.0
- siteId: sap-jp.training-local
- generated_at: 2026-05-22T08:52:49+09:00
- label: before-public-sync
- branch: codex/sap-jp-content-audit-20260521
- commit: 5654676
- restore_safe: true
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
    "library-code": 20,
    "db-migration": 9,
    "public-asset": 5,
    "script": 5,
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

- INFO ledger_check_passed: 未发现 ledger 健康错误或警告。

## 脏工作区

- 干净。

## 相比上一个快照的变化

## 文件

- added: 2
- removed: 0
- changed: 11

### 新增

- projects/4-sap-training/web/lib/course-audio.ts (library-code)
- projects/4-sap-training/web/scripts/upload-course-audio-r2.mjs (script)

### 移除

- 无。

### 变更

- projects/4-sap-training/web/app/api/auth/register/route.ts (api-route)
- projects/4-sap-training/web/app/login/LoginClient.tsx (app-support)
- projects/4-sap-training/web/components/audio/ABRepeatPlayer.tsx (component)
- projects/4-sap-training/web/components/audio/AudioPlayer.tsx (component)
- projects/4-sap-training/web/docs/ADMIN_OPS.md (docs)
- projects/4-sap-training/web/docs/SITE_ARCHITECTURE.md (docs)
- projects/4-sap-training/web/docs/STUDENT_GUIDE.md (docs)
- projects/4-sap-training/web/docs/TEACHER_GUIDE.md (docs)
- projects/4-sap-training/web/lib/admin/ops-dashboard.ts (library-code)
- projects/4-sap-training/web/package.json (config)
- projects/4-sap-training/web/public/audio/audio-manifest.json (public-asset)

## 路由

- 变更 /api/auth/register -> public_auth

## 数据数量

- 数据数量无变化。

## AI 快速上下文

- 最新机器可读 snapshot：`projects/4-sap-training/web/ops/site-ledger/latest.json`
- 历史 snapshots：`projects/4-sap-training/web/ops/site-ledger/snapshots/`
- 人类可读报告：`projects/4-sap-training/web/ops/site-ledger/reports/`
- 恢复指南：运行 `npm run ledger:rebuild-plan`
