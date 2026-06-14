# sap-four-faces

Deterministic orchestrator for the SAP daily-brief 「四面」 pipeline. Replaces
the LLM-glued sequencing that broke on 2026-06-14 (Face1+Face2 done, Face3/4
silently skipped, `.published` falsely written).

Authoritative spec: `HANDOFF.md` (this directory). Read it first.

## Surface

```bash
/usr/bin/python3 sap_four_faces.py status   <edition>     # print per-face + markers
/usr/bin/python3 sap_four_faces.py plan     <edition>     # dry-run plan, no I/O
/usr/bin/python3 sap_four_faces.py run      <edition> [--from faceN] [--only faceN] [--no-dashboard]
/usr/bin/python3 sap_four_faces.py finalize <edition> [--no-dashboard]
/usr/bin/python3 sap_four_faces.py run-daily [--no-dashboard]
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

## Dashboard auto-refresh (HARDENING §A)

Both `run` and `finalize` call `refresh_dashboard()` after they finish
(success, partial, or blocked) so the 7788 console (`/console/four-faces.html`)
reflects current state without a manual refresh.

The refresh runs `ledger_build.main(["--window", "16"])` then
`sync_dashboard.main()` in-process (with a subprocess fallback). It is
**best-effort**: any failure prints `WARN: dashboard refresh failed: ...`
and **never** affects the orchestrator's exit code.

Skip the refresh by passing `--no-dashboard` or by setting `SAP_FF_DRYRUN=1`.
`status` and `plan` never refresh (they are read-only).

## launchd entry (HARDENING §B)

The single-entry-point launchd routine replaces the scattered
`_run_XXX_only.sh` scripts:

```
launchd/daily.sh                          # bash wrapper: PATH + Playwright env
launchd/com.ryan.sap.four-faces.plist     # launchd template (21:30 Asia/Tokyo)
```

`daily.sh` exports `PATH=/opt/homebrew/bin:/usr/local/bin:...` plus
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` (the bundled Chromium per HANDOFF §1)
and invokes `sap_four_faces.py run-daily`. `run-daily` itself:

1. Computes edition via `STUDIO/scripts/pipeline_stage_gate.py --edition-date`.
2. Runs `cmd_run(edition)` — same logic as the manual `run` subcommand.
3. If all four faces judge `done`, runs `cmd_finalize(edition)`.
4. On `needs_content` / `blocked` / `partial`, fires an `osascript`
   notification so Ryan / Cowork can fill the gap. The script **never**
   fabricates content, **never** writes a fake marker, and **never** adds
   `--skip-truth-gate`.

### Loading the plist (Ryan-only)

Claude Code does **not** `launchctl load` anything. Ryan installs it:

```bash
cp ~/sap-hub/tools/sap-four-faces/launchd/com.ryan.sap.four-faces.plist \
   ~/Library/LaunchAgents/com.ryan.sap.four-faces.plist
# Edit absolute paths if your $HOME differs from /Users/openclawxiaoer.
launchctl unload ~/Library/LaunchAgents/com.ryan.sap.four-faces.plist 2>/dev/null
launchctl load   ~/Library/LaunchAgents/com.ryan.sap.four-faces.plist
# daily.sh is invoked via /bin/bash -lc, so the exec bit on daily.sh is
# not required; chmod +x is recommended for manual invocation.
chmod +x ~/sap-hub/tools/sap-four-faces/launchd/daily.sh
```

Dry-run to verify the plan without running anything:

```bash
SAP_FF_DRYRUN=1 /usr/bin/python3 sap_four_faces.py run-daily
```

## Transient failure classification (HARDENING §C)

`faces._common.classify_transient(report) -> Optional[str]` is a pure
function over the combined stdout+stderr of `run_deep_shorts_all`. It
returns one of three labels:

| label | meaning | orchestrator action |
|---|---|---|
| `unsupported_tokens` | 口播稿引用 token 不在 event.summary | write `content_request_face4.md` with missing tokens, return `needs_content` (no blind retry) |
| `broll_missing` | `selected_bg.mp4` not yet generated | retry the inner script once |
| `cdp_cover_300002` | 视频号 errCode=300002 封面预览未稳 | sleep 8s then retry once |
| `None` | unknown failure | `blocked` immediately |

Retry cap is **1** for the two retryable categories; second failure → `blocked`.

## Calling convention (for Cowork / Codex)

- Idempotent: re-running `run <edition>` from any face is safe — done faces
  short-circuit with `[SKIP]`.
- Concurrency: single state file, single process per edition. If you need to
  inspect, prefer `status` over editing the json directly.
- Extending a face: add the new step to `faces/faceN.py` `run()` and update
  `plan()` so dry-runs stay honest. Keep heavy logic in the existing scripts
  under STUDIO/PIPE — this orchestrator's job is sequencing, not rewriting.
