# 交接 · sap-jp.training 公网同步前版本整理 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T08:20:13+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: 昨晚站点更新的版本顺序、ledger 恢复点、本地验证、公网同步确认清单

## scope

本轮只做本地版本管理、验证、台账、state 和 inbox 交接。未执行 `git push`、PR、Vercel deploy、Cloudflare R2 上传、Vercel artifact deploy、Neon 生产 migration/seed、Sentry/Upstash/Resend/Google 控制台变更，也未读取或打印任何 secret 值。

## changed files

- 版本与恢复台账：`web/docs/SITE_CHANGE_LEDGER.md`、`web/ops/site-ledger/CHANGELOG.md`、`web/ops/site-ledger/latest.json`、`web/ops/site-ledger/REBUILD_PLAN.md`、`web/ops/site-ledger/reports/*public-sync*.md`、`web/ops/site-ledger/snapshots/*public-sync*.json`。
- Ledger 工具修正：`web/scripts/site-ledger.mjs`、`web/ops/site-ledger/config.json`，让 ledger 正确识别当前 catch-all middleware 和“只有 /login 匿名可见”的登录墙。
- 运维文档补全：`web/docs/ADMIN_OPS.md` 恢复中文备份 runbook 和用户注销请求 runbook。
- 本轮 state / inbox：`state/sap_jp_training_course.json`、`inbox/handoff-public-sync-20260522.md`、`inbox/need-input-public-sync-20260522.md`。

## version order

1. `576cd4e`：内容审查前 checkpoint。
2. `eeae1fc`：SAP 项目日语内容审校。
3. `03fa6cc`：本地站点审计和 lint 清理。
4. `9526a82`：讲师教练台。
5. `bdc7264`：学员日语自训。
6. `925edbf`：Project 4 agent guardrails。
7. `2ac1869`：`/me` 学员首页和架构文档。
8. `1759ad2`：sap-jp.training site ledger。
9. `d3ba920`：admin ops dashboard。
10. `d0440b1`：credentials login、多角色 RBAC、登录墙。
11. `7aafb74`：中文说明文档规则和交接归档。
12. `3cc1305`：TTS/audio metadata、TermCard 音频路径、本地 audio manifest。
13. 本轮 public-sync commit：state、handoff、need-input、ledger before/after reports。

## validation

- `npm run ledger:snapshot -- --label before-public-sync`：PASS，写入 before snapshot；初次发现 ledger 对 catch-all middleware 的旧判断误报。
- `node --check scripts/site-ledger.mjs`：PASS。
- `npm run ledger:check`：PASS，0 error，1 warning（工作区未提交）。
- `npm run convert:content`：PASS，转换 24 lessons、583 terms、480 phrases。
- `npm run typecheck`：PASS。
- `npm run lint`：PASS。
- `npm run build`：PASS；保留既有 Sentry/OpenTelemetry 与 pg SSL-mode warning。
- Browser smoke on `http://127.0.0.1:3212`：`/login` 可见账号密码工作台；`/me`、`/courses`、`/courses/lessons/lesson_01`、`/audio/phrase/lesson_01-phrase-001.mp3`、`/review`、`/teacher`、`/admin` 均跳到 `/login?callbackUrl=...`。
- HTTP API smoke：`/api/recordings`、`/api/teacher/recordings`、`/api/progress/events`、`/api/cron/cleanup-recordings` 均返回 401。
- `npm run ledger:snapshot -- --label after-public-sync`：PASS，0 error，1 warning（工作区未提交）。
- `npm run ledger:diff -- --write`：PASS。
- `npm run ledger:rebuild-plan`：PASS。

## public sync status

| 平台 | 状态 | 说明 |
|---|---|---|
| GitHub | ready-after-confirmation | 本地分支有清晰 commit；`origin` 是 `Xiaoerzzg404/sap-hub`；本轮未 push。 |
| Vercel | blocked | 本机没有 `vercel` CLI，`web/.vercel` 缺失，`.env.local` 也没有 Vercel API env；只能确认 repo 文档以 Vercel 为部署平台。 |
| Cloudflare R2 / audio | blocked | 本地 R2 录音 env present；1543 个 mp3 本地存在但被 `**/*.mp3` 忽略，需选择 Git force-add、R2/CDN、或 Vercel artifact deploy。 |
| Neon / DB | blocked | migration `0003_auth_credentials_multi_role.sql` 尚未应用到目标生产 DB；未执行 DB reset、seed 或真实数据变更。 |
| Auth / security | local-pass | 未登录页面/API 边界本地通过；403 与 authenticated role routing 需要测试账号/session。 |
| Sentry / monitoring | manual | 本地 `NEXT_PUBLIC_SENTRY_DSN` present；线上 event、issue、release 需控制台确认。 |
| Upstash / rate limit | local-env-present | 本地 REST env present；线上 Vercel env 和 dashboard 用量需确认。 |
| Resend | local-env-present | 本地 `RESEND_API_KEY` present；未发送真实邮件，线上发送记录需 dashboard 确认。 |
| Safe Browsing / Search Console | manual | 仓库只有 admin quick link；状态需人工登录 Google 控制台确认。 |

## blockers

- 公开发布、push/PR、Vercel deploy、R2/CDN 上传、force-add mp3、Vercel artifact deploy、Neon 生产 migration、真实测试账号创建或登录、读取 magic-link token、真实邮件发送，都需要 Ryan 明确确认。
- Authenticated `/me`、课程播放、`/review`、`/teacher`、`/admin` 视觉 smoke 未运行，因为没有测试 student/teacher/admin session，且不能绕过登录。
- `3210` 上已有旧 dev server，`/login` 返回 500；本轮使用 `3212` 完成 smoke，未杀旧进程。

## next action

Ryan 先回复 `need-input-public-sync-20260522.md` 中的选择：是否允许 push/PR、是否允许 Vercel deploy、音频发布策略选 A/B/C、是否允许对目标 Neon 执行 migration 0003、以及测试账号/session 权限。确认前本地工作停在版本台账和验证完成状态。
