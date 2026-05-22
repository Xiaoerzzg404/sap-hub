# Need Input · sap-jp.training 公网同步确认 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T09:05:00+09:00
- status: answered_for_current_branch

## 需要 Ryan 确认

已由 Ryan 在本轮对 `codex/sap-jp-content-audit-20260521` 给出一次性确认：

- 允许 push 当前分支并创建 draft PR。
- 允许通过 GitHub 触发 Vercel Preview。
- 音频选择 B：R2/CDN；不允许 force-add mp3，不使用 Vercel artifact deploy。
- 允许只执行 `0003_auth_credentials_multi_role.sql`。
- 允许创建/更新三类 smoke 测试账号并执行 authenticated smoke。
- Sentry、Upstash、Resend、Google Search Console / Safe Browsing 由 Ryan 人工登录检查。

下面是原确认清单，保留为审计记录：

1. GitHub：是否允许把 `codex/sap-jp-content-audit-20260521` push 到 GitHub，并创建 PR？如果只允许本地 commit，请明确停在本地。
2. Vercel：是否允许部署到生产 `sap-jp.training`？当前本机没有 `vercel` CLI / `.vercel` project link / Vercel API env，若要部署请提供平台方式或授权使用 GitHub 部署。
3. 音频策略三选一：
   - A. force-add `1543` 个 mp3 到 Git。
   - B. 上传 mp3 到 Cloudflare R2/CDN，并改 manifest/base path。
   - C. 使用 Vercel CLI artifact deploy 包含本地 mp3。
4. Neon / DB：是否允许对目标数据库执行 `web/lib/db/migrations/0003_auth_credentials_multi_role.sql`？不会执行 DB reset，不碰真实学员数据。
5. 测试账号：请提供或确认可创建的测试 student、teacher、admin 账号/session，用于 authenticated `/me`、课程音频播放、`/review`、`/teacher`、`/admin` smoke。
6. 控制台人工检查：请确认 Sentry、Upstash、Resend、Google Search Console / Safe Browsing 是否由 Ryan 人工登录检查，或提供只读 API/token 方式。

## 停手规则

本轮已按确认执行 push、draft PR、Vercel Preview、R2 上传、Neon 0003 migration、smoke 测试账号和 authenticated smoke。

仍然停手：

- 不 merge PR、不触发生产部署，直到 `need-input-production-env-20260522.md` 中的生产 env/CDN/人工检查阻塞消除。
- 不 force-add mp3。
- 不执行 Vercel artifact deploy。
- 不做 DB reset / truncate / 覆盖真实 seed。
- 不发送真实业务邮件、不接管真实账号、不读取 magic-link token。
