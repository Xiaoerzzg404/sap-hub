# SITE_ARCHITECTURE · sap-jp.training

- updated_by: codex
- updated_at: 2026-05-21T23:12:00+09:00
- scope: student product architecture, content revision workflow, and deploy discipline

## Product Shape

Phase 1 is a 24-lesson SAP project Japanese speaking course. The website should behave like a training workspace, not a static course library:

- `/me`: student home for current lesson, 24-lesson progress, notes, recordings, and teacher feedback.
- `/dashboard`: daily task view and recommended next lesson.
- `/courses` and `/courses/lessons/[lessonId]`: lesson runtime with source assets, Japanese coach, five-step flow, drills, role play, and assignments.
- `/speaking/*`: focused practice tools for shadowing, repeat playback, recording, self-training, 30-second drills, and 60-second consultant output.
- `/assignments`: task submission surface.
- `/review`: favorites, weak points, teacher feedback, and recording history.
- `/teacher/*`: teacher review, feedback, terms review, and classroom coaching.

## Data Boundaries

Course content and learner data must not be mixed.

| Domain                     | Source of truth                                      | Runtime shape                                          |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Course content             | local Markdown assets under Project 4 course folders | generated JSON and seeded Postgres content tables      |
| Site navigation and labels | Next.js source files                                 | deployed with Vercel build                             |
| Student progress           | `progress_events` plus localStorage fallback         | `/api/progress/events` and client cache                |
| Student recordings         | R2 object storage plus `recordings` metadata         | `/api/recordings`, soft delete, signed playback        |
| Teacher feedback           | `teacher_feedback`                                   | student `/review` and `/me`, teacher review pages      |
| Student notes              | browser localStorage in current beta                 | future DB table if cross-device notes become necessary |

Stable lesson ids such as `lesson_01` should survive content rewrites. A rewrite changes the lesson revision, not the identity of the student's progress row.

## Revision Workflow

Do not edit production directly. The safe path is:

1. Create or use a local branch in `sap-hub`.
2. Run `npm run ledger:snapshot -- --label before-<task>` from `projects/4-sap-training/web`.
3. Revise course Markdown, page labels, or feature code locally.
4. Run content conversion if content changed: `npm run convert:content`.
5. If DB seed data changed, run the seed/migration flow against the intended local or staging DB first.
6. Run `npm run ledger:check`, `npm run typecheck`, `npm run lint`, and `npm run build` from `projects/4-sap-training/web`.
7. Browser-smoke the changed pages locally.
8. Run `npm run ledger:snapshot -- --label after-<task>`, `npm run ledger:diff -- --write`, and `npm run ledger:rebuild-plan`.
9. Commit with the agent message format required by `AGENTS.md`.
10. Deploy to Vercel only after local verification.
11. After deploy, check public pages, login, Sentry, and the affected learner/teacher flow.

This applies to page labels, navigation, course text, audio paths, TTS assets, recording flows, privacy text, and teacher feedback UI.

## Content Versioning

The current site has `_meta.schemaVersion = 1.4.0`. Future revisions should add explicit release metadata before larger beta changes:

- `contentRelease`: human label, for example `2026-06-beta-01`.
- `lessonRevisions`: per lesson revision id, source path, generated timestamp, and reviewer status.
- `migrationNotes`: what changed for students who already started the course.

Recommended rule: never invalidate existing progress automatically. If a lesson is heavily rewritten, show the student that a new revision exists and let the teacher decide whether the class should redo it.

## Site Ledger

Use `docs/SITE_CHANGE_LEDGER.md` and `ops/site-ledger/` as the local history ledger for sap-jp.training changes. The ledger records route maps, content hashes, data counts, package scripts, Git dirty state, and rebuild instructions in JSON/Markdown so both the user and AI tools can identify what changed and how to recover the site.

## Near-Term Architecture Decisions

- Keep `/me` as the student's primary re-entry page.
- Keep `/review` for deeper review and feedback history.
- Keep notes local for beta unless students need cross-device notes.
- Treat TTS audio as generated assets: create locally with `AZURE_SPEECH_KEY`, verify paths, then deploy.
- Treat Sentry, Safe Browsing, and beta-student feedback as operations signals that feed back into local fixes before the next deploy.
