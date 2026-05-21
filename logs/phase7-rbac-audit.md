# Phase 7 RBAC Audit · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-21T11:50:47+09:00
- scope: Project 4 web API routes and teacher pages

## Result

No RBAC code gaps were found in the Phase 7 audit pass.

## API Routes

| Route | Session | Role | Student isolation / scope |
|---|---:|---:|---|
| `app/api/auth/[...nextauth]/route.ts` | Public Auth.js handler | n/a | Auth.js-managed email callback/sign-in flow |
| `app/api/lessons/[lessonId]/assets/[kind]/route.ts` | 401 if no session | n/a | Content read only, no student row access |
| `app/api/library/[kind]/route.ts` | 401 if no session | n/a | Content read only, no student row access |
| `app/api/progress/events/route.ts` | 401 if no session | n/a | GET/POST scoped to `progressEvents.studentId = session.user.id` |
| `app/api/recordings/route.ts` | 401 if no session | n/a | GET/POST scoped to `recordings.studentId = session.user.id` |
| `app/api/recordings/sign/route.ts` | 401 if no session | n/a | Insert uses `studentId = session.user.id`; R2 key uses session user prefix |
| `app/api/recordings/[id]/route.ts` | 401 if no session | n/a | PATCH requires `recordings.id` and `recordings.studentId = session.user.id` |
| `app/api/teacher/recordings/route.ts` | 401 if no session | 403 unless teacher/admin | Teacher queries are limited to active enrollments; admin can view all |
| `app/api/teacher/recordings/[id]/feedback/route.ts` | 401 if no session | 403 unless teacher/admin | Teacher feedback requires active enrollment access to the recording's student; admin can access all |

## Teacher Pages

All teacher pages call `auth()` before rendering and redirect non-teacher/non-admin users away from the teacher area:

- `app/teacher/page.tsx`
- `app/teacher/recordings/page.tsx`
- `app/teacher/recordings/[id]/page.tsx`
- `app/teacher/review-terms/page.tsx`

## Follow-up Coupled To Later Phase 7 Tasks

Soft-deleted recordings will be filtered from recording list APIs in subtask 6 after the `deleted_at` column exists.
