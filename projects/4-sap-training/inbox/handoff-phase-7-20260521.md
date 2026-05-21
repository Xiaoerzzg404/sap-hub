# Phase 7 Handoff · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-21T12:25:00+09:00
- branch: codex/phase-7-launch
- scope: Phase 7「上线合规 + 内测扩盘准备」

## Commits

- `9c22fc3` fix(auth): magic link confirm intermediate page to defeat email scanners
- `f1696b5` fix(rbac): audit all API + teacher pages for session/role/student isolation
- `58d3d2e` feat(rate-limit): upstash redis sliding-window limits for login/upload/feedback (soft-dep)
- `589a0ca` feat(observability): sentry nextjs sdk for client/server/edge (soft-dep)
- `b5661af` feat(privacy): /privacy page + consent checkbox + recording disclosure
- `26e2dbb` feat(privacy): soft delete recordings + student delete API + 30d hard cleanup cron
- `0165d84` docs(ops): r2 lifecycle neon backup and capacity monitoring
- `1076d88` ci: github actions for typecheck/lint/build on PR + main push
- `c13e12d` chore: prettier + husky + lint-staged pre-commit hooks
- `030692f` docs: STUDENT_GUIDE + TEACHER_GUIDE + ADMIN_OPS
- `eb9843d` chore(state): record Phase 7 launch readiness + meta schema 1.4.0
- `212016a` fix(cron): add cleanup schedule and refresh Phase 7 env status
- `67097a2` fix(rate-limit): include auth signin in middleware matcher

## Credential Status

Local `.env.local` existence checks only; no secret values logged.

| Env var | Local status | Production action |
|---|---|---|
| `CRON_SECRET` | present | Confirm same key exists in Vercel env before relying on cron |
| `NEXT_PUBLIC_SENTRY_DSN` | present | Confirm Vercel env and Sentry project events |
| `UPSTASH_REDIS_REST_URL` | present | Confirm Vercel env |
| `UPSTASH_REDIS_REST_TOKEN` | present | Confirm Vercel env |

## Implementation Summary

- Magic-link email now points to `/login/confirm?token=...&email=...&callbackUrl=...`; only the user's confirm-button click navigates to the Auth.js callback.
- RBAC audit evidence written to `logs/phase7-rbac-audit.md`.
- Upstash rate limits added for auth signin, recording upload signing, and teacher feedback.
- Sentry Next.js SDK config added for client/server/edge.
- `/privacy` page added; `/login` requires privacy consent before sending magic link; recording panel shows upload/privacy disclosure.
- `recordings.deleted_at` added via migration `0002_jittery_spiral.sql` and migrated successfully to Neon.
- Student `DELETE /api/recordings/:id` soft-deletes own recordings; student/teacher recording GET APIs hide soft-deleted rows.
- `GET /api/cron/cleanup-recordings` hard-deletes 30-day-old soft-deleted recordings and R2 objects, protected by Bearer `CRON_SECRET`.
- `web/vercel.json` schedules cleanup at UTC 03:00 daily.
- CI workflow added at `.github/workflows/ci.yml`; CI build uses JSON fallback when `DATABASE_URL` is the mock URL.
- Prettier, ESLint CLI, husky, and lint-staged configured in the web subproject.
- `_meta.json` upgraded to schema `1.4.0`; Project 4 state updated.

## Verification

- `npm run drizzle:generate`: PASS; generated `0002_jittery_spiral.sql`.
- `npm run drizzle:migrate`: PASS; migration applied successfully.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS with existing warnings only.
- `npm run build`: PASS with warnings.
- CI mock build: PASS with `CI=true DATABASE_URL=postgres://mock:mock@localhost:5432/mock AUTH_SECRET=... NEXTAUTH_URL=http://localhost:3000 npm run build`.
- Browser smoke on local dev:
  - `/privacy`: rendered; privacy text includes no-AI-training statement.
  - `/login`: send button disabled before privacy checkbox; enabled after checking.
  - `/login/confirm?token=test-token&email=test@example.com&callbackUrl=/dashboard`: rendered confirm page and showed target email.
- API smoke on local dev:
  - unauthenticated `/api/recordings`: 401.
  - unauthenticated `/api/cron/cleanup-recordings`: 401 because `CRON_SECRET` exists and Bearer header is required.
  - auth signin rate limit: no-CSRF POST smoke hit 429 after repeated attempts; no real magic-link email was sent by this test.

## Docs

- `projects/4-sap-training/web/docs/STUDENT_GUIDE.md`: 119 lines.
- `projects/4-sap-training/web/docs/TEACHER_GUIDE.md`: 131 lines.
- `projects/4-sap-training/web/docs/ADMIN_OPS.md`: 202 lines.

## Not Run / Needs Ryan

- Real Yahoo/Outlook mailbox registration was not run by Codex; requires a mailbox the user can inspect.
- Sentry test error was not triggered; confirm after Vercel env deployment.
- GitHub Actions online PASS was not triggered because Phase 7 rules prohibit Codex from pushing.
- Hard-delete cron was not executed with a valid Bearer token to avoid destructive cleanup during handoff.
- Authenticated student delete UI was not exercised end-to-end because Codex did not create or take over a real user session.

## Warnings / Residual Risk

- `npm run lint` reports existing warnings in `RecordingHistory`, teacher recording clients, `lib/db/index.ts`, and `scripts/convert-content.mjs`; no lint errors.
- `npm run build` reports Sentry setup warnings for missing `onRequestError` and global error handler, plus Sentry client config rename guidance.
- `npm run build` reports Upstash Edge-runtime warning from `@upstash/redis/nodejs.mjs`; runtime signin rate-limit smoke still returned 429 locally after matcher fix.
- Postgres driver prints an SSL-mode deprecation warning during build/migrate. No secret values are printed.
- Sentry increased shared First Load JS to roughly 173 kB; still below the Phase 5 500 kB ceiling.

## Stop Point

Phase 7 implementation and local verification are complete. Stop here for Ryan / Claude validation. Do not merge main, delete branch, push, or start any Phase 8 work.
