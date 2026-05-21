# Handoff · sap-jp.training Local Site Audit · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-21T22:43:52+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: local site audit + small lint/recording refresh cleanup

## Completed

- Read AGENTS.md, Project 4 instructions, state, and latest handoff.
- Ran baseline:
  - `git status --short`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Started local dev server on `http://127.0.0.1:3210`.
- Ran logged-out smoke for all requested pages.
- Ran logged-out API smoke for `/api/recordings`, `/api/teacher/recordings`, `/api/progress/events`.
- Fixed confirmed lint warnings in recording refresh hooks, teacher recording refresh hooks, stale eslint-disable, and unused conversion-script helpers.
- Re-ran `npm run typecheck`, `npm run lint`, and `npm run build`.
- Wrote audit log: `projects/4-sap-training/logs/site-audit-20260521.md`.
- Wrote need-input: `projects/4-sap-training/inbox/need-input-site-audit-20260521.md`.

## Verification Summary

- `npm run typecheck`: PASS.
- `npm run lint`: PASS, 0 warnings.
- `npm run build`: PASS with known Sentry/pg warnings.
- Public logged-out pages:
  - `/`, `/login`, `/privacy`: 200.
- Protected logged-out pages:
  - `/dashboard`, `/courses`, `/courses/lessons/lesson_01`, all requested `/speaking/*`, `/roleplay`, `/assignments`, `/review`, `/teacher`, `/teacher/recordings`, `/teacher/recordings/[id]`, `/teacher/review-terms`: 307 to login callback.
- Logged-out APIs:
  - `/api/recordings`: 401.
  - `/api/teacher/recordings`: 401.
  - `/api/progress/events`: 401.

## Not Run

Authenticated E2E was not run because no test student/teacher session was available and no permission was given to create users or read local magic-link tokens.

Blocked flows:

- Student recording lifecycle.
- Cloud recording sign/PUT/PATCH/list.
- Teacher recording review and feedback save.
- Student `/review` feedback display.
- Cross-user/class-scoped API RBAC.

## Notes

- A transient Next dev-server `/` 500 appeared after running `next build` while dev was active. It matched the known stale `.next`/RSC manifest class; stopping dev, clearing generated `.next`, and restarting dev restored `/` to 200.
- The current worktree contains a separate unstaged `japanese-coach` / self-training scaffold, including `web/data/japanese-coach.json`, `web/lib/japanese-coach.ts`, `web/types/japanese-coach.ts`, `web/components/lesson/JapaneseCoachPanel.tsx`, `web/components/pages/JapaneseSelfTrainingClient.tsx`, `web/app/speaking/self-training/`, and related page/nav edits. It was treated as concurrent work outside this audit commit.

## Next Action

Wait for user confirmation in `need-input-site-audit-20260521.md`; then run the authenticated student/teacher E2E matrix with explicitly provided test accounts and permissions.
