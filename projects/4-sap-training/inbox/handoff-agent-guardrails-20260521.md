# Handoff · Project 4 Agent Guardrails · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-21T23:13:53+09:00
- scope: mandatory cross-agent rules for SAP Japanese training content, site, data, recording, UX, and operations work

## Completed

- Added `projects/4-sap-training/AGENT_GUARDRAILS.md`.
- Linked the guardrails from repository-level `AGENTS.md`.
- Linked the guardrails from Project 4 `_instructions.md`.
- Added a Codex memory note under `.codex/memories/extensions/ad_hoc/notes/`.

## Rule Coverage

- Mandatory startup read order.
- Stop conditions and need-input handling.
- Source-of-truth priority.
- Scope control and dirty worktree handling.
- Data, privacy, auth, recording, feedback, content quality, SAP fact, Japanese naturalness, UX, performance, verification, handoff, and history rules.

## Not Done

- Project state was not edited in this pass because `state/sap_jp_training_course.json` already contained concurrent unstaged changes. To avoid mixing unrelated history, this handoff records the rule addition instead.

## Next Action

Future Project 4 tasks should begin by reading `AGENT_GUARDRAILS.md` immediately after root `AGENTS.md`.
