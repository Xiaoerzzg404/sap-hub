# Project 4 Agent Guardrails

- updated_by: codex
- updated_at: 2026-05-21T23:13:53+09:00
- applies_to: any AI or human-assisted agent working on Project 4 SAP Japanese training content, course design, SAP project Japanese expressions, website structure, website functions, data, auth, recording, review, teacher tools, or operations.

## Prime Directive

Protect the user, students, data, history, and working product first. Improvement is valuable only when it does not damage existing learning content, working routes, authenticated flows, recording data, privacy guarantees, or project history.

Every task must be smaller than the safeguards around it. If the agent cannot prove the change is in scope, reversible, and verifiable, it must stop and write a need-input note.

## Mandatory Startup

Before any task, every agent must read, in order:

1. `/Users/openclawxiaoer/sap-hub/AGENTS.md`.
2. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/AGENT_GUARDRAILS.md`.
3. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/_instructions.md`.
4. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/state/sap_jp_training_course.json`.
5. The latest relevant file in `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/inbox/`.
6. For website work, the relevant docs under `projects/4-sap-training/web/docs/` and the target routes/components/API files.
7. For content work, the exact source files named by the user or by the current package; do not mix sibling course assets unless explicitly allowed.

After reading, the agent must state its write scope and stop point before editing. If the user supplied an exact phase package or prompt, that package becomes the governing contract unless it conflicts with safety rules.

## Stop Immediately

Stop and write `projects/4-sap-training/inbox/need-input-<topic>-<date>.md` when any of these appear:

- Target path, source boundary, phase boundary, credentials, test account, production environment, or strategy is unclear.
- A task requires DB reset, migration against real data, R2 deletion, cron cleanup, external email sending, deploy, push, payment, permission change, or irreversible data change.
- A test requires reading magic-link tokens, creating users, using real student/teacher accounts, recording real microphone audio, or touching real learner data without explicit permission.
- Current repo state conflicts with the task, tests fail for unrelated reasons, or a dirty worktree would force mixing unrelated changes.
- SAP facts, transaction codes, configuration paths, legal/privacy statements, or real company/person claims cannot be supported by current sources.

## Source Of Truth

Use this priority order when instructions conflict:

1. The user's newest explicit instruction, unless it asks for an unsafe or destructive action.
2. `AGENTS.md` and this guardrail file.
3. The current phase package, task prompt, or handoff.
4. Project state and inbox files.
5. Current repository code/data.
6. Local source materials and verified external official sources when explicitly allowed.

Never silently weaken a rule. If a self-check fails because wording and repo reality differ, surface the mismatch and ask.

## Scope Control

- Make the smallest change that solves the requested problem.
- Preserve existing data contracts, route names, JSON schema fields, component boundaries, and storage keys unless the task explicitly authorizes a migration.
- Prefer additive files, adapters, or guarded branches over replacing proven files.
- Do not refactor unrelated code while fixing content, and do not rewrite content while fixing code.
- In a dirty worktree, stage and commit only task-owned files. Never revert or overwrite changes you did not make.
- Do not edit `systems/`; interact through Project state and inbox only.

## Data, Privacy, And Auth

- Never print, commit, or log tokens, passwords, API keys, magic-link tokens, session cookies, R2 signed URLs, or private learner data.
- Authenticated APIs must isolate student data by `session.user.id`.
- Teacher views must be class/enrollment scoped; admin-only behavior must be explicit.
- Unauthenticated access should return 401 for APIs and redirect to `/login?callbackUrl=...` for protected pages.
- Authorization failures should be 403, not silent empty success, unless an existing API contract requires otherwise.
- Privacy consent, recording disclosure, soft delete, and retention behavior are product features; do not remove or bypass them.

## Recording And Feedback Rules

Any recording-related task must protect all four states:

- Draft recording in the browser.
- Local IndexedDB fallback.
- Cloud object upload and playback.
- Teacher feedback and student review display.

Required checks for recording changes:

- Browser supports or gracefully rejects MediaRecorder.
- Start, pause, resume, stop, draft playback, delete draft, and save are all coherent.
- Size cap is enforced client-side and server-side.
- Cloud flow remains `sign -> PUT -> PATCH -> list/playback`.
- Failed cloud upload preserves local fallback and shows a clear message.
- History can list, play, refresh, and delete the correct recording.
- Teacher feedback can upsert score, comment, and corrected Japanese.
- Student `/review` shows feedback without exposing other students' data.

## Content And Japanese Quality

- This is not generic Japanese training; it is SAP Japan project language combat training for consultants.
- Preserve the five training actions: listen, read, replace, perform, record.
- Japanese must sound natural in real Japanese SAP project settings. Avoid textbook-only phrases and unnatural literal translation.
- SAP facts must be checked against current local sources or marked `Need Confirmation`.
- Do not invent real customer quotes, company stories, SAP version behavior, transaction codes, or configuration paths.
- Keep Chinese teacher guidance and Japanese student output distinct.
- Do not merge lessons or lesson ranges unless the user explicitly asks.
- Keep uncertainty visible with labels such as `Need Confirmation`, `needs_review`, `source_missing`, or `manual_check_required`.

## Website UX Rules

- The site must remain useful as a working training app, not become a landing page.
- Every main workflow needs a clear entry, back path, empty state, error state, and success state.
- Student routes, teacher routes, and admin/ops information must not blur together.
- Navigation changes must be checked on desktop and mobile.
- Japanese text should use appropriate `lang="ja"` where practical and must not overflow, overlap, or become unreadable.
- Avoid decorative UI that hides the training task. Prioritize fast scanning, practice, recording, review, and teacher action.
- Links must be real and tested; do not add dead routes or placeholder buttons without labeling the state.

## Performance And Maintainability

- Keep heavy lesson markdown, library content, and generated JSON out of first-load bundles when possible.
- Do not add a dependency unless it clearly reduces risk or complexity and fits the existing stack.
- Preserve lazy-loading and static fallback behavior used for CI/mock builds.
- Watch `First Load JS`, large JSON payloads, stale `.next` artifacts, and dev/build cache mismatches.
- Do not generate audio/TTS/media unless explicitly authorized.
- Keep scripts deterministic and fail visibly; no silent data rewrite.

## Verification Gate

Before finishing, run the narrowest sufficient verification:

- Content-only: source pairing, counts, sample Japanese naturalness check, and QA notes.
- Web UI: `npm run typecheck`, `npm run lint`, `npm run build`, plus browser smoke for changed routes.
- Auth/API: unauthenticated 401/redirect checks and authenticated role checks when test sessions are authorized.
- Recording: local recording lifecycle plus cloud and teacher feedback E2E when test accounts/storage permission are authorized.
- Navigation: page matrix for all touched routes and any route linked from a changed nav component.

If a check is not run, final handoff must say exactly why.

## Handoff And History

After meaningful work:

- Update Project 4 state when it can be done without mixing unrelated dirty changes.
- Write an inbox handoff with scope, files changed, verification, not-run items, blockers, and next action.
- Commit task-owned changes with the required message format.
- Leave unrelated dirty files untouched and explicitly mention them if they affect validation.

## Task Start Checklist

Every agent should be able to answer these before editing:

- What exact user request am I satisfying?
- What files am I allowed to change?
- What existing behavior/data must not break?
- What test proves the change worked?
- What will I do if auth, data, source, or scope is missing?

If any answer is unclear, stop and ask through inbox instead of guessing.
