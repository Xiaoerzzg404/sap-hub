# sap-jp.training Site Ledger

- updated_by: codex
- updated_at: 2026-05-21T23:45:00+09:00
- scope: local monitoring, history ledger, and disaster-recovery index for the sap-jp.training web app

## Purpose

This directory is the local station ledger for sap-jp.training. It records what changed in the site without changing the product itself.

It is designed for both the user and AI tools:

- Humans can read the Markdown reports and changelog.
- AI tools can read `config.json` and `latest.json`.
- Git remains the source of truth for restoring actual code/content.
- Secrets, local caches, `.next`, `node_modules`, and audio binaries are excluded.

## Commands

Run from `projects/4-sap-training/web`:

```bash
npm run ledger:snapshot -- --label before-content-change
npm run ledger:diff
npm run ledger:check
npm run ledger:rebuild-plan
```

## Files

- `config.json`: stable machine-readable scope and rules.
- `latest.json`: latest machine-readable snapshot.
- `snapshots/`: timestamped historical snapshots.
- `reports/`: human-readable snapshot and diff reports.
- `CHANGELOG.md`: append-only ledger timeline.
- `REBUILD_PLAN.md`: current rebuild checklist generated from the latest snapshot.

## Restore Safety Rule

A snapshot is a clean restore anchor only when `restoreSafety.restoreSafe` is `true`.

If the working tree is dirty, the ledger still records the current observable state, but it is not enough by itself to recreate uncommitted file contents. Commit or stash work before using a snapshot as a disaster-recovery point.

## AI Tool Contract

Before changing the local site, an AI tool should:

1. Read `AGENTS.md`, Project 4 guardrails, and this README.
2. Run `npm run ledger:snapshot -- --label before-<task>`.
3. Make the scoped change.
4. Run `npm run ledger:check`, then the narrow required web checks.
5. Run `npm run ledger:snapshot -- --label after-<task>`.
6. Mention the snapshot/report paths in the Project 4 handoff.
