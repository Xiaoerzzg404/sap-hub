# Phase 6 Handoff · 2026-05-20

- updated_by: codex
- updated_at: 2026-05-20T10:18:00+09:00
- branch: codex/phase-6-storage
- scope: Phase 6「录音上传 R2 + 讲师反馈端到端」

## Commits（10 个）

- `097a3c0` build(deps): add aws-sdk client-s3 and presigner for R2 uploads
- `5c4aae6` feat(storage): R2 S3-compatible client + presigned URL helpers
- `cab30cd` feat(db): teacher_feedback table + 0001 migration applied
- `f2ea575` feat(recordings): direct-to-R2 upload via presigned URL + storage_key writeback
- `d8a8b94` feat(recordings): student GET list returns presigned audio URLs
- `6115450` feat(teacher): recordings list API with enrollment-scoped access + filters
- `cb8cde6` feat(teacher): feedback API upsert + resend notification email
- `58cbc47` feat(teacher): recordings list page + detail page with feedback form
- `65c3e14` feat(review): student review page displays teacher feedback
- `d598edb` chore(state): record Phase 6 completion + meta schema 1.3.0

## Verification 数据

- R2 bucket 文件数: 1（Phase6 E2E webm object）
- DB recordings 行数: 1（含 storageKey 的: 1）
- DB teacher_feedback 行数: 1
- 端到端流程（学生 A session → sign → R2 PUT → PATCH ready → 讲师评 → Resend API accepted → 学生 A /review feedback）: PASS
- 学生 A vs B 隔离: PASS（B `/api/recordings` 看不到 A recording）
- 讲师 enrollment 范围: PASS（讲师能看 A，不能看未 enrollment 的 B）
- 学生访问讲师 API: PASS（403）
- 未登录 API: PASS（401）
- R2 presigned GET: PASS（学生 A audioGetUrl 返回 200）
- presigned URL 过期: PASS（1 秒测试 URL 过期后 403）
- R2 anonymous direct S3 endpoint: PASS as private/non-public（returned 400, not 200；Cloudflare R2 S3 endpoint did not return the prompt's exact 403）
- Resend 邮件通知: PASS at API level（feedback API returned `emailStatus: sent`; Codex cannot independently inspect recipient inbox）

## First Load JS

- `/teacher/recordings`: 108 kB
- `/teacher/recordings/[id]`: 109 kB
- `/review`: 107 kB

## Commands / Checks

- `npm run drizzle:generate`: PASS, generated `0001_aberrant_maginty.sql`.
- `npm run drizzle:migrate`: PASS, applied migration to Neon.
- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- `npm run dev -- --hostname 127.0.0.1 --port 3000`: PASS, local dev server used for API/page smoke.
- Page smoke via dev HTTP + session cookie:
  - `/teacher/recordings`: 200, title rendered.
  - `/teacher/recordings/[id]`: 200, detail title rendered.
  - `/review`: 200, feedback section rendered.

## 遗留 / 风险

- Codex cannot inspect the recipient mailbox, so email verification is limited to Resend API acceptance.
- Anonymous direct R2 S3 endpoint returned 400 rather than exact 403, but it is not public-readable and no raw R2 URL is returned by app APIs.
- E2E left 1 Phase6 test recording row, 1 teacher_feedback row, and 1 R2 webm object as evidence.
- substitutionDrills 仍为 0。
- mp3 还没 TTS 生成（Phase 3.5）。
- 单录音 10 MB 限制已在 sign API、legacy POST metadata check、client check 中存在。
- bucket lifecycle 还没配（90 天归档），留 Phase 7。

## 下一步

等 Ryan / Claude 验收。不要自动接 Phase 7，不合 main，不删分支。
