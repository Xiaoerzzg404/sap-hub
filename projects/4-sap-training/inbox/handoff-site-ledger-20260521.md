# Handoff · sap-jp.training Site Ledger · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-21T23:59:11+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: local site history ledger, route/content inventory snapshots, and rebuild plan

## Completed

- Added a zero-dependency local ledger CLI at `projects/4-sap-training/web/scripts/site-ledger.mjs`.
- Added package commands:
  - `npm run ledger:snapshot`
  - `npm run ledger:diff`
  - `npm run ledger:check`
  - `npm run ledger:rebuild-plan`
- Added machine/human docs:
  - `projects/4-sap-training/web/docs/SITE_CHANGE_LEDGER.md`
  - `projects/4-sap-training/web/ops/site-ledger/README.md`
  - `projects/4-sap-training/web/ops/site-ledger/config.json`
- Updated `SITE_ARCHITECTURE.md` so local revision workflow includes before/after ledger snapshots, diff report, and rebuild-plan refresh.
- The ledger records route inventory, expected access boundary, middleware coverage, content/data counts, file hashes, package scripts, Git branch/commit, dirty working-tree paths, and restore safety.
- The first ledger check found `/me` was expected to be protected but was not covered by middleware; added `/me/:path*` to the matcher.
- Generated initial and post-verification snapshots:
  - `projects/4-sap-training/web/ops/site-ledger/snapshots/2026-05-21T14-54-05-690Z__initial-site-ledger.json`
  - `projects/4-sap-training/web/ops/site-ledger/snapshots/2026-05-21T14-58-19-480Z__post-verification-site-ledger.json`
- Generated human reports:
  - `projects/4-sap-training/web/ops/site-ledger/reports/2026-05-21T14-54-05-690Z__initial-site-ledger.md`
  - `projects/4-sap-training/web/ops/site-ledger/reports/2026-05-21T14-58-19-480Z__post-verification-site-ledger.md`
  - `projects/4-sap-training/web/ops/site-ledger/reports/2026-05-21T14-58-19-480Z__diff.md`
- Generated latest pointers:
  - `projects/4-sap-training/web/ops/site-ledger/latest.json`
  - `projects/4-sap-training/web/ops/site-ledger/CHANGELOG.md`
  - `projects/4-sap-training/web/ops/site-ledger/REBUILD_PLAN.md`

## Verification

- `node --check scripts/site-ledger.mjs`: PASS.
- `npm run ledger:check`: PASS with 0 errors and 1 warning.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS after clearing stale `.next`.
- `npm run ledger:snapshot -- --label post-verification-site-ledger`: PASS.
- `npm run ledger:diff -- --write`: PASS.
- `npm run ledger:rebuild-plan`: PASS.

## Not Passed / Known Existing Issue

- `npm run build`: NOT PASS.
- Build reached compile/type validation, but failed in Next generated-artifact stages with ENOENT/module-not-found variants under `.next`, including:
  - `.next/server/functions-config-manifest.json`
  - `.next/server/pages-manifest.json`
  - `.next/export/500.html -> .next/server/pages/500.html`
  - missing generated chunks during prerender.
- This matches the previously recorded intermittent Next/Sentry/generated-manifest class in earlier handoff notes. No TypeScript or lint error was reported for the ledger code.

## Restore Safety

- Latest snapshot health: 0 errors, 1 warning.
- `restoreSafety.restoreSafe = false` because the worktree already has unrelated uncommitted changes.
- The ledger is useful for observation and future change comparison now; it becomes a clean disaster-recovery anchor only after unrelated dirty changes are committed/stashed and a fresh snapshot is generated.

## State Note

- `projects/4-sap-training/state/sap_jp_training_course.json` was already dirty before this handoff. I did not edit it to avoid mixing unrelated state changes into the ledger commit.

## Next Action

1. Review and resolve the unrelated dirty worktree items.
2. Run `cd projects/4-sap-training/web && npm run ledger:snapshot -- --label clean-restore-anchor` after the tree is clean.
3. Revisit the existing Next build generated-artifact issue separately from the ledger tool.
