# sap-four-faces

Deterministic orchestrator for the SAP daily-brief 「四面」 pipeline. Replaces
the LLM-glued sequencing that broke on 2026-06-14 (Face1+Face2 done, Face3/4
silently skipped, `.published` falsely written).

Authoritative spec: `HANDOFF.md` (this directory). Read it first.

## Surface

```bash
/usr/bin/python3 sap_four_faces.py status   <edition>     # print per-face + markers
/usr/bin/python3 sap_four_faces.py plan     <edition>     # dry-run plan, no I/O
/usr/bin/python3 sap_four_faces.py run      <edition> [--from faceN] [--only faceN]
/usr/bin/python3 sap_four_faces.py finalize <edition>     # write .published only if all done
/usr/bin/python3 sap_four_faces.py audit-scripts          # verify §6 script paths
```

`<edition>` is `YYYY-MM-DD` (晚上跑→次日；用
`pipeline_stage_gate.py --edition-date` 拿）。

### Environment

| var | effect |
|---|---|
| `SAP_FF_DRYRUN=1` | print every subprocess command, run nothing |
| `SAP_FF_STUDIO`   | override STUDIO root (default `~/news/studio`) |
| `SAP_FF_PIPE`     | override PIPE root (default `~/Documents/OpenClaw/sap-news-pipeline`) |
| `SAP_FF_PYTHON`   | override python interpreter (default `/usr/bin/python3`) |
| `SAP_FF_FACE3_MIN`| target deep-article count (default 4) |

### Exit codes

| code | meaning |
|---|---|
| 0 | success |
| 2 | `needs_content` — a face stopped waiting for LLM-authored content |
| 3 | `blocked` — a face hit a real-truth gate or unrecoverable error |
| 4 | `finalize` refused (at least one face not done) |

## Content pause points (HANDOFF §7)

When a face needs LLM content, the orchestrator writes
`PIPE/working/{edition}/content_request_faceN.md` and exits with code 2.
Fill the requested file, then resume:

```bash
/usr/bin/python3 sap_four_faces.py run <edition> --from faceN
```

The orchestrator **never** writes content itself, and **never** silently skips
a face that lacks content (HANDOFF §0 root cause).

## State

Single source of truth: `PIPE/working/{edition}/four_faces_state.json` (schema
in HANDOFF §4). Status enum: `pending | needs_content | running | blocked | done`.

## Completion evidence per face

| face | done means |
|---|---|
| face1 | `state.faces.face1.mediaId` set (parsed from `publish_draft` output) |
| face2 | all `hotnews_channels_live_confirmation_part*.json` have `errCode == 0` + objectId |
| face3 | `state.faces.face3.articles[].mediaId` populated, count ≥ `SAP_FF_FACE3_MIN` |
| face4 | every event in `short_video_events.json` has `channels_draft_upload_evidence.json` (or `skipped_reuse.json`) |

`finalize` walks the same judgments — it does **not** trust `state.published`
or persisted statuses unless they match the on-disk evidence.

## Invariants (HANDOFF §9 — enforced in code)

1. Faces run in order; `needs_content` halts the run, never skipped.
2. `finalize` writes `.published` / `.channels-published` **only when all four
   faces are done**; otherwise a `PARTIAL` summary is written and an
   osascript notification fires.
3. Face3 selection passes `deep_dedup` (§8) — 14-day window over per-article
   refs, deep_drafts `sourceUrl`, and short_video_events `sourceUrl`.
4. Real-truth gates are mandatory: `lint_main_article`, `verify_article_urls`,
   `lint_public_text`, `publish_draft`'s embedded truth gate. Automation
   never passes `--skip-*`.
5. Known transient failures get one retry; second failure → `blocked`.

## Tests

```bash
cd ~/sap-hub/tools/sap-four-faces
/usr/bin/python3 -m unittest discover -s tests -q
```

Covers per-face completion judgment, `finalize` refusal, and `deep_dedup`
duplicate hits. Stdlib `unittest` only — no external deps.

## Calling convention (for Cowork / Codex)

- Idempotent: re-running `run <edition>` from any face is safe — done faces
  short-circuit with `[SKIP]`.
- Concurrency: single state file, single process per edition. If you need to
  inspect, prefer `status` over editing the json directly.
- Extending a face: add the new step to `faces/faceN.py` `run()` and update
  `plan()` so dry-runs stay honest. Keep heavy logic in the existing scripts
  under STUDIO/PIPE — this orchestrator's job is sequencing, not rewriting.
