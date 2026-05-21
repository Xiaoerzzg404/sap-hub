# sap-jp.training Site Ledger Snapshot

- schemaVersion: 1.0.0
- siteId: sap-jp.training-local
- generated_at: 2026-05-21T23:54:05+09:00
- label: initial-site-ledger
- branch: codex/sap-jp-content-audit-20260521
- commit: 2ac1869
- restore_safe: false
- note: bootstrap sap-jp.training local site ledger and recovery index

## What This Captures

- Content data hashes and counts under `data/`.
- Page, API, component, script, library, docs, and Project 4 course-source file hashes.
- Route inventory with expected access and middleware coverage.
- Package scripts and dependency names.
- Git dirty state so restore risk is explicit.

## Data Summary

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

## Architecture Counts

```json
{
  "fileCounts": {
    "course-output": 358,
    "course-prompt": 30,
    "course-source": 227,
    "page": 27,
    "api-route": 10,
    "app-support": 2,
    "layout": 1,
    "component": 59,
    "runtime-data": 11,
    "docs": 5,
    "config": 14,
    "library-code": 15,
    "db-migration": 7,
    "public-asset": 5,
    "script": 4,
    "type": 10
  },
  "routeCounts": {
    "layout": 1,
    "page": 27,
    "api": 10
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

## Health

- WARNING working_tree_dirty: Working tree has 23 uncommitted path(s); snapshot is observational, not a clean restore anchor.

## Dirty Working Tree

- M logs/content-source-report.md
- M projects/4-sap-training/sap_jp_training_course/output/lesson_02_v4_teacher_focused/01_teacher_core/01_teacher_full_script_slide_by_slide.md
- M projects/4-sap-training/sap_jp_training_course/output/lesson_03_v4_teacher_focused/01_teacher_core/01_teacher_full_script_slide_by_slide.md
- M projects/4-sap-training/sap_jp_training_course/output/lesson_21_v4_teacher_focused/01_teacher_core/01_teacher_full_script_slide_by_slide.md
- M projects/4-sap-training/state/sap_jp_training_course.json
- M projects/4-sap-training/web/components/layout/MobileNav.tsx
- M projects/4-sap-training/web/components/layout/Sidebar.tsx
- M projects/4-sap-training/web/components/lesson/TermCard.tsx
- M projects/4-sap-training/web/data/\_meta.json
- M projects/4-sap-training/web/data/lessons.json
- M projects/4-sap-training/web/data/phrases.json
- M projects/4-sap-training/web/docs/ADMIN_OPS.md
- M projects/4-sap-training/web/docs/SITE_ARCHITECTURE.md
- M projects/4-sap-training/web/middleware.ts
- M projects/4-sap-training/web/package.json
- M projects/4-sap-training/web/scripts/generate-tts.mjs
- ?? projects/4-sap-training/web/app/admin/page.tsx
- ?? projects/4-sap-training/web/docs/SITE_CHANGE_LEDGER.md
- ?? projects/4-sap-training/web/lib/admin/ops-dashboard.ts
- ?? projects/4-sap-training/web/ops/site-ledger/README.md
- ?? projects/4-sap-training/web/ops/site-ledger/config.json
- ?? projects/4-sap-training/web/public/audio/audio-manifest.json
- ?? projects/4-sap-training/web/scripts/site-ledger.mjs

## Delta From Previous Snapshot

- No previous snapshot found.

## AI Quick Context

- Latest machine-readable snapshot: `projects/4-sap-training/web/ops/site-ledger/latest.json`
- Historical snapshots: `projects/4-sap-training/web/ops/site-ledger/snapshots/`
- Human reports: `projects/4-sap-training/web/ops/site-ledger/reports/`
- Restore guide: run `npm run ledger:rebuild-plan`
