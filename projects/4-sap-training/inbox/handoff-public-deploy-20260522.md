# 交接 · sap-jp.training 公网同步执行记录 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T09:05:00+09:00
- branch: codex/sap-jp-content-audit-20260521
- PR: https://github.com/Xiaoerzzg404/sap-hub/pull/1
- Preview: https://sap-jp-training-git-codex-sap-jp-co-0cd67d-xiaoer-ql-s-projects.vercel.app
- Production: https://sap-jp.training（本轮未 merge / 未生产部署）

## scope

按 Ryan 本轮确认，执行 GitHub push、draft PR、Vercel Preview 触发、R2/CDN 音频方案、Neon 0003 migration、smoke 测试账号创建/更新和 authenticated smoke。未提交或打印 token、密码、数据库连接串、API key。

## changed files

- Auth / security：`web/app/api/auth/register/route.ts`、`web/app/login/LoginClient.tsx`、`web/lib/admin/ops-dashboard.ts`、`web/docs/ADMIN_OPS.md`、`web/docs/SITE_ARCHITECTURE.md`、`web/docs/STUDENT_GUIDE.md`、`web/docs/TEACHER_GUIDE.md`。
- Course audio：`web/lib/course-audio.ts`、`web/components/audio/AudioPlayer.tsx`、`web/components/audio/ABRepeatPlayer.tsx`、`web/scripts/upload-course-audio-r2.mjs`、`web/public/audio/audio-manifest.json`、`web/ops/site-ledger/reports/*r2-course-audio-upload.json`。
- Version / ledger：`web/ops/site-ledger/*`、`web/docs/SITE_CHANGE_LEDGER.md`、`logs/content-source-report.md`、`web/data/_meta.json`、`web/data/lessons.json`。
- Handoff / need-input / state：`state/sap_jp_training_course.json`、`inbox/handoff-public-sync-20260522.md`、`inbox/handoff-public-deploy-20260522.md`、`inbox/manual-platform-checklist-20260522.md`、`inbox/need-input-production-env-20260522.md`。

## version order

1. `f46bf29` clean restore anchor before external sync.
2. `61cf0a8` 注册/账号认领/owner bootstrap 加固。
3. `5654676` R2/CDN 课程音频切换与上传脚本；同时记录 auth hardening handoff/state。
4. `4f19d08` 部署前 content conversion 与 ledger before snapshot。
5. `9426318`：Ryan/cowork-bootstrap 补充 R2 音频公网核验 need-input 与 state。
6. `64ce6c5`：deployment handoff、manual checklist、after snapshot、remaining need-input。
7. 本交接后的补充 commit：将 `need-input-audio-r2-verification-20260522.md` 标记为本轮已回答，保留 CDN base URL 阻塞。

## validation

- `npm run ledger:snapshot -- --label before-public-sync`：PASS。
- `npm run convert:content`：PASS，24 lessons、583 terms、480 phrases。
- `npm run ledger:check`：PASS，0 error，0 warning。
- `npm run typecheck`：PASS。
- `npm run lint`：PASS。
- `npm run build`：PASS；保留既有 Sentry/OpenTelemetry 和 pg SSL-mode warning。
- GitHub Actions CI：success，run `26260052508`。
- Vercel Preview：success / Ready Latest。
- Chrome visual smoke：本地 `/login` 可见。
- Authenticated smoke：student `/me`、课程页、课程音频 `/audio/phrase/lesson_01-phrase-001.mp3`、`/review`；teacher `/teacher`；admin `/admin` 全部通过。
- Preview public smoke：`/login` 200；受保护音频路径未登录返回 307 到 `/login?callbackUrl=...`。

## public sync status

| 平台 | 状态 | 证据 / 说明 |
|---|---|---|
| GitHub | done | Branch pushed；draft PR `#1` created；未 merge。 |
| Vercel | preview-done / production-paused | Preview Ready Latest；Production 未部署。 |
| Cloudflare R2 / audio | upload-done / CDN-base-missing | 上传 1543/1543，失败 0，前缀 `course-audio/20260521/`；仍需 `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL`。 |
| Neon / DB | migration-done | 目标 host suffix `...neon.tech`；只执行 `0003_auth_credentials_multi_role.sql`；结果 applied。 |
| Auth / security | local-smoke-pass | 三个 smoke 账号角色正确；未读取 magic-link token。 |
| Sentry / monitoring | manual | 本地 DSN present；Ryan 人工控制台检查。 |
| Upstash / rate limit | manual | 本地 REST env present；Ryan 人工检查用量/异常。 |
| Resend | manual | 本地 env present；未发送真实邮件。 |
| Safe Browsing / Search Console | manual | Ryan 人工检查。 |

## blockers

- Vercel env 未确认：`NEXT_PUBLIC_COURSE_AUDIO_BASE_URL`、`REGISTRATION_INVITE_CODE` 仍需 Ryan 配置/确认。
- R2 对象已上传，但公开 CDN base URL 未配置，本轮未把生产音频路径切到可验证的 CDN。
- Sentry、Upstash、Resend、Google Search Console / Safe Browsing 仍需 Ryan 人工检查。
- PR 仍为 draft；未 merge main；未生产部署。

## rollback

- Git rollback：当前 PR 未 merge，关闭 PR 或不合并即可避免生产代码变化。
- Vercel Preview rollback：无需 rollback；这是 PR Preview。
- Production rollback：本轮未改 production；若后续 merge 出问题，使用 Vercel previous production deployment 回滚。
- DB rollback：0003 是 additive auth migration；如需回滚，先备份 DB，再评估删除 `user_roles`、`users.username/password_hash/password_updated_at` 对 NextAuth 与测试账号的影响，不可直接 reset。
- R2 rollback：课程音频在 `course-audio/20260521/` 前缀；若不使用，保持 Vercel `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL` 未配置即可不走 CDN。删除对象前需 Ryan 单独确认。

## next action

Ryan 完成 `manual-platform-checklist-20260522.md` 与 `need-input-production-env-20260522.md` 后，再决定是否把 PR `#1` 从 draft 转 ready、merge 到 main，并触发 Vercel Production。
