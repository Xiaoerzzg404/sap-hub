# Handoff: Auth Credentials And Multi-Role Access Control

- updated_by: codex
- updated_at: 2026-05-22T00:50:00+09:00
- scope: `projects/4-sap-training/web`

## Completed

- Replaced public magic-link entry with email/username plus password registration and login.
- Added `/api/auth/register`; new users receive `student`, while `zzg404@gmail.com` is bootstrapped with `student`, `teacher`, and `admin`.
- Added multi-role helpers and a `user_roles` table so one user can hold several roles.
- Added a logged-out wall: anonymous users only see `/login`; pages redirect to login and protected APIs return `401`.
- Hid header/sidebar/training content before login, and added role-aware navigation after login.
- Guarded student, teacher, admin pages and related APIs with role checks.
- Updated docs for student login, teacher role setup, admin operations, and architecture.

## Verification

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Production smoke on `127.0.0.1:3210`:
  - `/` -> `307 /login?callbackUrl=%2F`
  - `/courses` -> `307 /login?callbackUrl=%2Fcourses`
  - `/audio/phrase/lesson_01-phrase-001.mp3` -> `307 /login?...`
  - `/api/recordings` -> `401 {"error":"unauthorized"}`
  - invalid register payload -> `400 invalid_email`
  - `/login` renders the new authentication workspace without training navigation.

## Not Run

- Did not apply the `0003_auth_credentials_multi_role.sql` migration to Neon or production.
- Did not deploy to Vercel.
- Did not create or print any password or token.

## Next Action

Apply `web/lib/db/migrations/0003_auth_credentials_multi_role.sql` to the intended database, deploy, then register or set a password for the owner account and smoke-test role routing for `zzg404@gmail.com`.
