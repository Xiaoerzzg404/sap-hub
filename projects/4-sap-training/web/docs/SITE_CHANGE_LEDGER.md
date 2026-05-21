# SITE_CHANGE_LEDGER · sap-jp.training

- updated_by: codex
- updated_at: 2026-05-21T23:45:00+09:00
- scope: how humans and AI tools record local site changes, version history, and rebuild evidence

## What To Use

The local site ledger lives at:

`projects/4-sap-training/web/ops/site-ledger/`

The command-line tool is:

`projects/4-sap-training/web/scripts/site-ledger.mjs`

Run commands from `projects/4-sap-training/web`.

## Standard Workflow

Before a meaningful local-site change:

```bash
npm run ledger:snapshot -- --label before-task-name
```

After the change and validation:

```bash
npm run ledger:check
npm run ledger:snapshot -- --label after-task-name
npm run ledger:diff -- --write
npm run ledger:rebuild-plan
```

## What The Ledger Records

- Git branch, commit, and dirty working-tree paths.
- Page routes and API routes.
- Expected public/protected route status and middleware coverage.
- Runtime data counts and hashes, including lessons, phrases, roleplays, assignments, glossary, library, and coach data.
- Architecture file inventory: pages, components, libs, scripts, docs, DB migrations, public assets, and Project 4 course sources.
- Package scripts and dependency names.
- Human Markdown reports plus machine-readable JSON snapshots.

## What It Does Not Record

- Secret values from `.env.local` or deployment settings.
- `.next`, `node_modules`, TypeScript build cache, or local audio cache.
- Audio/video binaries such as `.mp3`, `.wav`, `.m4a`, `.mp4`.
- Real learner data, session cookies, signed R2 URLs, magic-link tokens, or private feedback text.

## How To Read Snapshot Health

- `error`: a required route/file/security boundary is missing; stop and fix or write need-input.
- `warning`: the site can still be observed, but restore or access-control confidence is lower.
- `info`: no ledger-level issue detected.

`restoreSafety.restoreSafe` is only `true` when the Git working tree is clean. A dirty snapshot is useful for audit, but not sufficient as a disaster-recovery anchor unless the dirty files are committed or separately preserved.

## Disaster-Recovery Use

Generate or refresh the rebuild guide:

```bash
npm run ledger:rebuild-plan
```

Then use:

- `ops/site-ledger/REBUILD_PLAN.md` for the human rebuild steps.
- `ops/site-ledger/latest.json` for machine-readable file, route, data, and Git evidence.
- Git history for actual code/content restoration.

## Required Handoff Note

Any AI tool that changes sap-jp.training should include:

- snapshot label before/after,
- report path,
- `npm run ledger:check` result,
- whether `restoreSafety.restoreSafe` is `true`,
- any warnings that remain.
