# Handoff · Student Learning Home + Site Architecture · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-21T23:28:00+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: `/me` student page, local notes, navigation, revision/deploy architecture, Sentry build safety

## Completed

- Added `/me` as the student learning home.
- Added `MyLearningClient` to summarize:
  - current lesson and current five-step position;
  - 24-lesson progress;
  - started lessons;
  - lesson notes;
  - recording count;
  - teacher feedback count and latest feedback snippets;
  - full recording history through the existing `RecordingHistory` component.
- Added local browser lesson notes storage in `lib/lesson-notes-storage.ts`.
- Added `LessonNotesPanel` for per-lesson note create/update/delete.
- Added `/me` links in header, sidebar, mobile navigation, and dashboard.
- Added `docs/SITE_ARCHITECTURE.md` to define product architecture, data boundaries, content revision workflow, versioning, and local-before-deploy discipline.
- Updated `STUDENT_GUIDE.md` and `ADMIN_OPS.md` for `/me` and revision/deploy workflow.
- Updated `_meta.json` notes to record the `/me` learning home and architecture doc.
- Changed `next.config.ts` so `withSentryConfig` is only enabled with `SENTRY_BUILD_PLUGIN_ENABLED=true`; Sentry runtime initialization still reads `NEXT_PUBLIC_SENTRY_DSN`.
- Recorded the user's short/mid/long roadmap in memory update note:
  `/Users/openclawxiaoer/.codex/memories/extensions/ad_hoc/notes/2026-05-21T23-12-00-sap-jp-training-roadmap.md`.

## Verification

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS after Sentry build-plugin gating.
- Browser dev server: `http://127.0.0.1:3210`.
- Browser smoke on `/me`: PASS.
  - confirmed page renders `我的学习`;
  - confirmed `24 课进度`;
  - confirmed `我的笔记`;
  - confirmed `老师反馈`;
  - confirmed `历史录音`.
- Browser smoke note save/clear: PASS.

## Warnings / Residual Risk

- Browser console still shows the existing Postgres SSL-mode deprecation warning from `pg-connection-string` / `pg`; not caused by this change.
- Build still reports known Sentry/OpenTelemetry and Upstash Edge-runtime warnings, but build exits 0.
- Student notes are local to the browser in this beta implementation. If beta students need cross-device notes, add a DB-backed `student_notes` table and `/api/notes`.
- Authenticated student/teacher E2E remains blocked until test student/teacher accounts or local token-read permission are available.

## Next Action

Review `/me` with one authenticated student account, then decide whether beta notes should stay browser-local or move to cloud sync before inviting the first 5-10 students.
