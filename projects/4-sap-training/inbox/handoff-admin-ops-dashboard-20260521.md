# handoff-admin-ops-dashboard-20260521

- updated_by: codex
- updated_at: 2026-05-22T00:04:00+09:00
- scope: admin operations dashboard for sap-jp.training

## Done

- Added admin-only route `/admin`.
- Added server-only read model `web/lib/admin/ops-dashboard.ts`.
- Added internal Neon-backed counts for users, roles, classes, enrollments, course assets, learning events, recordings, feedback, review terms, and estimated recording storage.
- Added quick links for GitHub, GitHub Actions, Vercel, Cloudflare, Neon, Sentry, Resend, Upstash, Google Search Console, and Safe Browsing appeal.
- Added optional read-only external status readers:
  - GitHub Actions via `GITHUB_REPOSITORY` and optional `GITHUB_TOKEN`.
  - Vercel Deployments via `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, and optional `VERCEL_TEAM_ID`.
- Added environment presence checks that show only configured/missing status, never secret values.
- Added `/admin` to middleware matcher and left the server page role guard as the final authority.
- Added navigation entry `管理监控` in desktop and mobile navigation.
- Updated `web/docs/ADMIN_OPS.md`.

## Security Boundary

- `/admin` requires Auth session role `admin`.
- Logged-out users redirect to `/login?callbackUrl=/admin`.
- Non-admin users redirect to `/`.
- The page is read-only. It does not deploy, mutate DB, delete R2 objects, modify SaaS settings, or start payments.
- API tokens must stay in local `.env.local` or Vercel env, never in git.

## Validation

- `npm run typecheck`: PASS.
- `npm run lint`: PASS exit code; unrelated warning exists in untracked `web/scripts/site-ledger.mjs`.
- `npm run build`: PASS after stopping old dev servers; `/admin` appears as dynamic route.
- `CIRCLE_NODE_TOTAL=1 npm run build`: PASS, used to confirm a transient Next static-generation race was not caused by this change.
- Local smoke: `GET /admin` logged out returns `307` to `/login?callbackUrl=%2Fadmin`.

## Not Done

- Did not deploy to Vercel.
- Did not create GitHub/Vercel API tokens.
- Did not connect Cloudflare, Neon, Sentry, Resend, Upstash, or Google APIs beyond safe quick links and env presence checks.
- Authenticated admin visual smoke remains blocked until Ryan provides or confirms an admin test login path.
