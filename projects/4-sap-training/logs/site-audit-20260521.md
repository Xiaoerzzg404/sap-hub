# sap-jp.training Local Site Audit · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-21T22:43:52+09:00
- cwd: `/Users/openclawxiaoer/sap-hub`
- app: `projects/4-sap-training/web`
- local target: `http://127.0.0.1:3210`
- smoke method: Node `fetch` with `redirect: "manual"` against local dev server
- screenshots: not captured; browser evidence is the Node fetch status/location evidence below

## Scope

Allowed write scope was limited to:

- `projects/4-sap-training/web`
- `projects/4-sap-training/logs`
- `projects/4-sap-training/state`
- `projects/4-sap-training/inbox`

No `systems/` files were read or modified. No real external publish, R2 deletion, DB reset, real mailbox takeover, or microphone E2E run was performed.

## Startup Reads

- Read `AGENTS.md`.
- Read `projects/4-sap-training/_instructions.md`.
- Read `projects/4-sap-training/state/sap_jp_training_course.json`.
- Read latest available handoff: `projects/4-sap-training/inbox/handoff-phase-7-20260521.md`.

## Baseline

| Check | Result | Notes |
|---|---:|---|
| `git status --short` | PASS | At task start, existing dirty files were outside the requested audit scope; they were not touched or staged. |
| `npm run typecheck` | PASS | Initial baseline passed before edits. |
| `npm run lint` | PASS with 8 warnings | Warnings in recording refresh hooks, `lib/db/index.ts`, and unused conversion script code. |
| `npm run build` | PASS with warnings | Known Sentry setup warnings and pg SSL-mode warning; build completed. |

## Small Fixes Applied

| Area | File | Fix |
|---|---|---|
| Student recording history | `web/components/audio/RecordingHistory.tsx` | Wrapped `refresh` in `useCallback` and made `useEffect` depend on the stable callback. |
| Teacher recording detail | `web/components/teacher/TeacherRecordingDetailClient.tsx` | Wrapped `refresh` in `useCallback` and made `useEffect` depend on the stable callback. |
| Teacher recordings list | `web/components/teacher/TeacherRecordingsClient.tsx` | Wrapped `refresh` in `useCallback` and made `useEffect` depend on the stable callback. |
| DB pool singleton | `web/lib/db/index.ts` | Removed stale `eslint-disable` directive. |
| Content conversion script | `web/scripts/convert-content.mjs` | Removed unused legacy helpers/constants causing lint warnings. |

During rerun and post-commit validation, the current working tree also contained a separate, unstaged `japanese-coach` / self-training scaffold. That scaffold includes `web/data/japanese-coach.json`, `web/lib/japanese-coach.ts`, `web/types/japanese-coach.ts`, `web/components/lesson/JapaneseCoachPanel.tsx`, `web/components/pages/JapaneseSelfTrainingClient.tsx`, `web/app/speaking/self-training/`, and related page/nav edits. It was treated as concurrent work outside this audit commit and was not staged into the audit handoff.

## Verification After Fixes

| Check | Result | Notes |
|---|---:|---|
| `npm run typecheck` | PASS | Passed in the current worktree after local compatibility handling for the unstaged japanese-coach scaffold. |
| `npm run lint` | PASS | 0 errors, 0 warnings. |
| `npm run build` | PASS with warnings | Same non-blocking Sentry setup warnings, Upstash Edge-runtime warning, and pg SSL-mode warning class as baseline/Phase 7. |
| Dev server | PASS | `npm run dev -- --hostname 127.0.0.1 --port 3210`. |
| Dev cache recovery | PASS | After build/dev mixed run produced a transient `/` 500 from Next RSC manifest state, stopped dev, removed generated `.next`, restarted dev, and retested successfully. |

## Page Matrix · Logged Out

Expected: public pages return `200`; protected pages return `307` to `/login?callbackUrl=...`.

| Path | Expected | Actual | Evidence |
|---|---:|---:|---|
| `/` | 200 | 200 | title `SAP 日本项目实战日语口语训练平台` |
| `/login` | 200 | 200 | title `SAP 日本项目实战日语口语训练平台` |
| `/privacy` | 200 | 200 | title `SAP 日本项目实战日语口语训练平台` |
| `/dashboard` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fdashboard` |
| `/courses` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fcourses` |
| `/courses/lessons/lesson_01` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fcourses%2Flessons%2Flesson_01` |
| `/speaking` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking` |
| `/speaking/recording` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking%2Frecording` |
| `/speaking/shadowing` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking%2Fshadowing` |
| `/speaking/repeat-player` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking%2Frepeat-player` |
| `/speaking/micro-training` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking%2Fmicro-training` |
| `/speaking/consultant-output` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking%2Fconsultant-output` |
| `/roleplay` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Froleplay` |
| `/assignments` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fassignments` |
| `/review` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Freview` |
| `/teacher` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fteacher` |
| `/teacher/recordings` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fteacher%2Frecordings` |
| `/teacher/recordings/[id]` | 307 | 307 | tested as `/teacher/recordings/test-id`; `http://localhost:3210/login?callbackUrl=%2Fteacher%2Frecordings%2Ftest-id` |
| `/teacher/review-terms` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fteacher%2Freview-terms` |

## API Matrix · Logged Out

| Endpoint | Expected | Actual | Body |
|---|---:|---:|---|
| `/api/recordings` | 401 | 401 | `{"error":"unauthorized"}` |
| `/api/teacher/recordings` | 401 | 401 | `{"error":"unauthorized"}` |
| `/api/progress/events` | 401 | 401 | `{"error":"unauthorized"}` |

## Function Matrix

| Function | Status | Reason / Evidence |
|---|---|---|
| Public page render | PASS | `/`, `/login`, `/privacy` returned 200. |
| Logged-out protected routing | PASS | All protected pages returned 307 with callback URL. |
| Logged-out API auth boundary | PASS | Target APIs returned 401. |
| Lint-warning cleanup | PASS | `npm run lint` now returns 0 warnings. |
| Student recording local flow | NOT TESTED | Requires authenticated student session and media/fake-media browser run. |
| Cloud recording sign → PUT → PATCH → list | NOT TESTED | Requires authenticated student session and permission to use test R2 path. |
| Teacher recordings list/detail/playback/feedback | NOT TESTED | Requires authenticated teacher session and seeded/enrolled student recording. |
| Student `/review` feedback display | NOT TESTED | Requires authenticated student session with teacher feedback. |
| Cross-user / class-scoped RBAC | NOT TESTED | Requires test student + teacher accounts and authorization to create/read login tokens or use provided sessions. |

## Blocker / Need Input

Authenticated E2E was intentionally stopped because there is no available test student/teacher session in this local audit, and the task forbids guessing or taking over real login flows.

Need input file written:

- `projects/4-sap-training/inbox/need-input-site-audit-20260521.md`

## Residual Warnings

- `npm run build` still prints Sentry setup warnings for missing `onRequestError`, missing global error handler, and client config rename guidance.
- `npm run build` still prints the known Upstash Edge-runtime warning from `@upstash/redis/nodejs.mjs`.
- `npm run build` still prints pg SSL-mode deprecation/security warning.
- These warnings were already in the Phase 7 warning class and were not expanded into a Sentry/DB configuration task in this audit.
